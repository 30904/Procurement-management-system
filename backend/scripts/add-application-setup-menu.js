/**
 * Adds "Application Set-up" landing card under Settings (Super Admin only).
 * Run: node scripts/add-application-setup-menu.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";

async function main() {
  await connectDatabase();

  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company found");

  const menu = await MenuItem.findOneAndUpdate(
    { company: company._id, code: "application_setup" },
    {
      $set: {
        company: company._id,
        code: "application_setup",
        label: "Application Set-up",
        description: "Application and platform configuration",
        segment: "configuration/application-setup",
        parentCode: "settings",
        menuType: "landing_card",
        sequence: 30,
        isActive: true,
        isHidden: false,
        requiresSuperAdmin: true,
        variant: "admin",
      },
    },
    { upsert: true, new: true }
  );

  const superRole = await Role.findOne({
    company: company._id,
    roleName: "SUPER_ADMIN",
  });

  if (superRole) {
    const exists = (superRole.permissions || []).some(
      (p) => p.businessFunction === "application_setup"
    );
    if (!exists) {
      superRole.permissions.push({
        menuItemId: menu._id,
        businessFunction: "application_setup",
        create: true,
        edit: true,
        view: true,
        approve: true,
        cancel: true,
        delete: true,
        reportGenerated: true,
        acknowledgment: true,
        download: true,
      });
      await superRole.save();
    }
  }

  console.log("[add-application-setup-menu] Done:", menu.label, menu._id.toString());
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
