import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("MONGO_URI not set"); process.exit(1); }

  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("MenuItem");

  const exists = await col.findOne({ code: "active_users" });
  if (exists) {
    console.log("active_users menu item already exists");
    await mongoose.disconnect();
    return;
  }

  const settings = await col.findOne({ code: "settings" });
  if (!settings) { console.error("'settings' not found"); process.exit(1); }

  await col.insertOne({
    company: settings.company,
    code: "active_users",
    label: "Active Users",
    description: "View logged-in user sessions and login history",
    segment: "configuration/active-users",
    parentCode: "settings",
    menuType: "landing_card",
    sequence: 75,
    requiresSuperAdmin: true,
    variant: "admin",
    isActive: true,
    isHidden: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("active_users menu item created (hidden from top-level, accessed via System group)");
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
