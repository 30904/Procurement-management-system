/**
 * Migrates sidebar to Dashboard + Menu 1–8 with generic module landing cards.
 * Run: npm run migrate:generic-menus
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { LEGACY_MAIN_MENU_CODES } from "./menu-catalog.js";
import { syncMenuCatalogForCompany } from "./menu-sync.js";

const LEGACY_TO_NEW = [
  { legacy: "sales", code: "menu_1", label: "Menu 1", segment: "menu-1", sequence: 20, iconKey: "sales", activeIconKey: "sales_active" },
  { legacy: "purchase", code: "menu_2", label: "Menu 2", segment: "menu-2", sequence: 30, iconKey: "purchase", activeIconKey: "purchase_active" },
  { legacy: "expense", code: "menu_3", label: "Menu 3", segment: "menu-3", sequence: 40, iconKey: "expense", activeIconKey: "expense_active" },
  { legacy: "payment", code: "menu_4", label: "Menu 4", segment: "menu-4", sequence: 50, iconKey: "payment", activeIconKey: "payment_active" },
  { legacy: "receipt", code: "menu_5", label: "Menu 5", segment: "menu-5", sequence: 60, iconKey: "receipt", activeIconKey: "receipt_active" },
  { legacy: "contra", code: "menu_6", label: "Menu 6", segment: "menu-6", sequence: 70, iconKey: "contra", activeIconKey: "contra_active" },
  { legacy: "journal", code: "menu_7", label: "Menu 7", segment: "menu-7", sequence: 80, iconKey: "journal", activeIconKey: "journal_active" },
  { legacy: "reports", code: "menu_8", label: "Menu 8", segment: "menu-8", sequence: 90, iconKey: "reports", activeIconKey: "reports_active" },
];

async function migrateLegacyMainMenus(companyId) {
  for (const row of LEGACY_TO_NEW) {
    const existing = await MenuItem.findOne({ company: companyId, code: row.legacy });
    if (existing) {
      await MenuItem.updateOne(
        { _id: existing._id },
        {
          $set: {
            code: row.code,
            label: row.label,
            segment: row.segment,
            sequence: row.sequence,
            iconKey: row.iconKey,
            activeIconKey: row.activeIconKey,
            menuType: "sidebar_main",
            isActive: true,
            isHidden: false,
          },
        }
      );
    }
  }

  await MenuItem.updateMany(
    { company: companyId, code: { $in: LEGACY_MAIN_MENU_CODES } },
    { $set: { isHidden: true, isActive: false } }
  );
}

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company found");

  await migrateLegacyMainMenus(company._id);
  const result = await syncMenuCatalogForCompany(company._id);

  console.log(
    "[migrate-generic-menus] Done —",
    result.menuCount,
    "menu items, removed",
    result.removedCount,
    "legacy/orphan row(s)"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
