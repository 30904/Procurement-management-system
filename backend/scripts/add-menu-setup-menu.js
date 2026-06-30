/**
 * Adds "Menu Setup" landing card under Settings (Super Admin only).
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
    { company: company._id, code: "menu_setup" },
    {
      $set: {
        company: company._id,
        code: "menu_setup",
        label: "Menu Setup",
        description: "Sidebar and landing page menu catalog",
        segment: "configuration/menu-setup",
        parentCode: "settings",
        menuType: "landing_card",
        sequence: 25,
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
      (p) => p.businessFunction === "menu_setup"
    );
    if (!exists) {
      superRole.permissions.push({
        menuItemId: menu._id,
        businessFunction: "menu_setup",
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

  console.log("[add-menu-setup-menu] Done:", menu.label);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
