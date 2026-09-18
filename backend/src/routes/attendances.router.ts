import { Router } from "express";

import {
  getAttendancesController,
  getMyAttendancesController,
  getAttendanceByIdController,
  createAttendanceController,
  createAttendanceByAdminController,
  deleteAttendanceController,
} from "../controllers/attendances.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// admin puede consultar todas las asistencias
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getAttendancesController
);

// socio puede consultar sus propias asistencias
router.get(
  "/my-attendances",
  authenticateToken,
  authorizeRoles("member"),
  getMyAttendancesController
);

// socio registra su propia asistencia
router.post(
  "/",
  authenticateToken,
  authorizeRoles("member"),
  createAttendanceController
);

// admin registra una asistencia para cualquier socio
router.post(
  "/admin",
  authenticateToken,
  authorizeRoles("admin"),
  createAttendanceByAdminController
);

// obtiene una asistencia específica
router.get(
  "/:id",
  authenticateToken,
  getAttendanceByIdController
);

// admin elimina una asistencia
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  deleteAttendanceController
);

export default router;