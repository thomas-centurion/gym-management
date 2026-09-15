import { Router } from "express";
import {
  getAttendancesController,
  createAttendanceController,
  getAttendanceByIdController,
  updateAttendanceController,
  deleteAttendanceController,
} from "../controllers/attendances.controller.js";

const router = Router();

router.get("/", getAttendancesController);
router.get("/:id", getAttendanceByIdController);

router.post("/", createAttendanceController);

router.put("/:id", updateAttendanceController);

router.delete("/:id", deleteAttendanceController);

export default router;