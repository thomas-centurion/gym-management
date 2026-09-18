import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "../types/auth.js";


// verifica el token JWT y obtiene la identidad y el rol del usuario
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token de autenticación requerido",
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Formato de token inválido",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "JWT_SECRET no está configurado",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.id !== "number" ||
      (decoded.role !== "admin" && decoded.role !== "member")
    ) {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    } as AuthPayload;

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido o expirado",
    });
  }
};