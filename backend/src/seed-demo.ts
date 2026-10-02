import bcrypt from "bcrypt";
import pool from "./config/database.js";
import { planPrices } from "./services/payments.service.js";
import {
  calculateMembershipEndDate,
  firstDayAfterPeriod,
  firstDayOfMonth,
  type MembershipPlan,
} from "./utils/membership-dates.js";

const demoAccounts = [
  {
    key: "sofia",
    firstName: "Sofía",
    lastName: "Demo",
    email: "sofia.demo@gym.com",
    password: "DemoSocio1-2026!",
    role: "member" as const,
  },
  {
    key: "lucas",
    firstName: "Lucas",
    lastName: "Demo",
    email: "lucas.demo@gym.com",
    password: "DemoSocio2-2026!",
    role: "member" as const,
  },
  {
    key: "emilia",
    firstName: "Emilia",
    lastName: "Demo",
    email: "emilia.demo@gym.com",
    password: "DemoSocio3-2026!",
    role: "member" as const,
  },
  {
    key: "bruno",
    firstName: "Bruno",
    lastName: "Demo",
    email: "bruno.demo@gym.com",
    password: "DemoSocio4-2026!",
    role: "member" as const,
  },
  {
    key: "julia",
    firstName: "Julia",
    lastName: "Demo",
    email: "julia.demo@gym.com",
    password: "DemoSocio5-2026!",
    role: "member" as const,
  },
] as const;

const demoAdmin = {
  firstName: "Administrador",
  lastName: "Demo",
  email: "demo-admin@gym.com",
  password: "DemoAdmin2026!",
  role: "admin" as const,
};

const expectedAccounts = [demoAdmin, ...demoAccounts];
const expectedCounts = { users: 6, memberships: 7, payments: 7, attendances: 11 };

const getArgentinaDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
};

const shiftMonthStart = (date: string, monthOffset: number): string => {
  const [year, month] = firstDayOfMonth(date).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  return shifted.toISOString().slice(0, 10);
};

const shiftDate = (date: string, dayOffset: number): string => {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + dayOffset);
  return shifted.toISOString().slice(0, 10);
};

type SeedMembership = {
  accountKey: (typeof demoAccounts)[number]["key"];
  plan: MembershipPlan;
  startDate: string;
  status: "active" | "pending";
  nextPlan: MembershipPlan | null;
  isCurrent: boolean;
  paymentDate: string;
};

const buildMemberships = (today: string): SeedMembership[] => {
  const currentMonth = firstDayOfMonth(today);
  const currentMonthlyEnd = calculateMembershipEndDate(currentMonth, "monthly");
  const futureQuarterlyStart = firstDayAfterPeriod(currentMonthlyEnd);
  const juliaHistoryStart = shiftMonthStart(today, -5);

  return [
    { accountKey: "sofia", plan: "monthly", startDate: currentMonth, status: "active", nextPlan: null, isCurrent: true, paymentDate: today },
    { accountKey: "lucas", plan: "quarterly", startDate: shiftMonthStart(today, -2), status: "active", nextPlan: null, isCurrent: true, paymentDate: shiftMonthStart(today, -2) },
    { accountKey: "emilia", plan: "annual", startDate: shiftMonthStart(today, -9), status: "active", nextPlan: null, isCurrent: true, paymentDate: shiftMonthStart(today, -9) },
    { accountKey: "bruno", plan: "monthly", startDate: currentMonth, status: "active", nextPlan: "quarterly", isCurrent: true, paymentDate: today },
    { accountKey: "bruno", plan: "quarterly", startDate: futureQuarterlyStart, status: "active", nextPlan: null, isCurrent: false, paymentDate: today },
    { accountKey: "julia", plan: "quarterly", startDate: juliaHistoryStart, status: "pending", nextPlan: null, isCurrent: false, paymentDate: juliaHistoryStart },
    { accountKey: "julia", plan: "monthly", startDate: currentMonth, status: "active", nextPlan: null, isCurrent: true, paymentDate: today },
  ];
};

const buildAttendances = (today: string, juliaHistoryStart: string) => [
  { accountKey: "sofia", date: today },
  { accountKey: "lucas", date: today },
  { accountKey: "lucas", date: shiftDate(today, -1) },
  { accountKey: "lucas", date: shiftDate(today, -3) },
  { accountKey: "emilia", date: today },
  { accountKey: "emilia", date: shiftDate(today, -1) },
  { accountKey: "emilia", date: shiftDate(today, -3) },
  { accountKey: "bruno", date: today },
  { accountKey: "julia", date: today },
  { accountKey: "julia", date: shiftDate(juliaHistoryStart, 30) },
  { accountKey: "julia", date: shiftDate(juliaHistoryStart, 60) },
];

const verifySchema = async (client: import("pg").PoolClient) => {
  const result = await client.query(
    `SELECT
       to_regclass('public.users') IS NOT NULL AS users,
       to_regclass('public.memberships') IS NOT NULL AS memberships,
       to_regclass('public.payments') IS NOT NULL AS payments,
       to_regclass('public.attendances') IS NOT NULL AS attendances`
  );

  if (Object.values(result.rows[0]).some((exists) => !exists)) {
    throw new Error("Falta el schema inicial; ejecutá db:init en la base demo antes del seed.");
  }
};

const getTableCounts = async (client: import("pg").PoolClient) => {
  const result = await client.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users) AS users,
       (SELECT COUNT(*)::int FROM memberships) AS memberships,
       (SELECT COUNT(*)::int FROM payments) AS payments,
       (SELECT COUNT(*)::int FROM attendances) AS attendances`
  );

  return result.rows[0] as typeof expectedCounts;
};

const alreadySeeded = async (client: import("pg").PoolClient): Promise<boolean> => {
  const emails = expectedAccounts.map((account) => account.email);
  const usersResult = await client.query(
    `SELECT id, first_name, last_name, email, role
     FROM users
     WHERE email = ANY($1::varchar[])`,
    [emails]
  );

  if (usersResult.rowCount === 0) return false;

  if (usersResult.rowCount !== expectedAccounts.length) {
    throw new Error("Hay cuentas demo preexistentes incompletas; no se hicieron cambios.");
  }

  for (const account of expectedAccounts) {
    const user = usersResult.rows.find((row) => row.email === account.email);
    if (
      !user ||
      user.first_name !== account.firstName ||
      user.last_name !== account.lastName ||
      user.role !== account.role
    ) {
      throw new Error("Una cuenta demo preexistente no coincide con el seed; no se hicieron cambios.");
    }
  }

  const userIds = usersResult.rows.map((user) => user.id);
  const dataResult = await client.query(
    `SELECT
       (SELECT COUNT(*)::int FROM memberships WHERE user_id = ANY($1::int[])) AS memberships,
       (SELECT COUNT(*)::int FROM payments p JOIN memberships m ON m.id = p.membership_id WHERE m.user_id = ANY($1::int[])) AS payments,
       (SELECT COUNT(*)::int FROM attendances WHERE user_id = ANY($1::int[])) AS attendances`,
    [userIds]
  );
  const counts = dataResult.rows[0];

  if (
    counts.memberships !== expectedCounts.memberships ||
    counts.payments !== expectedCounts.payments ||
    counts.attendances !== expectedCounts.attendances
  ) {
    throw new Error("Las cuentas demo existen, pero sus datos no coinciden con un seed completo; no se hicieron cambios.");
  }

  return true;
};

const seedDemo = async () => {
  let client: import("pg").PoolClient | undefined;
  let transactionStarted = false;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL debe estar configurada en el entorno para ejecutar el seed demo.");
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    await verifySchema(client);

    if (await alreadySeeded(client)) {
      const counts = await getTableCounts(client);
      await client.query("COMMIT");
      transactionStarted = false;
      console.log("El seed demo ya estaba aplicado; no se duplicaron datos.");
      console.log("Totales actuales:", counts);
      return;
    }

    const today = getArgentinaDate();
    const memberships = buildMemberships(today);
    const juliaHistoryStart = shiftMonthStart(today, -5);
    const attendanceRows = buildAttendances(today, juliaHistoryStart);
    const passwordHashes = new Map<string, string>();

    for (const account of expectedAccounts) {
      passwordHashes.set(account.email, await bcrypt.hash(account.password, 10));
    }

    const userIds = new Map<string, number>();

    for (const account of expectedAccounts) {
      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, password, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [account.firstName, account.lastName, account.email, passwordHashes.get(account.email), account.role]
      );
      if ("key" in account) userIds.set(account.key, userResult.rows[0].id);
    }

    for (const membership of memberships) {
      const endDate = calculateMembershipEndDate(membership.startDate, membership.plan);
      const membershipResult = await client.query(
        `INSERT INTO memberships (
           user_id, plan, start_date, end_date, status, next_plan, cancel_at_end, is_current
         )
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7)
         RETURNING id`,
        [
          userIds.get(membership.accountKey),
          membership.plan,
          membership.startDate,
          endDate,
          membership.status,
          membership.nextPlan,
          membership.isCurrent,
        ]
      );

      await client.query(
        `INSERT INTO payments (membership_id, amount, payment_date)
         VALUES ($1, $2, $3)`,
        [membershipResult.rows[0].id, planPrices[membership.plan], membership.paymentDate]
      );
    }

    for (const attendance of attendanceRows) {
      await client.query(
        `INSERT INTO attendances (user_id, attendance_date)
         VALUES ($1, $2)`,
        [userIds.get(attendance.accountKey), attendance.date]
      );
    }

    const counts = await getTableCounts(client);
    await client.query("COMMIT");
    transactionStarted = false;

    console.log("Seed demo aplicado correctamente.");
    console.log("Filas agregadas: 6 usuarios (1 admin y 5 socios), 7 membresías, 7 pagos y 11 asistencias.");
    console.log("Totales actuales:", counts);
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // La conexión puede haberse perdido junto con la transacción.
      }
    }
    console.error("No se pudo aplicar el seed demo:", error);
    process.exitCode = 1;
  } finally {
    client?.release();
    await pool.end();
  }
};

void seedDemo();
