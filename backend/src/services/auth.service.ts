import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
} from "../repositories/users.repository.js";


// registra un nuevo socio en el sistema
export const registerService = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  if (!firstName || !lastName || !email || !password) {
    throw new Error("Todos los campos son obligatorios");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new Error("El email no es válido");
  }

  if (password.length < 6) {
    throw new Error(
      "La contraseña debe tener al menos 6 caracteres"
    );
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("El email ya está registrado");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser(
    firstName,
    lastName,
    email,
    hashedPassword
  );

  return user;
};


// autentica al usuario y genera un token JWT
export const loginService = async (
  email: string,
  password: string
) => {
  if (!email || !password) {
    throw new Error("Email y contraseña son obligatorios");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Credenciales inválidas");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET no está configurado");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: "1d",
    }
  );

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};