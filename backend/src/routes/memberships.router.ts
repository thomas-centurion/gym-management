import { Router } from "express";

import {
  getMembershipsController,
  createMembershipController,
  getCurrentMembershipController,
  getMembershipByIdController,
  updateMembershipController,
  changeMembershipPlanController,
  cancelMembershipController,
  undoMembershipCancellationController,
} from "../controllers/memberships.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { authorizeMembershipAccess } from "../middlewares/membership.middleware.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getMembershipsController
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createMembershipController
);

router.get(
  "/my-membership",
  authenticateToken,
  authorizeRoles("member"),
  getCurrentMembershipController
);

router.post(
  "/:id/change-plan",
  authenticateToken,
  authorizeRoles("member"),
  authorizeMembershipAccess,
  changeMembershipPlanController
);

router.post(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles("member"),
  authorizeMembershipAccess,
  cancelMembershipController
);

router.post(
  "/:id/undo-cancel",
  authenticateToken,
  authorizeRoles("member"),
  authorizeMembershipAccess,
  undoMembershipCancellationController
);

router.get(
  "/:id",
  authenticateToken,
  authorizeMembershipAccess,
  getMembershipByIdController
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  updateMembershipController
);

export default router;