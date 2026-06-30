/**
 * Add the "Master Data" landing card under Settings.
 * Usage: node scripts/add-master-data-menu.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";

async function main() {
  await connectDatabase();
  const company = await Company.findOne({}).lean();
  if (!company) {
    console.error("No company found — run seed-framework.js first.");
    process.exit(1);
  }

  const existing = await MenuItem.findOne({
    company: company._id,
    code: "master_data",
  });

  if (existing) {
    console.log("master_data menu item already exists — skipping.");
  } else {
    await MenuItem.create({
      company: company._id,
      code: "master_data",
      label: "Master Data",
      description:
        "Manage generic key-value lookup data (trades, skills, departments, etc.)",
      segment: "configuration/master-data",
      parentCode: "settings",
      menuType: "landing_card",
      sequence: 50,
      isActive: true,
      isHidden: false,
      requiresSuperAdmin: true,
      variant: "admin",
    });
    console.log("Created master_data menu item under settings.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
