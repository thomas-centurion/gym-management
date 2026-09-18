import { Router } from "express";
import {
  getUsersController,
  createUserController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
} from "../controllers/users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { authorizeUserAccess } from "../middlewares/user.middleware.js";
import { authorizeUserDeletion } from "../middlewares/delete-user.middleware.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getUsersController
);

router.get(
  "/:id",
  authenticateToken,
  authorizeUserAccess,
  getUserByIdController
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createUserController
);

router.put(
  "/:id",
  authenticateToken,
  authorizeUserAccess,
  updateUserController
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeUserDeletion,
  deleteUserController
);

export default router;