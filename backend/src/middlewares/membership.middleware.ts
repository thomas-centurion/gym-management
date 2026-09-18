import { NextFunction, Request, Response } from "express";
import { findMembershipById } from "../repositories/memberships.repository.js";

// Verifica que el usuario pueda acceder a la membresía solicitada.
export const authorizeMembershipAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  const membershipId = Number(req.params.id);

  const membership = await findMembershipById(membershipId);

  if (!membership) {
    return res.status(404).json({
      message: "Membresía no encontrada",
    });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (membership.user_id !== req.user.id) {
    return res.status(403).json({
      message: "No tienes permisos para acceder a esta membresía",
    });
  }

  next();
};