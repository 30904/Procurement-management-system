import { Router } from "express";
import mongoose from "mongoose";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

router.get("/", getHealth);
router.get("/live", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});
router.get("/ready", async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  if (!dbOk) {
    return res.status(503).json({ status: "degraded", database: "disconnected" });
  }
  return res.status(200).json({ status: "ready", database: "connected" });
});

export default router;
