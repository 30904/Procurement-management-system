/**
 * Seed Logistics MasterData categories:
 * - LSP Category
 * - Type of Freight Service
 * - RCM Applicability
 * - Account Type
 *
 * Usage: npm run seed:logistics-master-data
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY_ENTRIES = [
  {
    category: "LSP Category",
    rows: [
      { label: "Road Transporter", value: "LRT", sequence: 1 },
      { label: "Rail Logistics", value: "LRL", sequence: 2 },
      { label: "Air Cargo", value: "LAC", sequence: 3 },
      { label: "Sea Freight", value: "LSF", sequence: 4 },
      { label: "Multimodal Partner", value: "LMP", sequence: 5 },
    ],
  },
  {
    category: "Type of Freight Service",
    rows: [
      { label: "Full Truck Load", sequence: 1 },
      { label: "Part Truck Load", sequence: 2 },
      { label: "Express", sequence: 3 },
      { label: "Over Dimensional Cargo", sequence: 4 },
      { label: "Dedicated Vehicle", sequence: 5 },
    ],
  },
  {
    category: "RCM Applicability",
    rows: [
      { label: "Applicable", sequence: 1 },
      { label: "Not Applicable", sequence: 2 },
    ],
  },
  {
    category: "Account Type",
    rows: [
      { label: "Savings", sequence: 1 },
      { label: "Current", sequence: 2 },
      { label: "Cash Credit", sequence: 3 },
      { label: "Overdraft", sequence: 4 },
    ],
  },
];

async function upsertCategory(companyId, category, rows) {
  let upserted = 0;
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
    upserted += 1;
  }
  return upserted;
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-logistics-master-data] No company found");
    process.exitCode = 1;
    return;
  }

  let totalUpserted = 0;
  for (const group of CATEGORY_ENTRIES) {
    const count = await upsertCategory(company._id, group.category, group.rows);
    totalUpserted += count;
    console.log(`[seed-logistics-master-data] ${group.category}: upserted ${count}`);
  }

  console.log(
    `[seed-logistics-master-data] Total upserted ${totalUpserted} entries for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-logistics-master-data] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
