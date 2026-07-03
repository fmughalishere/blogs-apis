import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

function extractToken(req: Request): string | undefined {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.split(" ")[1];
  return undefined;
}

// Requires a valid logged-in user (admin or user)
export function protect(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

// Requires the logged-in user to have role "admin". Use after `protect`.
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }
  next();
}

// Reads the token if present but does not block the request if missing.
// Useful for routes where behavior differs slightly for logged-in users.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore invalid token, treat as anonymous
    }
  }
  next();
}
