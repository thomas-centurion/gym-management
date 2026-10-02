import "dotenv/config";
import pool from "./config/database.js";
import { calculateMembershipEndDate, firstDayOfMonth } from "./utils/membership-dates.js";

type MembershipRow = {
  id: number;
  user_id: number;
  plan: "monthly" | "quarterly" | "annual";
  start_date: string;
  end_date: string;
  status: "active" | "pending";
  next_plan: string | null;
  cancel_at_end: boolean;
  is_current: boolean;
  payment_count: number;
  today: string;
};

const apply = process.argv.includes("--apply");
const idsArgument = process.argv.find((argument) => argument.startsWith("--ids="));
const requestedIds = idsArgument?.slice("--ids=".length).split(",").filter(Boolean).map(Number);

const run = async () => {
  if (apply && (!requestedIds?.length || requestedIds.some((id) => !Number.isInteger(id) || id <= 0))) {
    throw new Error("Para aplicar, indique IDs revisados con --apply --ids=12,34");
  }

  const client = await pool.connect();
  try {
    if (apply) await client.query("BEGIN");

    const result = await client.query<MembershipRow>(
      `SELECT
        m.id,
        m.user_id,
        m.plan,
        TO_CHAR(m.start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(m.end_date, 'YYYY-MM-DD') AS end_date,
        m.status,
        m.next_plan,
        m.cancel_at_end,
        m.is_current,
        (SELECT COUNT(*)::int FROM payments p WHERE p.membership_id = m.id) AS payment_count,
        TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS today
      FROM memberships m
      WHERE (m.is_current = TRUE OR m.start_date > CURRENT_DATE)
        AND m.end_date >= CURRENT_DATE
        AND m.status IN ('active', 'pending')
        AND m.next_plan IS NULL
        AND m.cancel_at_end = FALSE
      ORDER BY m.id${apply ? " FOR UPDATE OF m" : ""}`
    );

    const proposed = result.rows.map((row) => {
      const startDate = firstDayOfMonth(row.start_date);
      const endDate = calculateMembershipEndDate(startDate, row.plan);
      return { ...row, proposed_start_date: startDate, proposed_end_date: endDate };
    }).filter((row) => row.start_date !== row.proposed_start_date || row.end_date !== row.proposed_end_date);
    const candidates = proposed.filter((row) => row.proposed_end_date >= row.today);
    const skippedForPastEnd = proposed.filter((row) => row.proposed_end_date < row.today);

    console.table(candidates.map(({ id, user_id, plan, start_date, end_date, proposed_start_date, proposed_end_date, status, is_current, payment_count }) => ({
      id, user_id, plan, status, is_current, start_date, end_date,
      proposed_start_date, proposed_end_date, payment_count,
    })));
    console.log(`${candidates.length} membresía(s) elegible(s) con fechas por ajustar.`);
    console.log(`Se excluyen ${skippedForPastEnd.length} registro(s) cuya fecha final propuesta ya pasó: ${skippedForPastEnd.map((row) => row.id).join(", ") || "ninguno"}.`);
    console.log("También se excluyen registros históricos/vencidos y registros con next_plan o cancel_at_end para revisión manual.");

    if (apply) {
      const candidateIds = candidates.map((row) => row.id).sort((a, b) => a - b);
      const selectedIds = [...requestedIds!].sort((a, b) => a - b);
      if (new Set(selectedIds).size !== selectedIds.length || selectedIds.some((id, index) => id !== candidateIds[index]) || selectedIds.length !== candidateIds.length) {
        throw new Error(`La selección debe coincidir exactamente con los IDs elegibles mostrados: ${candidateIds.join(",") || "ninguno"}`);
      }

      for (const row of candidates) {
        await client.query(
          "UPDATE memberships SET start_date = $1, end_date = $2 WHERE id = $3",
          [row.proposed_start_date, row.proposed_end_date, row.id]
        );
      }
      await client.query("COMMIT");
      console.log(`Migración confirmada: ${candidates.length} registro(s).`);
    } else {
      console.log("Vista previa únicamente. Revisá estos IDs antes de ejecutar con --apply --ids=<IDs exactos>.");
      if (apply) await client.query("ROLLBACK");
    }
  } catch (error) {
    if (apply) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
