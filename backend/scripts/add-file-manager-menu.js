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

  const exists = await col.findOne({ code: "file_manager" });
  if (exists) {
    console.log("[seed] file_manager menu item already exists — skipping.");
  } else {
    await col.insertOne({
      company: settings.company,
      code: "file_manager",
      label: "File Manager",
      description: "Upload, preview, and manage files and documents",
      segment: "configuration/file-manager",
      parentCode: "settings",
      menuType: "landing_card",
      sequence: 70,
      requiresSuperAdmin: true,
      variant: "admin",
      isActive: true,
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("[seed] file_manager menu item created.");
  }

  await mongoose.disconnect();
  console.log("[seed] Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
