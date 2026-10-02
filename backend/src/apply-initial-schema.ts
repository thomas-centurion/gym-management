import { readFile } from "node:fs/promises";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL debe estar configurada para inicializar el schema");
}

const pool = new pg.Pool({ connectionString: databaseUrl });

const applyInitialSchema = async () => {
  const client = await pool.connect();

  try {
    const schema = await readFile(
      new URL("../migrations/001_initial_schema.sql", import.meta.url),
      "utf8"
    );

    await client.query(schema);
    console.log("Schema inicial aplicado correctamente.");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // La conexión puede haber fallado antes de iniciar la transacción.
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

applyInitialSchema().catch((error: unknown) => {
  console.error("No se pudo aplicar el schema inicial:", error);
  process.exitCode = 1;
});
