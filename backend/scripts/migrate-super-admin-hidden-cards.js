/**
 * Sets isHidden=true on all requiresSuperAdmin landing cards (red dotted border for super admin).
 * Run: node scripts/migrate-super-admin-hidden-cards.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import MenuItem from "../src/models/MenuItem.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const res = await MenuItem.updateMany(
    { requiresSuperAdmin: true },
    { $set: { isHidden: true }, $unset: { variant: "" } }
  );
  console.log(
    `Updated ${res.modifiedCount} menu item(s) (matched ${res.matchedCount}).`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
