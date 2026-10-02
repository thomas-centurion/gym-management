import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.VERCEL) {
  attachDatabasePool(pool);
}

pool.on("error", () => {
  console.error("Error en una conexión PostgreSQL inactiva.");
});

export default pool;
