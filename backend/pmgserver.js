import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { connectDatabase } from "./src/config/database.js";
import routes from "./src/routes/index.js";
import { notFoundHandler } from "./src/middleware/notFound.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

const PORT = Number(process.env.PORT) || 5020;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, "../frontend");
const FRONTEND_INDEX = path.join(FRONTEND_DIR, "index.html");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep existing API routes under /api.
app.use("/api", routes);
app.use("/api", notFoundHandler);
app.use("/api", errorHandler);

// Serve built frontend assets.
app.use(express.static(FRONTEND_DIR));

// SPA fallback for React/Vite client routes (non-API paths only).
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }
  res.sendFile(FRONTEND_INDEX);
});

async function bootstrap() {
  try {
    await connectDatabase();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      const env = process.env.NODE_ENV || "development";
      console.log("");
      console.log("  ╔══════════════════════════════════════════════════════╗");
      console.log("  ║  Procurement Management API (Celeris)                ║");
      console.log("  ╠══════════════════════════════════════════════════════╣");
      console.log(`  ║  Environment : ${String(env).padEnd(36)} ║`);
      console.log(`  ║  Port        : ${String(PORT).padEnd(36)} ║`);
      console.log(`  ║  MongoDB     : ${mongoose.connection.readyState === 1 ? "connected".padEnd(36) : "pending".padEnd(36)} ║`);
      console.log(`  ║  API base    : ${`/api`.padEnd(36)} ║`);
      console.log("  ╚══════════════════════════════════════════════════════╝");
      console.log("");
    });
  } catch (err) {
    console.error("[bootstrap] Failed to start server:", err);
    process.exit(1);
  }
}

bootstrap();
