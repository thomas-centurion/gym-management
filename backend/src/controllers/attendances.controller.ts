import { Request, Response } from "express";

import {
  getAttendancesService,
  getAttendancesByUserIdService,
  getAttendanceByIdService,
  getAttendanceByIdForUserService,
  createAttendanceService,
  deleteAttendanceService,
} from "../services/attendances.service.js";

// obtiene todas las asistencias
export const getAttendancesController = async (
  req: Request,
  res: Response
) => {
  try {
    const attendances = await getAttendancesService();

    res.json(attendances);
  } catch (error) {
    console.error(
      "ERROR AL OBTENER LAS ASISTENCIAS:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// obtiene las asistencias del socio autenticado
export const getMyAttendancesController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const attendances =
      await getAttendancesByUserIdService(
        req.user.id
      );

    res.json(attendances);
  } catch (error) {
    console.error(
      "ERROR AL OBTENER LAS ASISTENCIAS DEL SOCIO:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// obtiene una asistencia por su ID
export const getAttendanceByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const id = Number(req.params.id);

    let attendance;

    if (req.user.role === "admin") {
      attendance =
        await getAttendanceByIdService(id);
    } else {
      attendance =
        await getAttendanceByIdForUserService(
          id,
          req.user.id
        );
    }

    res.json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Asistencia no encontrada"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "No tienes permisos para acceder a esta asistencia"
      ) {
        return res.status(403).json({
          error: error.message,
        });
      }
    }

    console.error(
      "ERROR AL OBTENER LA ASISTENCIA:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// registra una asistencia para el socio autenticado
export const createAttendanceController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    const { attendanceDate } = req.body;

    const attendance =
      await createAttendanceService(
        req.user.id,
        attendanceDate,
        false
      );

    res.status(201).json(attendance);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "La fecha es obligatoria" ||
        error.message ===
          "La fecha debe tener el formato YYYY-MM-DD" ||
        error.message ===
          "Los socios solamente pueden registrar la asistencia del día actual" ||
        error.message ===
          "El socio no tiene una membresía activa"
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }

      if (
        error.message ===
        "El socio no tiene una membresía"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }
    }

    console.error(
      "ERROR AL REGISTRAR LA ASISTENCIA:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

// registra una asistencia para cualquier socio como administrador
export const createAttendanceByAdminController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        userId,
        attendanceDate,
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: "El usuario es obligatorio",
        });
      }

      const attendance =
        await createAttendanceService(
          Number(userId),
          attendanceDate,
          true
        );

      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message ===
            "La fecha es obligatoria" ||
          error.message ===
            "La fecha debe tener el formato YYYY-MM-DD" ||
          error.message ===
            "No se pueden registrar asistencias futuras"
        ) {
          return res.status(400).json({
            error: error.message,
          });
        }

        if (
          error.message ===
          "El socio no tiene una membresía"
        ) {
          return res.status(404).json({
            error: error.message,
          });
        }
      }

      console.error(
        "ERROR AL REGISTRAR LA ASISTENCIA COMO ADMIN:",
        error
      );

      res.status(500).json({
        error: "Error interno del servidor",
      });
    }
  };

// elimina una asistencia
export const deleteAttendanceController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const attendance =
      await deleteAttendanceService(id);

    res.json({
      message: "Asistencia eliminada correctamente",
      attendance,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Asistencia no encontrada"
      ) {
        return res.status(404).json({
          error: error.message,
        });
      }
    }

    console.error(
      "ERROR AL ELIMINAR LA ASISTENCIA:",
      error
    );

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};