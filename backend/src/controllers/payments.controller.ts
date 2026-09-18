import { Request, Response } from "express";

import {
  getPaymentsService,
  getPaymentsByUserIdService,
  createPaymentService,
  getPaymentByIdService,
} from "../services/payments.service.js";

// obtiene todos los pagos
export const getPaymentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const payments = await getPaymentsService();

    res.json(payments);
  } catch (error) {
    console.error("ERROR AL OBTENER LOS PAGOS:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// obtiene los pagos del socio autenticado
export const getMyPaymentsController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const payments = await getPaymentsByUserIdService(
      req.user.id
    );

    res.json(payments);
  } catch (error) {
    console.error(
      "ERROR AL OBTENER LOS PAGOS DEL SOCIO:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// registra un pago simulado
export const createPaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const { membershipId, plan } = req.body;

    const result = await createPaymentService(
      req.user.id,
      membershipId,
      plan
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("ERROR AL PROCESAR EL PAGO:", error);

    if (error instanceof Error) {
      if (
        error.message === "Todos los campos son obligatorios" ||
        error.message === "El plan no es válido" ||
        error.message ===
          "Para cambiar de plan debes utilizar el cambio de plan" ||
        error.message ===
          "Ya existe un cambio de plan pendiente" ||
        error.message ===
          "Ya existe una membresía futura pendiente" ||
        error.message ===
          "Esta membresía no es la membresía actual"
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "No tienes permisos para pagar esta membresía"
      ) {
        return res.status(403).json({
          error: error.message,
        });
      }

      if (error.message === "Membresía no encontrada") {
        return res.status(404).json({
          error: error.message,
        });
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// obtiene un pago por su ID
export const getPaymentByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const payment = await getPaymentByIdService(id);

    res.json(payment);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Pago no encontrado") {
        return res.status(404).json({
          error: error.message,
        });
      }
    }

    console.error("ERROR AL OBTENER EL PAGO:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};