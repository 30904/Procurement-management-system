import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY_ENTRIES = [
  {
    category: "Asset Category",
    rows: [
      { label: "Machinery", value: "MCH", sequence: 1 },
      { label: "Capital Goods", value: "ASTCG", sequence: 2 },
      { label: "Furniture", value: "ASTFR", sequence: 3 },
      { label: "IT Assets", value: "ASTIT", sequence: 4 },
      { label: "Vehicle", value: "ASTVH", sequence: 5 },
    ],
  },
  {
    category: "Asset Location",
    rows: [
      { label: "Factory", sequence: 1 },
      { label: "Main Plant", sequence: 2 },
      { label: "Corporate Office", sequence: 3 },
      { label: "Warehouse A", sequence: 4 },
      { label: "Warehouse B", sequence: 5 },
    ],
  },
  {
    category: "Asset Sub Location",
    rows: [
      { label: "SMT Line 1", sequence: 1 },
      { label: "SMT Line 2", sequence: 2 },
      { label: "Assembly Bay", sequence: 3 },
      { label: "Stores", sequence: 4 },
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
    console.log(`[seed-asset-master-data] ${entry.category}: ${entry.rows.length} upserted`);
  }
}

main()
  .catch((err) => {
    console.error("[seed-asset-master-data] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
