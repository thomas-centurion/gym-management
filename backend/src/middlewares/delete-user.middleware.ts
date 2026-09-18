import { NextFunction, Request, Response } from "express";

// verifica que el usuario pueda eliminar la cuenta solicitada
export const authorizeUserDeletion = (
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
    if (req.user.id === requestedUserId) {
      return res.status(403).json({
        message: "El administrador no puede eliminar su propia cuenta",
      });
    }

    return next();
  }

  if (req.user.id !== requestedUserId) {
    return res.status(403).json({
      message: "No tienes permisos para eliminar este usuario",
    });
  }

  next();
};