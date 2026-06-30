import dns from "node:dns/promises";
import mongoose from "mongoose";
import { registerAuditTrail } from "../plugins/auditTrail.plugin.js";

const DEFAULT_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
};

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment");
  }

  // Force stable public resolvers for Atlas SRV lookups on networks with broken DNS.
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, DEFAULT_OPTIONS);

  registerAuditTrail();

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  return mongoose.connection;
}
