/**
 * Seeds InventoryStore rows per location and wires Location default RM / FG / Scrap stores.
 * Uses Master Data "Inventory Store" labels when present; otherwise a standard manufacturing set.
 *
 * Run: npm run seed:inventory-stores-from-master-data
 * Recommended: npm run seed:location-central && npm run seed:location && npm run seed:inventory-stores-from-master-data
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { MasterData } from "../src/models/MasterData.model.js";
import { InventoryStore } from "../src/models/InventoryStore.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";

/** Standard stores for manufacturing / factory locations */
const MANUFACTURING_STORES = [
  { code: "RM-MAIN", name: "Main RM Store", role: "rm", isDefault: true },
  { code: "CON-MAIN", name: "Consumables Store", role: "con" },
  { code: "FG-MAIN", name: "FG Store", role: "fg" },
  { code: "SCR-MAIN", name: "Scrap Store", role: "scrap" },
];

/** Lighter set for head office / corporate sites */
const OFFICE_STORES = [
  { code: "GEN-01", name: "General Store", role: "default", isDefault: true },
  { code: "FG-MAIN", name: "FG Store", role: "fg" },
];

function slugCode(label) {
  const base = String(label || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
  return base || "STORE";
}

function isOfficeLocation(location) {
  const type = String(location.locationType || "").toLowerCase();
  const category = String(location.operationalCategory || "").toLowerCase();
  if (type.includes("factory") || category.includes("manufactur")) return false;
  return (
    type.includes("head") ||
    type.includes("office") ||
    category.includes("corporate") ||
    (location.isCentral && !type.includes("factory"))
  );
}

const MASTER_NAME_MAP = [
  { pattern: /rm|raw\s*material/i, code: "RM-MAIN", role: "rm" },
  { pattern: /consum/i, code: "CON-MAIN", role: "con" },
  { pattern: /fg|finish/i, code: "FG-MAIN", role: "fg" },
  { pattern: /scrap/i, code: "SCR-MAIN", role: "scrap" },
];

function resolveStoreCatalog(location, masterRows) {
  if (masterRows.length > 0) {
    const catalog = masterRows.map((row, index) => {
      const name = String(row.name || row.label || row.code || "").trim();
      let code = slugCode(name);
      let role = "other";
      for (const rule of MASTER_NAME_MAP) {
        if (rule.pattern.test(name)) {
          code = rule.code;
          role = rule.role;
          break;
        }
      }
      return {
        code,
        name,
        role,
        isDefault: index === 0,
      };
    });

    if (!isOfficeLocation(location) && !catalog.some((c) => c.role === "scrap")) {
      catalog.push({
        code: "SCR-MAIN",
        name: "Scrap Store",
        role: "scrap",
      });
    }
    return catalog;
  }

  return isOfficeLocation(location) ? OFFICE_STORES : MANUFACTURING_STORES;
}

async function upsertStore(companyId, locationId, def) {
  return InventoryStore.findOneAndUpdate(
    { company: companyId, locationId, storeCode: def.code },
    {
      $set: {
        company: companyId,
        locationId,
        storeCode: def.code,
        storeName: def.name,
        status: "Active",
        isDefault: !!def.isDefault,
        description: def.description || "",
      },
    },
    { upsert: true, new: true }
  );
}

async function seedLocation(company, location, masterRows) {
  const catalog = resolveStoreCatalog(location, masterRows);
  const byRole = {};

  for (const def of catalog) {
    const doc = await upsertStore(company._id, location._id, def);
    if (def.role) byRole[def.role] = doc;
    console.log(`    ${location.locationId}: ${def.code} — ${def.name}`);
  }

  const rm = byRole.rm || byRole.default;
  const fg = byRole.fg;
  const scrap = byRole.scrap;

  const locUpdate = {};
  if (rm) locUpdate.defaultRMStoreId = rm._id;
  if (fg) locUpdate.defaultFGStoreId = fg._id;
  if (scrap) locUpdate.defaultScrapStoreId = scrap._id;

  if (Object.keys(locUpdate).length) {
    await Location.updateOne({ _id: location._id }, { $set: locUpdate });
  }

  if (rm) {
    await ItemMaster.updateMany(
      {
        company: company._id,
        $or: [
          { inventoryStore: rm.storeName },
          { inventoryStore: { $in: catalog.map((c) => c.name) } },
        ],
      },
      { $set: { inventoryStoreId: rm._id, locationId: location._id } }
    );
  }

  return catalog.length;
}

async function main() {
  await connectDatabase();
  const companies = await Company.find({ isActive: { $ne: false } }).lean();

  for (const company of companies) {
    const locations = await Location.find({
      company: company._id,
      isActive: { $ne: false },
    })
      .sort({ isCentral: -1, locationId: 1 })
      .lean();

    if (!locations.length) {
      console.warn(`No locations for ${company.companyName}; run seed:location or seed:location-central`);
      continue;
    }

    const masterRows = await MasterData.find({
      company: company._id,
      category: "Inventory Store",
      isActive: { $ne: false },
    })
      .sort({ sequence: 1, label: 1 })
      .lean();

    console.log(`\n${company.companyName} (${locations.length} location(s), ${masterRows.length} master row(s)):`);

    let total = 0;
    for (const location of locations) {
      total += await seedLocation(company, location, masterRows);
    }
    console.log(`  → ${total} store record(s) upserted`);
  }

  await mongoose.disconnect();
  console.log("\nInventory stores seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
