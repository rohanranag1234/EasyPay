import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
export interface AuthRequest extends Request { user?: { userId: string; role: "USER" | "ADMIN" } }
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
  try { req.user = verifyToken(header.slice(7)); return next(); }
  catch { return res.status(401).json({ error: "Invalid or expired token" }); }
}
