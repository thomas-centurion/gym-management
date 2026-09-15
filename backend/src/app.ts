import express from "express";
import cors from "cors";
import usersRouter from "./routes/users.router.js";
import membershipsRouter from "./routes/memberships.router.js";
import paymentsRouter from "./routes/payments.router.js";
import attendancesRouter from "./routes/attendances.router.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/memberships", membershipsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/attendances", attendancesRouter);

export default app;