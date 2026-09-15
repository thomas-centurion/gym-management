import { Router } from "express";
import {
  getPaymentsController,
  createPaymentController,
  getPaymentByIdController,
  updatePaymentController,
  deletePaymentController,
} from "../controllers/payments.controller.js";

const router = Router();

router.get("/", getPaymentsController);
router.get("/:id", getPaymentByIdController);

router.post("/", createPaymentController);

router.put("/:id", updatePaymentController);

router.delete("/:id", deletePaymentController);

export default router;