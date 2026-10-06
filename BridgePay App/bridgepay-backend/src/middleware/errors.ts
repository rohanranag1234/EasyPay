import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
}
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: err.issues.map(i => ({ path: i.path.join("."), message: i.message })) });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return res.status(409).json({ error: "A record with these details already exists" });
  const bodyError = err as { type?: string } | null;
  if (bodyError?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  if (bodyError?.type === "entity.too.large") return res.status(413).json({ error: "Request body too large" });
  if (err instanceof Error && err.message.startsWith("APP:")) return res.status(400).json({ error: err.message.slice(4) });
  // Avoid logging request bodies, tokens, SQL parameters, or personal bank details.
  console.error("Unhandled API error", err instanceof Prisma.PrismaClientKnownRequestError ? err.code : "unexpected");
  return res.status(500).json({ error: "Internal server error" });
}
