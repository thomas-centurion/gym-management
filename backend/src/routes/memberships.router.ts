import { Router } from "express";
import {
  getMembershipsController,
  createMembershipController,
  getMembershipByIdController,
  updateMembershipController,
  deleteMembershipController,
} from "../controllers/memberships.controller.js";

const router = Router();

router.get("/", getMembershipsController);
router.get("/:id", getMembershipByIdController);

router.post("/", createMembershipController);

router.put("/:id", updateMembershipController);

router.delete("/:id", deleteMembershipController);

export default router;