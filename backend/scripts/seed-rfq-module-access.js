/**
 * Grants RFQ menu permissions to all active roles that already have Purchase Requisition access.
 * SUPER_ADMIN and ADMIN are fully refreshed by seed:erp-sidebar; this script covers other roles.
 *
 * Usage: npm run seed:rfq-module-access
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";

const RFQ_MENU_CODES = ["purchase_rfq_management", "reports_purchase_rfq_register"];
const REFERENCE_MENU_CODE = "purchase_purchase_indent";

function copyFlagsFrom(source) {
  if (!source) {
    return {
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
  }
  return {
    create: Boolean(source.create),
    edit: Boolean(source.edit),
    view: Boolean(source.view),
    approve: Boolean(source.approve),
    cancel: Boolean(source.cancel),
    delete: Boolean(source.delete),
    reportGenerated: Boolean(source.reportGenerated),
    acknowledgment: Boolean(source.acknowledgment),
    download: Boolean(source.download),
  };
}

function upsertPermission(role, menu, flags) {
  const perms = role.permissions || [];
  const idx = perms.findIndex((p) => p.businessFunction === menu.code);
  const entry = {
    menuItemId: menu._id,
    businessFunction: menu.code,
    ...flags,
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

  const companies = await Company.find({ isActive: { $ne: false } }).sort({ createdAt: 1 });
  if (!companies.length) throw new Error("No active company");

  for (const company of companies) {
    const rfqMenus = await MenuItem.find({
      company: company._id,
      code: { $in: RFQ_MENU_CODES },
      isActive: { $ne: false },
    });
    if (!rfqMenus.length) {
      console.warn(`  ${company.companyName}: RFQ menus not found — run npm run seed:erp-sidebar first`);
      continue;
    }

    const roles = await Role.find({ company: company._id });
    let updated = 0;

    for (const role of roles) {
      const refPerm = (role.permissions || []).find((p) => p.businessFunction === REFERENCE_MENU_CODE);
      const isPrivileged = ["SUPER_ADMIN", "ADMIN"].includes(role.roleName);
      if (!isPrivileged && !refPerm?.view) continue;

      const flags = copyFlagsFrom(refPerm);
      for (const menu of rfqMenus) {
        upsertPermission(role, menu, flags);
      }
      await role.save();
      updated += 1;
      console.log(`  ${company.companyName} · ${role.roleName}: RFQ permissions applied`);
    }

    if (!updated) {
      console.log(`  ${company.companyName}: no additional roles updated (SUPER_ADMIN/ADMIN use sidebar sync)`);
    }
  }

  console.log("[seed-rfq-module-access] Complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => mongoose.disconnect());
