import pool from "../config/database.js";

// obtiene todas las membresías
export const getMemberships = async () => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      plan,
      TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
      status,
      next_plan,
      cancel_at_end,
      is_current
    FROM memberships
    ORDER BY id`
  );

  return result.rows;
};

export const deletePendingMembership = async (id: number, today: string) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const membershipResult = await client.query(
      `SELECT
        id,
        status,
        is_current,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date
      FROM memberships
      WHERE id = $1
      FOR UPDATE`,
      [id]
    );
    const membership = membershipResult.rows[0];

    if (!membership) {
      throw new Error("Membresía no encontrada");
    }
    if (membership.status !== "pending") {
      throw new Error("Solo se pueden eliminar membresías pendientes");
    }
    if (membership.is_current) {
      throw new Error("No se puede eliminar una membresía pendiente que está marcada como actual");
    }
    if (membership.start_date <= today || membership.end_date < today) {
      throw new Error("No se puede eliminar una membresía que ya comenzó o finalizó");
    }

    const paymentsResult = await client.query(
      "SELECT 1 FROM payments WHERE membership_id = $1 LIMIT 1",
      [id]
    );
    if (paymentsResult.rowCount) {
      throw new Error("No se puede eliminar una membresía con pagos asociados");
    }

    const referencesResult = await client.query(
      `SELECT
        child_namespace.nspname AS schema_name,
        child_table.relname AS table_name,
        child_column.attname AS column_name
      FROM pg_constraint foreign_key
      JOIN pg_class parent_table ON parent_table.oid = foreign_key.confrelid
      JOIN pg_namespace parent_namespace ON parent_namespace.oid = parent_table.relnamespace
      JOIN pg_class child_table ON child_table.oid = foreign_key.conrelid
      JOIN pg_namespace child_namespace ON child_namespace.oid = child_table.relnamespace
      JOIN LATERAL unnest(foreign_key.conkey) WITH ORDINALITY AS child_key(attnum, ord) ON TRUE
      JOIN LATERAL unnest(foreign_key.confkey) WITH ORDINALITY AS parent_key(attnum, ord)
        ON parent_key.ord = child_key.ord
      JOIN pg_attribute child_column
        ON child_column.attrelid = child_table.oid AND child_column.attnum = child_key.attnum
      JOIN pg_attribute parent_column
        ON parent_column.attrelid = parent_table.oid AND parent_column.attnum = parent_key.attnum
      WHERE foreign_key.contype = 'f'
        AND foreign_key.confrelid = to_regclass('memberships')
        AND parent_column.attname = 'id'`
    );

    for (const reference of referencesResult.rows) {
      const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
      const tableName = `${quoteIdentifier(reference.schema_name)}.${quoteIdentifier(reference.table_name)}`;
      const columnName = quoteIdentifier(reference.column_name);
      const dependentResult = await client.query(
        `SELECT 1 FROM ${tableName} WHERE ${columnName} = $1 LIMIT 1`,
        [id]
      );

      if (dependentResult.rowCount) {
        throw new Error("No se puede eliminar la membresía porque tiene otros registros asociados");
      }
    }

    const deleteResult = await client.query(
      `DELETE FROM memberships
      WHERE id = $1
        AND status = 'pending'
        AND is_current = FALSE
        AND start_date > $2::date
        AND end_date >= $2::date
      RETURNING id`,
      [id, today]
    );

    if (!deleteResult.rowCount) {
      throw new Error("No se pudo confirmar que la membresía siga siendo eliminable");
    }

    await client.query("COMMIT");
    return deleteResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
      throw new Error("No se puede eliminar la membresía porque tiene otros registros asociados");
    }

    throw error;
  } finally {
    client.release();
  }
};

// obtiene una membresía por su ID
export const findMembershipById = async (id: number) => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      plan,
      TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
      status,
      next_plan,
      cancel_at_end,
      is_current
    FROM memberships
    WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// sincroniza las membresías de un socio cuando comienza una nueva etapa
export const syncCurrentMembershipByUserId = async (userId: number) => {
  // The existing GET endpoint must stay read-only in demo mode. Normal
  // installations retain the established membership synchronization logic.
  if (process.env.DEMO_MODE === "true") {
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        plan,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE user_id = $1
        AND is_current = TRUE
      ORDER BY id DESC
      LIMIT 1`,
      [userId]
    );
    return result.rows[0];
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // busca la membresía actual del socio y la bloquea
    const currentResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE user_id = $1
        AND is_current = TRUE
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE`,
      [userId]
    );

    const currentMembership = currentResult.rows[0];

    if (!currentMembership) {
      await client.query("COMMIT");
      return undefined;
    }

    // obtiene la fecha actual de la base de datos
    const todayResult = await client.query(
      `SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS current_date`
    );

    const today = todayResult.rows[0].current_date;
    const currentEndDate = currentMembership.end_date;

    // no cambia nada mientras la membresía actual siga vigente
    if (currentEndDate >= today) {
      await client.query("COMMIT");
      return currentMembership;
    }

    // busca una membresía futura que ya debería comenzar y que no haya sido cancelada
    const futureResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE user_id = $1
        AND is_current = FALSE
        AND status = 'active'
        AND cancel_at_end = FALSE
        AND start_date <= CURRENT_DATE
      ORDER BY start_date ASC, id ASC
      LIMIT 1
      FOR UPDATE`,
      [userId]
    );

    const futureMembership = futureResult.rows[0];

    if (!futureMembership) {
      // si no hay una nueva membresía válida, la actual queda pendiente
      const updatedResult = await client.query(
        `UPDATE memberships
         SET status = 'pending',
             next_plan = NULL
         WHERE id = $1
         RETURNING
           id,
           user_id,
           plan,
           TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
           TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
           status,
           next_plan,
           cancel_at_end,
           is_current`,
        [currentMembership.id]
      );

      await client.query("COMMIT");

      return updatedResult.rows[0];
    }

    // marca la membresía anterior como histórica
    await client.query(
      `UPDATE memberships
       SET is_current = FALSE,
           status = 'pending',
           next_plan = NULL
       WHERE id = $1`,
      [currentMembership.id]
    );

    // activa la nueva membresía
    const activatedResult = await client.query(
      `UPDATE memberships
       SET is_current = TRUE,
           status = 'active',
           cancel_at_end = FALSE
       WHERE id = $1
       RETURNING
         id,
         user_id,
         plan,
         TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
         status,
         next_plan,
         cancel_at_end,
         is_current`,
      [futureMembership.id]
    );

    await client.query("COMMIT");

    return activatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// obtiene la membresía actual de un socio
export const findCurrentMembershipByUserId = async (userId: number) => {
  return await syncCurrentMembershipByUserId(userId);
};

// crea una nueva membresía
export const createMembership = async (
  userId: number,
  plan: string,
  startDate: string,
  endDate: string,
  status: string
) => {
  const result = await pool.query(
    `INSERT INTO memberships (
      user_id,
      plan,
      start_date,
      end_date,
      status,
      next_plan,
      cancel_at_end,
      is_current
    )
    VALUES ($1, $2, $3, $4, $5, NULL, FALSE, TRUE)
    RETURNING
      id,
      user_id,
      plan,
      TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
      status,
      next_plan,
      cancel_at_end,
      is_current`,
    [
      userId,
      plan,
      startDate,
      endDate,
      status,
    ]
  );

  return result.rows[0];
};

// actualiza una membresía
export const updateMembership = async (
  id: number,
  plan: string,
  startDate: string,
  endDate: string,
  status: string,
  nextPlan: string | null,
  cancelAtEnd: boolean,
  isCurrent: boolean
) => {
  const result = await pool.query(
    `UPDATE memberships
     SET plan = $1,
         start_date = $2,
         end_date = $3,
         status = $4,
         next_plan = $5,
         cancel_at_end = $6,
         is_current = $7
     WHERE id = $8
     RETURNING
       id,
       user_id,
       plan,
       TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
       TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
       status,
       next_plan,
       cancel_at_end,
       is_current`,
    [
      plan,
      startDate,
      endDate,
      status,
      nextPlan,
      cancelAtEnd,
      isCurrent,
      id,
    ]
  );

  return result.rows[0];
};

// cancela una membresía al finalizar el período actual
export const cancelMembership = async (
  userId: number,
  membershipId: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // busca y bloquea la membresía actual
    const currentResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE`,
      [membershipId, userId]
    );

    const currentMembership = currentResult.rows[0];

    if (!currentMembership) {
      throw new Error("Membresía no encontrada");
    }

    // cancela la membresía actual al finalizar su período
    const updatedCurrentResult = await client.query(
      `UPDATE memberships
       SET cancel_at_end = TRUE
       WHERE id = $1
       RETURNING
         id,
         user_id,
         plan,
         TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
         status,
         next_plan,
         cancel_at_end,
         is_current`,
      [membershipId]
    );

    const updatedCurrentMembership =
      updatedCurrentResult.rows[0];

    let futureMembership;

    // si existe un cambio de plan, también lo cancela
    if (currentMembership.next_plan) {
      const futureResult = await client.query(
        `UPDATE memberships
         SET status = 'pending',
             cancel_at_end = TRUE
         WHERE user_id = $1
           AND is_current = FALSE
           AND plan = $2
           AND start_date = $3
         RETURNING
           id,
           user_id,
           plan,
           TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
           TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
           status,
           next_plan,
           cancel_at_end,
           is_current`,
        [
          userId,
          currentMembership.next_plan,
          currentMembership.end_date,
        ]
      );

      futureMembership = futureResult.rows[0];
    }

    await client.query("COMMIT");

    return {
      membership: updatedCurrentMembership,
      futureMembership,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// deshace la cancelación de una membresía
export const undoMembershipCancellation = async (
  userId: number,
  membershipId: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // busca y bloquea la membresía actual
    const currentResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE`,
      [membershipId, userId]
    );

    const currentMembership = currentResult.rows[0];

    if (!currentMembership) {
      throw new Error("Membresía no encontrada");
    }

    // quita la cancelación de la membresía actual
    const updatedCurrentResult = await client.query(
      `UPDATE memberships
       SET cancel_at_end = FALSE
       WHERE id = $1
       RETURNING
         id,
         user_id,
         plan,
         TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
         TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
         status,
         next_plan,
         cancel_at_end,
         is_current`,
      [membershipId]
    );

    const updatedCurrentMembership =
      updatedCurrentResult.rows[0];

    let futureMembership;

    // si había un cambio de plan cancelado, también lo restaura
    if (currentMembership.next_plan) {
      const futureResult = await client.query(
        `UPDATE memberships
         SET status = 'active',
             cancel_at_end = FALSE
         WHERE user_id = $1
           AND is_current = FALSE
           AND plan = $2
           AND start_date = $3
           AND cancel_at_end = TRUE
         RETURNING
           id,
           user_id,
           plan,
           TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
           TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
           status,
           next_plan,
           cancel_at_end,
           is_current`,
        [
          userId,
          currentMembership.next_plan,
          currentMembership.end_date,
        ]
      );

      futureMembership = futureResult.rows[0];
    }

    await client.query("COMMIT");

    return {
      membership: updatedCurrentMembership,
      futureMembership,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// marca una membresía como histórica
export const markMembershipAsHistorical = async (id: number) => {
  const result = await pool.query(
    `UPDATE memberships
     SET is_current = FALSE
     WHERE id = $1
     RETURNING
       id,
       user_id,
       plan,
       TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
       TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
       status,
       next_plan,
       cancel_at_end,
       is_current`,
    [id]
  );

  return result.rows[0];
};

// busca una membresía futura activa de un socio
export const findFutureMembershipByUserId = async (
  userId: number
) => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      plan,
      TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date,
      status,
      next_plan,
      cancel_at_end,
      is_current
    FROM memberships
    WHERE user_id = $1
      AND is_current = FALSE
      AND status = 'active'
      AND start_date > CURRENT_DATE
    ORDER BY start_date ASC, id ASC
    LIMIT 1`,
    [userId]
  );

  return result.rows[0];
};
