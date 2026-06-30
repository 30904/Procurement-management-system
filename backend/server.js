import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./src/app.js";
import { connectDatabase } from "./src/config/database.js";

const PORT = Number(process.env.PORT) || 5020;

async function bootstrap() {
  try {
    await connectDatabase();
    const server = http.createServer(app);

    server.listen(PORT, "0.0.0.0", () => {
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
