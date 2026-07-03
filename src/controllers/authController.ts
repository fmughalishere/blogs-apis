import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import User from "../models/User";
import { signToken } from "../utils/jwt";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, adminSecret } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "Email is already registered" });
    return;
  }

  let finalRole: "admin" | "user" = "user";
  if (role === "admin") {
    if (!adminSecret || adminSecret !== process.env.ADMIN_REGISTER_SECRET) {
      res.status(403).json({ error: "Invalid admin secret key" });
      return;
    }
    finalRole = "admin";
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: finalRole,
  });

  const token = signToken({ id: (user._id as Types.ObjectId).toString(), role: user.role });
  res.cookie("token", token, COOKIE_OPTIONS);

  res.status(201).json({
    message: "Registered successfully",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ id: (user._id as Types.ObjectId).toString(), role: user.role });
  res.cookie("token", token, COOKIE_OPTIONS);

  res.json({
    message: "Logged in successfully",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});