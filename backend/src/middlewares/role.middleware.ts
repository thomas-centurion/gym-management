import { NextFunction, Request, Response } from "express";
import { Role } from "../types/auth.js";

// verifica que el usuario tenga uno de los roles permitidos
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "No tienes permisos para realizar esta acción",
      });
    }

    next();
  };
};