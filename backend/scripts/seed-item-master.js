import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { HsnPMaster } from "../src/models/HsnPMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ITEMS = [
  { itemNo: "IRM/0013", itemCategory: "IRM", itemName: "Copper Wire 1.5 sqmm", itemDescription: "Electrical copper wire coil", uom: "SET", inventoryStore: "Main RM Store", status: "Active", dualUnit: { enabled: true, primaryUnit: "SET", secondaryUnit: "NOS", conversionFactor: 50 } },
  { itemNo: "ICN/0009", itemCategory: "ICN", itemName: "Cutting Oil", itemDescription: "Industrial cutting oil", uom: "LTR", inventoryStore: "Consumables Store", status: "Active", dualUnit: { enabled: false, primaryUnit: "LTR", secondaryUnit: "", conversionFactor: 1 } },
  { itemNo: "IPK/0006", itemCategory: "IPK", itemName: "Carton Box Medium", itemDescription: "Packing carton box", uom: "BOX", inventoryStore: "FG Store", status: "Active", dualUnit: { enabled: false, primaryUnit: "BOX", secondaryUnit: "", conversionFactor: 1 } },
  { itemNo: "ISF/0004", itemCategory: "ISF", itemName: "Partially Assembled Panel", itemDescription: "Semi finished control panel", uom: "NOS", inventoryStore: "Main RM Store", status: "Inactive", dualUnit: { enabled: false, primaryUnit: "NOS", secondaryUnit: "", conversionFactor: 1 } },
  { itemNo: "IFG/0018", itemCategory: "IFG", itemName: "Finished Servo Drive Unit", itemDescription: "Packed finished servo unit", uom: "SET", inventoryStore: "FG Store", status: "Active", dualUnit: { enabled: true, primaryUnit: "SET", secondaryUnit: "NOS", conversionFactor: 1 } },
];

async function syncCounter(companyId, module) {
  const rows = await ItemMaster.find({ company: companyId, itemCategory: module }).select("itemNo").lean();
  let max = 0;
  for (const row of rows) {
    const m = String(row.itemNo ?? "").match(/\/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module },
    { $set: { autoIncrementValue: max } },
    { new: true }
  );
}

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));
  const actorId = actor?._id ?? null;
  const hsnRows = await HsnPMaster.find({ company: company._id }).sort({ hsnCode: 1 }).select("hsnCode gstRate").lean();
  if (!hsnRows.length) throw new Error("HSN/P records required before seeding Item Master");

  for (let i = 0; i < ITEMS.length; i += 1) {
    const hsn = hsnRows[i % hsnRows.length];
    const row = ITEMS[i];
    await ItemMaster.findOneAndUpdate(
      { company: company._id, itemNo: row.itemNo },
      {
        $set: {
          company: company._id,
          createdBy: actorId,
          updatedBy: actorId,
          itemNo: row.itemNo,
          itemCategory: row.itemCategory,
          itemName: row.itemName,
          itemDescription: row.itemDescription,
          uom: row.uom,
          hsnCode: hsn.hsnCode,
          gstRate: Number(hsn.gstRate ?? 0),
          inventoryStore: row.inventoryStore,
          status: row.status,
          dualUnit: row.dualUnit,
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
  }

  for (const module of ["IRM", "ICN", "IPK", "ISF", "IFG"]) {
    await syncCounter(company._id, module);
  }
  console.log(`[seed-item-master] Upserted ${ITEMS.length} items`);
}

main()
  .catch((err) => {
    console.error("[seed-item-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
