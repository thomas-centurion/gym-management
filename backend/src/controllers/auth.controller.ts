import { Request, Response } from "express";
import {
  registerService,
  loginService,
} from "../services/auth.service.js";

// registra un nuevo socio en el sistema
export const registerController = async (
  req: Request,
  res: Response
) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await registerService(
      firstName,
      lastName,
      email,
      password
    );

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "El email ya está registrado") {
        return res.status(409).json({ message: error.message });
      }

      if (
        error.message === "Todos los campos son obligatorios" ||
        error.message === "El email no es válido" ||
        error.message === "La contraseña debe tener al menos 6 caracteres"
      ) {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("ERROR AL REGISTRAR LA CUENTA:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// autentica al usuario y devuelve su token JWT
export const loginController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Credenciales inválidas") {
        return res.status(401).json({ message: error.message });
      }

      if (error.message === "Email y contraseña son obligatorios") {
        return res.status(400).json({ message: error.message });
      }
    }

    console.error("ERROR AL INICIAR SESIÓN:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
