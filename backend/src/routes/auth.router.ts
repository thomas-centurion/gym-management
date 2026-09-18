import { Router } from "express";
import {
  registerController,
  loginController,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);

router.get("/test", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Autenticación correcta",
    user: req.user,
  });
});

export default router;