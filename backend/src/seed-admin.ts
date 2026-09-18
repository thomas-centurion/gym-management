import bcrypt from "bcrypt";
import "dotenv/config";
import pool from "./config/database.js";
import {
  createAdmin,
  findUserByEmail,
} from "./repositories/users.repository.js";

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_PASSWORD deben estar configurados"
    );
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    if (existingUser.role === "admin") {
      console.log("El administrador ya existe.");
      return;
    }

    throw new Error(
      "El email indicado ya pertenece a un usuario que no es administrador"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await createAdmin(email, hashedPassword);

  console.log("Administrador creado correctamente.");
};

seedAdmin()
  .catch((error) => {
    console.error("Error al crear administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });