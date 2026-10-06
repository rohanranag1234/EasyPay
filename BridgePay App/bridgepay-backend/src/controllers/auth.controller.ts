import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { loginSchema, registerSchema } from "../domain/bridgepay";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

export async function register(req: AuthRequest, res: Response) {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });
  const user = await prisma.user.create({ data: { name: data.name, email: data.email, mobile: data.mobile, passwordHash: await bcrypt.hash(data.password, 12) } });
  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, guest: false, emailVerified: user.emailVerified, mobileVerified: user.mobileVerified }, token: signToken({ userId: user.id, role: user.role }) });
}
export async function login(req: AuthRequest, res: Response) {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, guest: false, emailVerified: user.emailVerified, mobileVerified: user.mobileVerified }, token: signToken({ userId: user.id, role: user.role }) });
}
export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, name: true, email: true, mobile: true, emailVerified: true, mobileVerified: true, createdAt: true } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: { ...user, guest: false } });
}
