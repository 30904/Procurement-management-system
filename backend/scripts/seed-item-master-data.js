import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY_ENTRIES = [
  {
    category: "Item Category",
    rows: [
      { label: "Raw Material", value: "IRM", sequence: 1 },
      { label: "Consumable", value: "ICN", sequence: 2 },
      { label: "Packing Material", value: "IPK", sequence: 3 },
      { label: "Semi Finished", value: "ISF", sequence: 4 },
      { label: "Finished Goods", value: "IFG", sequence: 5 },
    ],
  },
  {
    category: "UoM",
    rows: [
      { label: "NOS", sequence: 1 },
      { label: "SET", sequence: 2 },
      { label: "KG", sequence: 3 },
      { label: "LTR", sequence: 4 },
      { label: "MTR", sequence: 5 },
      { label: "BOX", sequence: 6 },
      { label: "NA - Not Applicable", value: "NA", sequence: 99 },
    ],
  },
  {
    category: "Inventory Store",
    rows: [
      { label: "Main RM Store", sequence: 1 },
      { label: "Consumables Store", sequence: 2 },
      { label: "FG Store", sequence: 3 },
    ],
  },
];

async function upsertCategory(companyId, category, rows) {
  for (const row of rows) {
    const label = String(row.label).trim();
    const value = String(row.value ?? label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category, label },
      {
        $set: {
          company: companyId,
          category,
          label,
          value,
          description: row.description ?? "",
          sequence: row.sequence ?? 0,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
  }
}

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  for (const entry of CATEGORY_ENTRIES) {
    await upsertCategory(company._id, entry.category, entry.rows);
    console.log(`[seed-item-master-data] ${entry.category}: ${entry.rows.length} upserted`);
  }
}

main()
  .catch((err) => {
    console.error("[seed-item-master-data] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
