import { Request, Response } from "express";
import {
  getPaymentsService,
  createPaymentService,
  getPaymentByIdService,
  updatePaymentService,
  deletePaymentService,
} from "../services/payments.service.js";

export const getPaymentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const payments = await getPaymentsService();

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const createPaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    const { membershipId, amount, paymentDate } = req.body;

    const payment = await createPaymentService(
      membershipId,
      amount,
      paymentDate
    );

    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "El monto debe ser mayor a 0") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

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
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const updatePaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const { amount, paymentDate } = req.body;

    const payment = await updatePaymentService(
      id,
      amount,
      paymentDate
    );

    res.json(payment);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "El monto debe ser mayor a 0") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "Pago no encontrado") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const deletePaymentController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const deletedPayment = await deletePaymentService(id);

    res.json({
      message: "Pago eliminado correctamente",
      payment: deletedPayment,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Pago no encontrado") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};