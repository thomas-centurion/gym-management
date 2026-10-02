import type { NextFunction, Request, Response } from "express";

const readOnlyMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const demoReadOnlyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.DEMO_MODE !== "true") return next();

  const isLogin = req.method === "POST" && req.path === "/api/auth/login";
  if (readOnlyMethods.has(req.method) || isLogin) return next();

  return res.status(403).json({ error: "Esta demo es de solo lectura." });
};
