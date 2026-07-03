import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app: Application = express();

// CLIENT_URL supports multiple comma-separated origins, e.g.
// CLIENT_URL=https://loveblogs.vercel.app,https://medicalblogs.vercel.app,http://localhost:3000
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, server-to-server, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} is not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
