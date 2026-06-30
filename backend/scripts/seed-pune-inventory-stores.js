/**
 * Ensures Pune Plant exists and seeds the same inventory store catalog as other factory sites.
 *
 * Run: npm run seed:pune-inventory-stores
 * Also runs: seed:inventory-stores-from-master-data logic for Pune only (after ensuring location).
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { MasterData } from "../src/models/MasterData.model.js";
import { InventoryStore } from "../src/models/InventoryStore.model.js";

const PUNE_DEF = {
  locationId: "Pune Plant",
  locationCode: "LOC00002",
  name: "Pune Plant",
  isCentral: false,
  locationType: "Factory",
  operationalCategory: "Manufacturing",
  state: "Maharashtra",
  cityDistrict: "Pune",
  pinCode: "411001",
  addressLine1: "MIDC Chakan, Phase 2",
  gstin: "27AAICV4795A1Z9",
  enablePurchase: true,
  enableSales: true,
  usesCompanyGstin: false,
  status: "Active",
  isActive: true,
  country: "India",
  addressLine2: "",
  addressLine3: "",
  addressLine4: "",
};

const FALLBACK_STORES = [
  { code: "RM-MAIN", name: "Main RM Store", role: "rm", isDefault: true },
  { code: "CON-MAIN", name: "Consumables Store", role: "con" },
  { code: "FG-MAIN", name: "FG Store", role: "fg" },
  { code: "FG-STORE", name: "FG Store", role: "fg-alt" },
  { code: "SCR-MAIN", name: "Scrap Store", role: "scrap" },
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

const MASTER_NAME_MAP = [
  { pattern: /rm|raw\s*material/i, code: "RM-MAIN", role: "rm" },
  { pattern: /consum/i, code: "CON-MAIN", role: "con" },
  { pattern: /fg|finish/i, code: "FG-MAIN", role: "fg" },
  { pattern: /scrap/i, code: "SCR-MAIN", role: "scrap" },
];

function catalogFromMaster(masterRows) {
  if (!masterRows.length) return FALLBACK_STORES;
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
    return { code, name, role, isDefault: index === 0 };
  });
  if (!catalog.some((c) => c.role === "scrap")) {
    catalog.push({ code: "SCR-MAIN", name: "Scrap Store", role: "scrap" });
  }
  return catalog;
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

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company");

  const pune = await Location.findOneAndUpdate(
    { company: company._id, locationId: PUNE_DEF.locationId },
    { $set: { company: company._id, ...PUNE_DEF } },
    { upsert: true, new: true }
  );

  const factory = await Location.findOne({
    company: company._id,
    locationId: "Factory",
    isActive: { $ne: false },
  }).lean();

  let catalog;
  if (factory) {
    const factoryStores = await InventoryStore.find({
      company: company._id,
      locationId: factory._id,
      status: { $ne: "Inactive" },
    })
      .sort({ storeCode: 1 })
      .lean();
    if (factoryStores.length) {
      catalog = factoryStores.map((s, index) => ({
        code: s.storeCode,
        name: s.storeName,
        role: s.storeCode,
        isDefault: index === 0,
      }));
      console.log(`Copying ${catalog.length} store(s) from Factory → Pune Plant`);
    }
  }

  if (!catalog) {
    const masterRows = await MasterData.find({
      company: company._id,
      category: "Inventory Store",
      isActive: { $ne: false },
    })
      .sort({ sequence: 1, label: 1 })
      .lean();
    catalog = catalogFromMaster(masterRows);
    console.log(`Using master-data catalog (${catalog.length} store(s)) for Pune Plant`);
  }

  const byRole = {};
  for (const def of catalog) {
    const doc = await upsertStore(company._id, pune._id, def);
    if (def.role) byRole[def.role] = doc;
    console.log(`  ${def.code} — ${def.name}`);
  }

  const rm = byRole.rm || byRole[Object.keys(byRole)[0]];
  const fg = byRole.fg || byRole["fg-alt"];
  const scrap = byRole.scrap;
  const locUpdate = {};
  if (rm) locUpdate.defaultRMStoreId = rm._id;
  if (fg) locUpdate.defaultFGStoreId = fg._id;
  if (scrap) locUpdate.defaultScrapStoreId = scrap._id;
  if (Object.keys(locUpdate).length) {
    await Location.updateOne({ _id: pune._id }, { $set: locUpdate });
  }

  const count = await InventoryStore.countDocuments({
    company: company._id,
    locationId: pune._id,
    status: { $ne: "Inactive" },
  });

  console.log(`\nPune Plant: ${count} active inventory store(s). Refresh Inventory Stores in Company Setup.\n`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
