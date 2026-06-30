import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company");

  await MenuItem.findOneAndUpdate(
    { company: company._id, code: "inventory_stores" },
    {
      $set: {
        company: company._id,
        code: "inventory_stores",
        label: "Inventory Stores",
        description: "Manage stock-holding stores per location",
        segment: "configuration/inventory-stores",
        parentCode: "company_setup_group",
        menuType: "landing_card",
        sequence: 40,
        isActive: true,
        isHidden: false,
        requiresSuperAdmin: false,
        variant: "",
      },
    },
    { upsert: true }
  );

  const superRole = await Role.findOne({
    company: company._id,
    roleName: "SUPER_ADMIN",
  });

  const menu = await MenuItem.findOne({
    company: company._id,
    code: "inventory_stores",
  });

  if (superRole && menu) {
    const exists = (superRole.permissions || []).some(
      (p) => p.businessFunction === "inventory_stores"
    );
    if (!exists) {
      superRole.permissions.push({
        menuItemId: menu._id,
        businessFunction: "inventory_stores",
        create: true,
        edit: true,
        view: true,
        approve: true,
        cancel: true,
        delete: true,
        reportGenerated: true,
      });
      await superRole.save();
      console.log("SUPER_ADMIN permission added for inventory_stores");
    }
  }

  console.log("Inventory Stores menu card added under Company Setup");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
