import { Request, Response } from "express";
import {
  getMembershipsService,
  createMembershipService,
  getMembershipByIdService,
  updateMembershipService,
  deleteMembershipService,
} from "../services/memberships.service.js";

export const getMembershipsController = async (
  req: Request,
  res: Response
) => {
  try {
    const memberships = await getMembershipsService();

    res.json(memberships);
  } catch (error) {
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const createMembershipController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, plan, startDate, endDate } = req.body;

    const membership = await createMembershipService(
      userId,
      plan,
      startDate,
      endDate
    );

    res.status(201).json(membership);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const getMembershipByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const membership = await getMembershipByIdService(id);

    res.json(membership);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Membresía no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const updateMembershipController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const { plan, startDate, endDate, status } = req.body;

    const membership = await updateMembershipService(
      id,
      plan,
      startDate,
      endDate,
      status
    );

    res.json(membership);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "Membresía no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === "El estado no es válido") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const deleteMembershipController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const deletedMembership = await deleteMembershipService(id);

    res.json({
      message: "Membresía eliminada correctamente",
      membership: deletedMembership,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Membresía no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};