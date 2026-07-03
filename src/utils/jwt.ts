import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  role: "admin" | "user";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
}
