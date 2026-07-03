import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Something went wrong" });
}
