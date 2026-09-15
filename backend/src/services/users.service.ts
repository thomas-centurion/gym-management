import bcrypt from "bcrypt";
import {
  getUsers,
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
} from "../repositories/users.repository.js";


export const getUsersService = async () => {
  const users = await getUsers();

  return users.map((user) => {
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  });
};


export const getUserByIdService = async (id: number) => {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const { password, ...userWithoutPassword } = user;

  return userWithoutPassword;
};


export const createUserService = async (
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
    throw new Error("La contraseña debe tener al menos 6 caracteres");
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

export const updateUserService = async (
  id: number,
  firstName: string,
  lastName: string,
  email: string
) => {
  if (!firstName || !lastName || !email) {
    throw new Error("Todos los campos son obligatorios");
  }

  const existingUser = await findUserById(id);

  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const userWithEmail = await findUserByEmail(email);

  if (userWithEmail && userWithEmail.id !== id) {
    throw new Error("El email ya está registrado");
  }

  const user = await updateUser(
    id,
    firstName,
    lastName,
    email
  );

  return user;
};


export const deleteUserService = async (id: number) => {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    throw new Error("Usuario no encontrado");
  }

  const deletedUser = await deleteUser(id);

  return deletedUser;
};