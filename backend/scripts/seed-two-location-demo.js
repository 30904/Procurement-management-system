/**
 * Two-location demo: Factory (HO) + Pune Plant, sub-locations, stores, users, items, assets, sample POs.
 *
 * Run: npm run seed:two-location-demo
 * Login password for demo users: 123456 (also updates existing admin if SEED_RESET_ADMIN_PASSWORD=1)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { SubLocation } from "../src/models/SubLocation.model.js";
import { InventoryStore } from "../src/models/InventoryStore.model.js";
import { User } from "../src/models/User.model.js";
import { Role } from "../src/models/Role.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { AssetMaster } from "../src/models/AssetMaster.model.js";
import { HsnPMaster } from "../src/models/HsnPMaster.model.js";
import { SupplierMaster } from "../src/models/SupplierMaster.model.js";
import { PurchaseOrder } from "../src/models/PurchaseOrder.model.js";
import { ensureAutoIncrementModule, sanitizeLocationCode } from "../src/utils/docNumber.js";

const DEMO_PASSWORD = "123456";

const LOCATION_DEFS = [
  {
    locationId: "Factory",
    locationCode: "LOC00001",
    name: "Factory",
    isCentral: true,
    locationType: "Factory",
    operationalCategory: "Manufacturing",
    state: "Karnataka",
    cityDistrict: "Bengaluru",
    pinCode: "560001",
    addressLine1: "Plot 12, Industrial Area, Peenya",
    gstin: "29AAICV4795A1ZF",
    enablePurchase: true,
    enableSales: true,
  },
  {
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
  },
];

const SUB_LOCATION_DEFS = {
  Factory: [
    { code: "FAC-SLOC-001", id: "Production Floor", name: "Production Floor" },
    { code: "FAC-SLOC-002", id: "Quality Lab", name: "Quality Lab" },
    { code: "FAC-SLOC-003", id: "Dispatch Bay", name: "Dispatch Bay" },
  ],
  "Pune Plant": [
    { code: "PUN-SLOC-001", id: "Shop Floor A", name: "Shop Floor A" },
    { code: "PUN-SLOC-002", id: "RM Stores Bay", name: "RM Stores Bay" },
  ],
};

const MANUFACTURING_STORES = [
  { code: "RM-MAIN", name: "Main RM Store", role: "rm", isDefault: true },
  { code: "CON-MAIN", name: "Consumables Store", role: "con" },
  { code: "FG-MAIN", name: "FG Store", role: "fg" },
  { code: "SCR-MAIN", name: "Scrap Store", role: "scrap" },
];

const USER_DEFS = [
  {
    userName: "alllocations",
    name: "All Locations Admin",
    userEmail: "alllocations@demo.local",
    userCode: "FU00010",
    locationAccessMode: "all",
    allowedLocationKeys: ["Factory", "Pune Plant"],
    defaultLocationKey: "Factory",
  },
  {
    userName: "factory.user",
    name: "Factory Plant User",
    userEmail: "factory.user@demo.local",
    userCode: "FU00011",
    locationAccessMode: "restricted",
    allowedLocationKeys: ["Factory"],
    defaultLocationKey: "Factory",
  },
  {
    userName: "pune.user",
    name: "Pune Plant User",
    userEmail: "pune.user@demo.local",
    userCode: "FU00012",
    locationAccessMode: "restricted",
    allowedLocationKeys: ["Pune Plant"],
    defaultLocationKey: "Pune Plant",
  },
];

async function upsertLocation(companyId, def) {
  return Location.findOneAndUpdate(
    { company: companyId, locationId: def.locationId },
    {
      $set: {
        company: companyId,
        ...def,
        usesCompanyGstin: false,
        status: "Active",
        isActive: true,
        country: "India",
        addressLine2: "",
        addressLine3: "",
        addressLine4: "",
      },
    },
    { upsert: true, new: true }
  );
}

async function seedStoresForLocation(companyId, location) {
  const byRole = {};
  for (const def of MANUFACTURING_STORES) {
    const doc = await InventoryStore.findOneAndUpdate(
      { company: companyId, locationId: location._id, storeCode: def.code },
      {
        $set: {
          company: companyId,
          locationId: location._id,
          storeCode: def.code,
          storeName: def.name,
          status: "Active",
          isDefault: !!def.isDefault,
        },
      },
      { upsert: true, new: true }
    );
    byRole[def.role] = doc;
  }
  await Location.updateOne(
    { _id: location._id },
    {
      $set: {
        defaultRMStoreId: byRole.rm?._id,
        defaultFGStoreId: byRole.fg?._id,
        defaultScrapStoreId: byRole.scrap?._id,
      },
    }
  );
  return byRole;
}

async function seedSubLocations(companyId, location, defs) {
  const out = [];
  for (const def of defs) {
    const doc = await SubLocation.findOneAndUpdate(
      { company: companyId, parentLocation: location._id, subLocationId: def.id },
      {
        $set: {
          company: companyId,
          parentLocation: location._id,
          locationId: location._id,
          subLocationCode: def.code,
          subLocationId: def.id,
          subLocationName: def.name,
          locationType: location.locationType,
          operationalCategory: location.operationalCategory,
          gstin: location.gstin || "",
          status: "Active",
          isActive: true,
          description: `${def.name} at ${location.locationId}`,
        },
      },
      { upsert: true, new: true }
    );
    out.push(doc);
  }
  return out;
}

async function upsertUser(companyId, adminRole, hash, def, locByKey) {
  const allowedIds = def.allowedLocationKeys.map((k) => locByKey[k]._id);
  const defaultId = locByKey[def.defaultLocationKey]._id;
  return User.findOneAndUpdate(
    { company: companyId, userName: def.userName },
    {
      $set: {
        company: companyId,
        userCode: def.userCode,
        name: def.name,
        userName: def.userName,
        userEmail: def.userEmail,
        password: hash,
        role: [adminRole._id],
        userType: "ADMIN",
        isActive: true,
        status: "Active",
        locationAccessMode: def.locationAccessMode,
        allowedLocationIds: allowedIds,
        defaultLocationId: defaultId,
      },
    },
    { upsert: true, new: true }
  );
}

async function seedItems(companyId, actorId, locByKey, storeByLoc, hsnRows) {
  const defs = [
    {
      itemNo: "IRM/0013",
      itemCategory: "IRM",
      itemName: "Copper Wire 1.5 sqmm",
      itemDescription: "Electrical copper wire coil",
      uom: "SET",
      loc: "Factory",
      storeCode: "RM-MAIN",
      status: "Active",
    },
    {
      itemNo: "ICN/0009",
      itemCategory: "ICN",
      itemName: "Cutting Oil",
      itemDescription: "Industrial cutting oil",
      uom: "LTR",
      loc: "Factory",
      storeCode: "CON-MAIN",
      status: "Active",
    },
    {
      itemNo: "IFG/0018",
      itemCategory: "IFG",
      itemName: "Finished Servo Drive Unit",
      itemDescription: "Packed finished servo unit",
      uom: "SET",
      loc: "Factory",
      storeCode: "FG-MAIN",
      status: "Active",
    },
    {
      itemNo: "IRM/0014",
      itemCategory: "IRM",
      itemName: "Steel Rod 12mm",
      itemDescription: "MS steel rod for fabrication",
      uom: "KG",
      loc: "Pune Plant",
      storeCode: "RM-MAIN",
      status: "Active",
    },
    {
      itemNo: "ICN/0010",
      itemCategory: "ICN",
      itemName: "Hydraulic Oil",
      itemDescription: "Hydraulic system oil",
      uom: "LTR",
      loc: "Pune Plant",
      storeCode: "CON-MAIN",
      status: "Active",
    },
    {
      itemNo: "IPK/0007",
      itemCategory: "IPK",
      itemName: "Export Carton Large",
      itemDescription: "Packing carton for export",
      uom: "BOX",
      loc: "Pune Plant",
      storeCode: "FG-MAIN",
      status: "Active",
    },
    {
      itemNo: "ISF/0005",
      itemCategory: "ISF",
      itemName: "Control Panel Sub-Assembly",
      itemDescription: "Semi-finished control panel",
      uom: "NOS",
      loc: "Pune Plant",
      storeCode: "RM-MAIN",
      status: "Active",
    },
    {
      itemNo: "IPK/0006",
      itemCategory: "IPK",
      itemName: "Carton Box Medium",
      itemDescription: "Packing carton box",
      uom: "BOX",
      loc: "Factory",
      storeCode: "FG-MAIN",
      status: "Inactive",
    },
  ];

  for (let i = 0; i < defs.length; i += 1) {
    const row = defs[i];
    const hsn = hsnRows[i % hsnRows.length];
    const location = locByKey[row.loc];
    const store = storeByLoc[row.loc][row.storeCode];
    await ItemMaster.findOneAndUpdate(
      { company: companyId, itemNo: row.itemNo },
      {
        $set: {
          company: companyId,
          createdBy: actorId,
          updatedBy: actorId,
          itemNo: row.itemNo,
          itemCategory: row.itemCategory,
          itemName: row.itemName,
          itemDescription: row.itemDescription,
          uom: row.uom,
          hsnCode: hsn.hsnCode,
          gstRate: Number(hsn.gstRate ?? 0),
          inventoryStore: store.storeCode,
          locationId: location._id,
          inventoryStoreId: store._id,
          status: row.status,
          dualUnit: { enabled: false, primaryUnit: row.uom, secondaryUnit: "", conversionFactor: 1 },
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
  }
  return defs.length;
}

async function seedAssets(companyId, actorId, locByKey, subByLoc, hsnRows, supplier) {
  const factory = locByKey.Factory;
  const pune = locByKey["Pune Plant"];
  const subFactory = subByLoc.Factory.find((s) => s.subLocationId === "Production Floor") || subByLoc.Factory[0];
  const subPune = subByLoc["Pune Plant"][0];

  const defs = [
    {
      assetNo: "MCH/0001",
      assetCategory: "MCH",
      assetName: "PCB LOADER",
      assetDescription: "NTE0700LL",
      location: factory,
      sub: subFactory,
      ratedPowerKw: 2.5,
    },
    {
      assetNo: "MCH/0002",
      assetCategory: "MCH",
      assetName: "SOLDER PASTE PRINTER",
      assetDescription: "DEK Horizon",
      location: factory,
      sub: subFactory,
      ratedPowerKw: 4,
    },
    {
      assetNo: "MCH/0003",
      assetCategory: "MCH",
      assetName: "CHIP SHOOTER",
      assetDescription: "SIPLACE 80S20",
      location: factory,
      sub: subByLoc.Factory.find((s) => s.subLocationId === "Quality Lab") || subFactory,
      ratedPowerKw: 15,
    },
    {
      assetNo: "MCH/0004",
      assetCategory: "MCH",
      assetName: "CNC MILL Pune",
      assetDescription: "Vertical machining center",
      location: pune,
      sub: subPune,
      ratedPowerKw: 22,
    },
  ];

  const baseDate = new Date("2024-01-15");
  for (let i = 0; i < defs.length; i += 1) {
    const row = defs[i];
    const hsn = hsnRows[i % hsnRows.length];
    const locName = row.location.name || row.location.locationId;
    const subName = row.sub.subLocationName || row.sub.subLocationId;
    await AssetMaster.findOneAndUpdate(
      { company: companyId, assetNo: row.assetNo },
      {
        $set: {
          company: companyId,
          createdBy: actorId,
          updatedBy: actorId,
          assetNo: row.assetNo,
          assetCategory: row.assetCategory,
          assetName: row.assetName,
          assetDescription: row.assetDescription,
          uom: "NOS",
          hsnCode: hsn.hsnCode,
          gstRate: Number(hsn.gstRate ?? 0),
          lifeExpectancyYears: 10,
          supplierId: supplier?._id,
          supplierCode: supplier?.supplierCode || "",
          supplierName: supplier?.supplierName || "",
          manufacturerName: "Demo OEM",
          mpnModelNo: row.assetDescription,
          purchaseRateExGst: 500000 + i * 100000,
          assetUniqueId: `DEMO-${row.assetNo.replace("/", "-")}`,
          acquisitionDate: baseDate,
          capitalisationDate: baseDate,
          inOperationDate: baseDate,
          manufacturingYear: 2020,
          ratedPowerKw: row.ratedPowerKw,
          locationId: row.location._id,
          subLocationId: row.sub._id,
          assetLocation: locName,
          subLocation: subName,
          status: "Active",
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
  }
  return defs.length;
}

async function seedPurchaseOrders(companyId, actorId, locByKey, storeByLoc) {
  const supplier = await SupplierMaster.findOne({ company: companyId, status: "Active" }).sort({ supplierCode: 1 }).lean();
  if (!supplier) return 0;

  const samples = [
    { locKey: "Factory", poNo: "FAC-PO-000001", itemNo: "IRM/0013" },
    { locKey: "Pune Plant", poNo: "PUN-PO-000001", itemNo: "IRM/0014" },
  ];

  let count = 0;
  for (const s of samples) {
    const location = locByKey[s.locKey];
    const item = await ItemMaster.findOne({ company: companyId, itemNo: s.itemNo }).lean();
    if (!item) continue;
    const rmStore = storeByLoc[s.locKey]["RM-MAIN"];
    await PurchaseOrder.findOneAndUpdate(
      { company: companyId, poNo: s.poNo },
      {
        $set: {
          company: companyId,
          locationId: location._id,
          inventoryStoreId: rmStore._id,
          poNo: s.poNo,
          poDate: new Date(),
          supplierId: supplier._id,
          supplierName: supplier.supplierName || "",
          status: "Approved",
          lines: [
            {
              lineNo: 1,
              itemId: item._id,
              itemNo: item.itemNo,
              description: item.itemName,
              uom: item.uom,
              qty: 100,
              rate: 250,
              amount: 25000,
              hsnCode: item.hsnCode,
              gstRate: item.gstRate,
            },
          ],
          totalAmount: 25000,
          remarks: `Demo PO for ${s.locKey}`,
          createdBy: actorId,
          updatedBy: actorId,
        },
      },
      { upsert: true, new: true }
    );
    count += 1;
  }
  return count;
}

async function seedDocCounters(companyId, locations) {
  const modules = [
    { module: "PO", prefix: "PO" },
    { module: "GRN", prefix: "GRN" },
    { module: "SO", prefix: "SO" },
    { module: "DN", prefix: "DN" },
    { module: "PINV", prefix: "PINV" },
    { module: "SINV", prefix: "SINV" },
    { module: "ST", prefix: "ST" },
  ];
  for (const loc of locations) {
    const locCode = sanitizeLocationCode(loc);
    for (const m of modules) {
      await ensureAutoIncrementModule(companyId, m.module, m.module, `${locCode}-${m.prefix}`, 0, loc._id);
    }
  }
}

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company");

  console.log(`\n=== Two-location demo seed: ${company.companyName} ===\n`);

  const keepIds = new Set(LOCATION_DEFS.map((d) => d.locationId));
  const deactivated = await Location.updateMany(
    { company: company._id, locationId: { $nin: [...keepIds] } },
    { $set: { isActive: false, status: "Inactive" } }
  );
  if (deactivated.modifiedCount) {
    console.log(`Deactivated ${deactivated.modifiedCount} legacy location(s)`);
  }

  const locByKey = {};
  for (const def of LOCATION_DEFS) {
    const doc = await upsertLocation(company._id, def);
    locByKey[def.locationId] = doc;
    console.log(`Location: ${doc.locationId}${doc.isCentral ? " (HO/central)" : ""}`);
  }

  await Location.updateMany(
    { company: company._id, locationId: { $in: [...keepIds] } },
    { $set: { isCentral: false } }
  );
  await Location.updateOne({ _id: locByKey.Factory._id }, { $set: { isCentral: true } });

  const subByLoc = {};
  for (const [locKey, defs] of Object.entries(SUB_LOCATION_DEFS)) {
    subByLoc[locKey] = await seedSubLocations(company._id, locByKey[locKey], defs);
    console.log(`  ${locKey}: ${defs.length} sub-location(s)`);
  }

  const storeByLoc = {};
  for (const locKey of Object.keys(locByKey)) {
    const stores = await seedStoresForLocation(company._id, locByKey[locKey]);
    storeByLoc[locKey] = {};
    for (const def of MANUFACTURING_STORES) {
      storeByLoc[locKey][def.code] = stores[def.role];
    }
    console.log(`  ${locKey}: ${MANUFACTURING_STORES.length} inventory store(s)`);
  }

  const adminRole = await Role.findOne({ company: company._id, roleName: "ADMIN" });
  if (!adminRole) throw new Error("ADMIN role not found — run seed:framework first");

  const hash = await bcrypt.hash(DEMO_PASSWORD, 8);
  const allLocIds = Object.values(locByKey).map((l) => l._id);

  await User.updateOne(
    { company: company._id, userName: "admin" },
    {
      $set: {
        password: hash,
        locationAccessMode: "all",
        allowedLocationIds: allLocIds,
        defaultLocationId: locByKey.Factory._id,
      },
    }
  );

  await User.updateOne(
    { company: company._id, userType: "SUPER_ADMIN" },
    {
      $set: {
        locationAccessMode: "all",
        allowedLocationIds: allLocIds,
        defaultLocationId: locByKey.Factory._id,
      },
    }
  );

  for (const def of USER_DEFS) {
    await upsertUser(company._id, adminRole, hash, def, locByKey);
    console.log(`User: ${def.userName} (${def.locationAccessMode}) → ${def.allowedLocationKeys.join(", ")}`);
  }

  const actor =
    (await User.findOne({ company: company._id, userName: "admin" })) ||
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 }));
  const actorId = actor?._id;
  const hsnRows = await HsnPMaster.find({ company: company._id, status: "Active" })
    .sort({ hsnCode: 1 })
    .select("hsnCode gstRate")
    .lean();
  if (!hsnRows.length) throw new Error("HSN/P Master required — run seed:hsn-p-master");

  const supplier = await SupplierMaster.findOne({ company: company._id }).sort({ supplierCode: 1 }).lean();

  const itemCount = await seedItems(company._id, actorId, locByKey, storeByLoc, hsnRows);
  console.log(`Items: ${itemCount} upserted with location + store`);

  const assetCount = await seedAssets(company._id, actorId, locByKey, subByLoc, hsnRows, supplier);
  console.log(`Assets: ${assetCount} upserted`);

  const poCount = await seedPurchaseOrders(company._id, actorId, locByKey, storeByLoc);
  console.log(`Purchase orders: ${poCount} sample PO(s)`);

  console.log(
    "\nTip: run npm run seed:location-doc-auto-increment for per-location PO/GRN/SO numbering if not already done."
  );

  console.log("\n--- Test logins (password: 123456) ---");
  console.log("  alllocations  — all locations (locationAccessMode: all)");
  console.log("  factory.user  — Factory only");
  console.log("  pune.user     — Pune Plant only");
  console.log("  admin         — all locations, password 123456");
  console.log("  superadmin    — all locations (framework password unless changed)\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
