import { Request, Response } from "express";

import {
  getMembershipsService,
  createMembershipService,
  getMembershipByIdService,
  getCurrentMembershipService,
  updateMembershipService,
  changeMembershipPlanService,
  cancelMembershipService,
  undoMembershipCancellationService,
} from "../services/memberships.service.js";

// obtiene todas las membresías
export const getMembershipsController = async (
  req: Request,
  res: Response
) => {
  try {
    const memberships =
      await getMembershipsService();

    res.json(memberships);
  } catch (error) {
    console.error(
      "ERROR AL OBTENER LAS MEMBRESÍAS:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// crea una nueva membresía
export const createMembershipController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      userId,
      plan,
      startDate,
      endDate,
      status,
    } = req.body;

    const membership =
      await createMembershipService(
        userId,
        plan,
        startDate,
        endDate,
        status
      );

    res.status(201).json(membership);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message ===
          "Todos los campos son obligatorios" ||
        error.message ===
          "El plan no es válido" ||
        error.message ===
          "El estado no es válido" ||
        error.message ===
          "La fecha de finalización debe ser posterior a la fecha de inicio" ||
        error.message ===
          "No se puede crear una nueva membresía porque el socio ya tiene una membresía actual"
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }
    }

    console.error(
      "ERROR AL CREAR LA MEMBRESÍA:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// obtiene la membresía actual del socio
export const getCurrentMembershipController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      const membership =
        await getCurrentMembershipService(
          req.user.id
        );

      if (!membership) {
        return res.status(404).json({
          error:
            "El socio no tiene una membresía actual",
        });
      }

      res.json(membership);
    } catch (error) {
      console.error(
        "ERROR AL OBTENER LA MEMBRESÍA ACTUAL:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// obtiene una membresía por su ID
export const getMembershipByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(req.params.id);

      const membership =
        await getMembershipByIdService(id);

      res.json(membership);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
          "Membresía no encontrada"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL OBTENER LA MEMBRESÍA:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// actualiza una membresía como administrador
export const updateMembershipController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(req.params.id);

      const {
        plan,
        startDate,
        endDate,
        status,
      } = req.body;

      const membership =
        await updateMembershipService(
          id,
          plan,
          startDate,
          endDate,
          status
        );

      res.json(membership);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
            "Todos los campos son obligatorios" ||
          error.message ===
            "El plan no es válido" ||
          error.message ===
            "La fecha de finalización debe ser posterior a la fecha de inicio" ||
          error.message ===
            "El estado no es válido"
        ) {
          return res.status(400).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "Membresía no encontrada"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL ACTUALIZAR LA MEMBRESÍA:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// solicita un cambio de plan
export const changeMembershipPlanController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      const membershipId =
        Number(req.params.id);

      const { plan } = req.body;

      const result =
        await changeMembershipPlanService(
          req.user.id,
          membershipId,
          plan
        );

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
            "El plan es obligatorio" ||
          error.message ===
            "El plan no es válido" ||
          error.message ===
            "Solo puedes cambiar el plan de una membresía activa" ||
          error.message ===
            "Esta membresía no es la membresía actual" ||
          error.message ===
            "Ya existe un cambio de plan pendiente" ||
          error.message ===
            "No puedes cambiar de plan mientras la membresía está cancelada" ||
          error.message ===
            "El nuevo plan debe ser diferente al actual"
        ) {
          return res.status(400).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "Membresía no encontrada"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "No tienes permisos para modificar esta membresía"
        ) {
          return res.status(403).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL CAMBIAR EL PLAN:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// cancela una membresía al finalizar el período actual
export const cancelMembershipController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      const membershipId =
        Number(req.params.id);

      const result =
        await cancelMembershipService(
          req.user.id,
          membershipId
        );

      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
            "Esta membresía no es la membresía actual" ||
          error.message ===
            "Solo puedes cancelar una membresía activa" ||
          error.message ===
            "La membresía ya está cancelada"
        ) {
          return res.status(400).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "Membresía no encontrada"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "No tienes permisos para modificar esta membresía"
        ) {
          return res.status(403).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL CANCELAR LA MEMBRESÍA:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// deshace la cancelación de una membresía
export const undoMembershipCancellationController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Usuario no autenticado",
        });
      }

      const membershipId =
        Number(req.params.id);

      const result =
        await undoMembershipCancellationService(
          req.user.id,
          membershipId
        );

      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
            "Esta membresía no es la membresía actual" ||
          error.message ===
            "Solo puedes deshacer la cancelación de una membresía activa" ||
          error.message ===
            "La membresía no está cancelada" ||
          error.message ===
            "La membresía ya finalizó y no se puede deshacer la cancelación"
        ) {
          return res.status(400).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "Membresía no encontrada"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "No tienes permisos para modificar esta membresía"
        ) {
          return res.status(403).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL DESHACER LA CANCELACIÓN:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };