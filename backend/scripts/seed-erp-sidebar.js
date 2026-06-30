/**
 * Replace sidebar menus in MongoDB with the procurement catalog (menu-catalog.js).
 *
 * Usage: node scripts/seed-erp-sidebar.js
 * DB: MONGO_URI from backend/.env (e.g. mongodb://localhost:27017/smart-erp)
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { syncMenuCatalogForCompany } from "./menu-sync.js";

async function main() {
  const uri = process.env.MONGO_URI || "(not set)";
  console.log("[seed-erp-sidebar] Connecting to", uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"));
  await connectDatabase();

  const companies = await Company.find({ isActive: true }).sort({ createdAt: 1 });
  if (!companies.length) {
    const any = await Company.find().sort({ createdAt: 1 }).limit(1);
    if (!any.length) {
      console.error("[seed-erp-sidebar] No company found. Run: npm run seed:framework");
      process.exitCode = 1;
      return;
    }
    companies.push(...any);
  }

  for (const company of companies) {
    console.log("[seed-erp-sidebar] Syncing company:", company.companyName, company._id.toString());
    const result = await syncMenuCatalogForCompany(company._id);
    const sidebar = await MenuItem.find({
      company: company._id,
      menuType: { $in: ["sidebar_main", "sidebar_bottom"] },
    })
      .sort({ sequence: 1 })
      .select("code label sequence menuType")
      .lean();

    console.log(
      "[seed-erp-sidebar] Done — menus:",
      result.menuCount,
      "| removed:",
      result.removedCount
    );
    console.log("[seed-erp-sidebar] Sidebar order:");
    sidebar.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.label} (${row.code}, seq ${row.sequence})`);
    });
  }
}

main()
  .catch((err) => {
    console.error("[seed-erp-sidebar] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
