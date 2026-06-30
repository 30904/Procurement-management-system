/**
 * Add the "Email Configuration" landing card under Settings.
 * Usage: node scripts/add-email-setup-menu.js
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

  const existing = await MenuItem.findOne({ company: company._id, code: "email_setup" });
  if (existing) {
    console.log("email_setup menu item already exists — skipping.");
  } else {
    await MenuItem.create({
      company: company._id,
      code: "email_setup",
      label: "Email Configuration",
      description: "SMTP settings, transactional email templates, and test email",
      segment: "configuration/email-setup",
      parentCode: "settings",
      menuType: "landing_card",
      sequence: 55,
      isActive: true,
      isHidden: false,
      requiresSuperAdmin: true,
      variant: "admin",
    });
    console.log("Created email_setup menu item under settings.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
