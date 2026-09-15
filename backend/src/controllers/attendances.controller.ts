import { Request, Response } from "express";
import {
  getAttendancesService,
  createAttendanceService,
  getAttendanceByIdService,
  updateAttendanceService,
  deleteAttendanceService,
} from "../services/attendances.service.js";

export const getAttendancesController = async (
  req: Request,
  res: Response
) => {
  try {
    const attendances = await getAttendancesService();

    res.json(attendances);
  } catch (error) {
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const createAttendanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, attendanceDate } = req.body;

    const attendance = await createAttendanceService(
      userId,
      attendanceDate
    );

    res.status(201).json(attendance);
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

export const getAttendanceByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const attendance = await getAttendanceByIdService(id);

    res.json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Asistencia no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const updateAttendanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const { attendanceDate } = req.body;

    const attendance = await updateAttendanceService(
      id,
      attendanceDate
    );

    res.json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Todos los campos son obligatorios") {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message === "Asistencia no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

export const deleteAttendanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const deletedAttendance =
      await deleteAttendanceService(id);

    res.json({
      message: "Asistencia eliminada correctamente",
      attendance: deletedAttendance,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Asistencia no encontrada") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};