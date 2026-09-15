import { Request, Response } from "express";
import {
  getUsersService,
  createUserService,
  getUserByIdService,
  updateUserService,
  deleteUserService,
} from "../services/users.service.js";


export const getUsersController = async (req: Request, res: Response) => {
  const users = await getUsersService();

  res.json(users);
};


export const getUserByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const user = await getUserByIdService(id);

    res.json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Usuario no encontrado") {
        res.status(404).json({
          error: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};


export const createUserController = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await createUserService(firstName, lastName, email, password);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error.message === "El email ya está registrado") {
        res.status(409).json({
          error: error.message,
        });
        return;
      }

      if (error.message === "El email no es válido") {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error.message === "La contraseña debe tener al menos 6 caracteres") {
        res.status(400).json({
          error: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};


export const updateUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const { firstName, lastName, email } = req.body;

    const user = await updateUserService(
      id,
      firstName,
      lastName,
      email
    );

    res.json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({
          error: error.message,
        });
        return;
      }

      if (error.message === "Usuario no encontrado") {
        res.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error.message === "El email ya está registrado") {
        res.status(409).json({
          error: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};


export const deleteUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const deletedUser = await deleteUserService(id);

    res.json({
      message: "Usuario eliminado correctamente",
      user: deletedUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Usuario no encontrado") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};