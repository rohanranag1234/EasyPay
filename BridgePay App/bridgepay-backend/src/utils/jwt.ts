import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { z } from "zod";
export type TokenPayload = { userId: string; role: "USER" | "ADMIN" };
const issuer = "bridgepay-api", audience = "bridgepay-app";
export function signToken(payload: TokenPayload) { return jwt.sign(payload, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h", issuer, audience }); }
export function verifyToken(token: string): TokenPayload {
  return z.object({ userId: z.string().min(1), role: z.enum(["USER", "ADMIN"]) }).parse(
    jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"], issuer, audience })
  );
}
