/**
 * Drops MongoDB collections for removed ERP modules (Sales, Leads & NPD, Planning UI,
 * Production, Maintenance, Dispatch, HR, Accounts, Finance).
 *
 * Usage: node scripts/drop-non-procurement-collections.js
 * Uses MONGO_URI from backend/.env (default: mongodb://localhost:27017/procurement)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/procurement";

/** Explicit collection names (mongoose model collection names). */
const COLLECTIONS_TO_DROP = [
  // Leads & NPD
  "ProspectMaster",
  "CompetitorMaster",
  "LeadRegister",
  "Opportunity",
  "Quotation",
  "NpdRequest",
  "LeadsNpdConfig",
  "QuotationTermsConfig",
  // Sales
  "SalesOrder",
  "SalesInvoice",
  "DeliveryNote",
  "CustomerMaster",
  "SkuMaster",
  "SkuCustomerLink",
  "HsnSMaster",
  "SacSMaster",
  // Maintenance / Production
  "BreakdownEsr",
  "ProductionLine",
  "ProductionLineAssetMap",
  "PmLinePolicy",
  "PmLineSchedule",
  "PmLineLog",
  "Machine",
  "WorkCenter",
  // Planning SKU INL only (item INL kept for procurement)
  "SkuInventoryLevel",
];

/** AutoIncrement module keys / prefixes to remove. */
const AUTO_INCREMENT_MODULE_PREFIXES = [
  "CUST",
  "SKU",
  "QUOT",
  "SO",
  "LEAD",
  "NPD",
  "ESR",
  "PM",
];

/** Menu codes whose documents should be removed on sync — prefix match. */
export const REMOVED_MENU_CODE_PREFIXES = [
  "leads_npd",
  "planning",
  "sales",
  "production",
  "maintenance",
  "dispatch",
  "hrm",
  "accounts",
  "finance",
  "applications",
  "reports_leads_npd",
  "reports_sales",
  "reports_planning",
  "reports_production",
  "reports_maintenance",
  "reports_dispatch",
  "reports_hrm",
  "reports_accounts",
  "reports_finance",
  "masters_leads_npd",
  "masters_planning",
  "masters_sales",
  "masters_production",
  "masters_maintenance",
  "masters_dispatch",
  "masters_hrm",
  "masters_accounts",
  "masters_finance",
];

async function main() {
  console.log(`Connecting to ${MONGO_URI}…`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  for (const name of COLLECTIONS_TO_DROP) {
    if (!existingNames.has(name)) {
      console.log(`  skip (not found): ${name}`);
      continue;
    }
    await db.dropCollection(name);
    console.log(`  dropped: ${name}`);
  }

  // Clean AutoIncrement rows for removed modules
  if (existingNames.has("AutoIncrement")) {
    const autoInc = db.collection("AutoIncrement");
    const autoDocs = await autoInc.find({}).toArray();
    let removedAuto = 0;
    for (const doc of autoDocs) {
      const mod = String(doc.module || doc.moduleKey || "");
      if (AUTO_INCREMENT_MODULE_PREFIXES.some((p) => mod.startsWith(p))) {
        await autoInc.deleteOne({ _id: doc._id });
        removedAuto += 1;
        console.log(`  removed AutoIncrement: ${mod}`);
      }
    }
    if (removedAuto === 0) console.log("  AutoIncrement: no matching rows removed");
  }

  // Remove menu items for dropped modules (seed will re-sync procurement menus)
  if (existingNames.has("MenuItem")) {
    const menu = db.collection("MenuItem");
    const menus = await menu.find({}).toArray();
    let removedMenus = 0;
    for (const doc of menus) {
      const code = String(doc.code || "");
      if (REMOVED_MENU_CODE_PREFIXES.some((p) => code === p || code.startsWith(`${p}_`))) {
        await menu.deleteOne({ _id: doc._id });
        removedMenus += 1;
      }
    }
    console.log(`  removed ${removedMenus} MenuItem document(s) for dropped modules`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
