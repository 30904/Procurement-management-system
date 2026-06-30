/**
 * Syncs menu catalog to framework-only data and deletes legacy Accounts rows.
 * Run: npm run cleanup:accounts  OR  npm run sync:menus
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { syncMenuCatalogForCompany } from "./menu-sync.js";

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company found");

  const result = await syncMenuCatalogForCompany(company._id);
  console.log(
    `[sync:menus] Catalog synced: ${result.menuCount} items, removed ${result.removedCount} legacy/orphan row(s)`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
