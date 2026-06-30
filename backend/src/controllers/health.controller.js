import mongoose from "mongoose";

export function getHealth(_req, res) {
  res.status(200).json({
    success: true,
    service: "Procurement Management API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
}
