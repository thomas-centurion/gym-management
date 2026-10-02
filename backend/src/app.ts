import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.router.js";
import usersRouter from "./routes/users.router.js";
import membershipsRouter from "./routes/memberships.router.js";
import paymentsRouter from "./routes/payments.router.js";
import attendancesRouter from "./routes/attendances.router.js";
import { demoReadOnlyMiddleware } from "./middlewares/demo-read-only.middleware.js";

const app = express();

const frontendOrigins = process.env.FRONTEND_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  frontendOrigins?.length
    ? cors({ origin: frontendOrigins })
    : cors()
);
app.use(demoReadOnlyMiddleware);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/memberships", membershipsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/attendances", attendancesRouter);

export default app;
