import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("MONGO_URI not set"); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection("MenuItem");

  const settings = await col.findOne({ code: "settings" });
  if (!settings) { console.error("'settings' parent menu not found"); process.exit(1); }

  const exists = await col.findOne({ code: "audit_logs" });
  if (exists) {
    console.log("[seed] audit_logs menu item already exists — skipping.");
  } else {
    await col.insertOne({
      company: settings.company,
      code: "audit_logs",
      label: "Audit Logs",
      description: "View and manage system audit trail for all operations",
      segment: "configuration/audit-logs",
      parentCode: "settings",
      menuType: "landing_card",
      sequence: 60,
      requiresSuperAdmin: true,
      variant: "admin",
      isActive: true,
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[seed] audit_logs menu item created.");
  }

  await mongoose.disconnect();
  console.log("[seed] Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
