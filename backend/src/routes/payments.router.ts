import { Router } from "express";
import {
  getPaymentsController,
  getMyPaymentsController,
  createPaymentController,
  getPaymentByIdController,
} from "../controllers/payments.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// el admin puede consultar todos los pagos
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getPaymentsController
);

// el socio puede consultar sus propios pagos
router.get(
  "/my-payments",
  authenticateToken,
  authorizeRoles("member"),
  getMyPaymentsController
);

// el socio puede realizar un pago simulado
router.post(
  "/",
  authenticateToken,
  authorizeRoles("member"),
  createPaymentController
);

// el admin puede consultar un pago específico
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  getPaymentByIdController
);

export default router;