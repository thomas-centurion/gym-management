import pool from "../config/database.js";

// obtiene todos los pagos registrados
export const getPayments = async () => {
  const result = await pool.query(
    `SELECT
      id,
      membership_id,
      amount,
      payment_date
    FROM payments
    ORDER BY id`
  );

  return result.rows;
};

// obtiene los pagos pertenecientes a un socio
export const getPaymentsByUserId = async (userId: number) => {
  const result = await pool.query(
    `SELECT
      p.id,
      p.membership_id,
      p.amount,
      p.payment_date
    FROM payments p
    INNER JOIN memberships m
      ON p.membership_id = m.id
    WHERE m.user_id = $1
    ORDER BY p.id DESC`,
    [userId]
  );

  return result.rows;
};

// obtiene un pago por su ID
export const findPaymentById = async (id: number) => {
  const result = await pool.query(
    `SELECT
      id,
      membership_id,
      amount,
      payment_date
    FROM payments
    WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// crea un nuevo pago
export const createPayment = async (
  membershipId: number,
  amount: number,
  paymentDate: string
) => {
  const result = await pool.query(
    `INSERT INTO payments (
      membership_id,
      amount,
      payment_date
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      membership_id,
      amount,
      payment_date`,
    [membershipId, amount, paymentDate]
  );

  return result.rows[0];
};

// registra un pago y crea la nueva etapa de membresía dentro de una transacción
export const processMembershipPayment = async (
  userId: number,
  currentMembershipId: number,
  plan: string,
  amount: number,
  startDate: string,
  endDate: string,
  isCurrent: boolean
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // se bloquea la membresía actual para evitar operaciones simultáneas
    const membershipResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        start_date,
        end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE`,
      [currentMembershipId, userId]
    );

    const currentMembership = membershipResult.rows[0];

    if (!currentMembership) {
      throw new Error("Membresía no encontrada");
    }

    // la nueva membresía queda actual solamente si comienza ahora
    const newMembershipResult = await client.query(
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
      VALUES ($1, $2, $3, $4, 'active', NULL, FALSE, $5)
      RETURNING
        id,
        user_id,
        plan,
        start_date,
        end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current`,
      [userId, plan, startDate, endDate, isCurrent]
    );

    const newMembership = newMembershipResult.rows[0];

    // el pago queda asociado a la nueva etapa que acaba de comprar el socio
    const paymentResult = await client.query(
      `INSERT INTO payments (
        membership_id,
        amount,
        payment_date
      )
      VALUES ($1, $2, CURRENT_DATE)
      RETURNING
        id,
        membership_id,
        amount,
        payment_date`,
      [newMembership.id, amount]
    );

    const payment = paymentResult.rows[0];

    // si la nueva etapa comienza ahora, la membresía anterior deja de ser actual
    if (isCurrent) {
      await client.query(
        `UPDATE memberships
         SET is_current = FALSE
         WHERE id = $1`,
        [currentMembership.id]
      );
    }

    await client.query("COMMIT");

    return {
      payment,
      membership: newMembership,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// procesa un cambio de plan
export const processPlanChange = async (
  userId: number,
  currentMembershipId: number,
  plan: string,
  amount: number,
  startDate: string,
  endDate: string
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // bloquea la membresía actual durante la operación
    const membershipResult = await client.query(
      `SELECT
        id,
        user_id,
        plan,
        start_date,
        end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current
      FROM memberships
      WHERE id = $1
        AND user_id = $2
      FOR UPDATE`,
      [currentMembershipId, userId]
    );

    const currentMembership = membershipResult.rows[0];

    if (!currentMembership) {
      throw new Error("Membresía no encontrada");
    }

    // crea la nueva membresía futura
    const newMembershipResult = await client.query(
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
      VALUES ($1, $2, $3, $4, 'active', NULL, FALSE, FALSE)
      RETURNING
        id,
        user_id,
        plan,
        start_date,
        end_date,
        status,
        next_plan,
        cancel_at_end,
        is_current`,
      [userId, plan, startDate, endDate]
    );

    const newMembership = newMembershipResult.rows[0];

    // registra el pago correspondiente al nuevo plan
    const paymentResult = await client.query(
      `INSERT INTO payments (
        membership_id,
        amount,
        payment_date
      )
      VALUES ($1, $2, CURRENT_DATE)
      RETURNING
        id,
        membership_id,
        amount,
        payment_date`,
      [newMembership.id, amount]
    );

    const payment = paymentResult.rows[0];

    // guarda el cambio de plan en la membresía actual
    const updatedMembershipResult = await client.query(
      `UPDATE memberships
       SET next_plan = $1
       WHERE id = $2
       RETURNING
         id,
         user_id,
         plan,
         start_date,
         end_date,
         status,
         next_plan,
         cancel_at_end,
         is_current`,
      [plan, currentMembershipId]
    );

    const updatedMembership = updatedMembershipResult.rows[0];

    await client.query("COMMIT");

    return {
      payment,
      membership: newMembership,
      currentMembership: updatedMembership,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};