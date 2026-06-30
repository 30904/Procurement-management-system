/**
 * Normalizes Company Setup hub cards: upsert all four cards, correct parent, access for ADMIN + SUPER_ADMIN.
 * Run: npm run seed:company-setup-access
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";

const COMPANY_SETUP_CARDS = [
  {
    code: "company_setup",
    label: "Company",
    description: "Company profile and organization settings",
    segment: "configuration/company",
    sequence: 10,
  },
  {
    code: "location_master",
    label: "Location Master",
    description: "Manage business locations and GSTIN",
    segment: "configuration/location-master",
    sequence: 20,
  },
  {
    code: "sub_locations",
    label: "Sub Location Master",
    description: "Manage sub-locations under parent locations",
    segment: "configuration/sub-locations",
    sequence: 30,
  },
  {
    code: "inventory_stores",
    label: "Inventory Stores",
    description: "Manage stock-holding stores per location",
    segment: "configuration/inventory-stores",
    sequence: 40,
  },
];

const FULL_FLAGS = {
  create: true,
  edit: true,
  view: true,
  approve: true,
  cancel: true,
  delete: true,
  reportGenerated: true,
  acknowledgment: true,
  download: true,
};

function upsertRolePermission(role, menu) {
  const perms = role.permissions || [];
  const idx = perms.findIndex((p) => p.businessFunction === menu.code);
  const entry = {
    menuItemId: menu._id,
    businessFunction: menu.code,
    ...FULL_FLAGS,
  };
  if (idx >= 0) {
    perms[idx] = { ...perms[idx], ...entry };
  } else {
    perms.push(entry);
  }
  role.permissions = perms;
}

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company");

  for (const card of COMPANY_SETUP_CARDS) {
    await MenuItem.findOneAndUpdate(
      { company: company._id, code: card.code },
      {
        $set: {
          company: company._id,
          code: card.code,
          label: card.label,
          description: card.description,
          segment: card.segment,
          parentCode: "company_setup_group",
          menuType: "landing_card",
          sequence: card.sequence,
          requiresSuperAdmin: false,
          variant: "",
          isHidden: false,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`  ${card.code}: upserted under company_setup_group`);
  }

  const menus = await MenuItem.find({
    company: company._id,
    code: { $in: COMPANY_SETUP_CARDS.map((c) => c.code) },
  });

  for (const roleName of ["SUPER_ADMIN", "ADMIN"]) {
    const role = await Role.findOne({ company: company._id, roleName });
    if (!role) {
      console.warn(`  Role ${roleName} not found — skipped`);
      continue;
    }
    for (const menu of menus) {
      upsertRolePermission(role, menu);
    }
    await role.save();
    console.log(`  ${roleName}: permissions updated for Company Setup cards`);
  }

  console.log("Company Setup menu access fix complete.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
