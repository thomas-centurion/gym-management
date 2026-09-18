import { NextFunction, Request, Response } from "express";

// verifica que el usuario pueda acceder al usuario solicitado
export const authorizeUserAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  const requestedUserId = Number(req.params.id);

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.id !== requestedUserId) {
    return res.status(403).json({
      message: "No tienes permisos para acceder a este usuario",
    });
  }

  next();
};