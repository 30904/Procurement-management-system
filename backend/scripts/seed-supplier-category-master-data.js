/**
 * Seed Supplier Category entries in Master Data for the demo / first active company.
 * Usage: npm run seed:supplier-category
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = "Supplier Category";

/** value = auto-increment module key (prefix), label = dropdown display */
const ENTRIES = [
  {
    label: "Domestic Goods Manufacturer",
    value: "DGM",
    description: "Domestic supplier — goods manufacturer",
    sequence: 1,
  },
  {
    label: "Domestic Goods Trader",
    value: "DGT",
    description: "Domestic supplier — goods trader",
    sequence: 2,
  },
  {
    label: "Domestic Service Provider",
    value: "DSP",
    description: "Domestic supplier — service provider",
    sequence: 3,
  },
  {
    label: "Domestic Tool Provider",
    value: "DTP",
    description: "Domestic supplier — tool provider",
    sequence: 4,
  },
  {
    label: "Imports Goods Manufacturer",
    value: "IGM",
    description: "Import supplier — goods manufacturer",
    sequence: 5,
  },
  {
    label: "Imports Goods Trader",
    value: "IGT",
    description: "Import supplier — goods trader",
    sequence: 6,
  },
];

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-supplier-category] No company found");
    process.exitCode = 1;
    return;
  }

  let upserted = 0;
  for (const row of ENTRIES) {
    await MasterData.findOneAndUpdate(
      { company: company._id, category: CATEGORY, label: row.label },
      {
        $set: {
          company: company._id,
          category: CATEGORY,
          label: row.label,
          value: row.value,
          description: row.description,
          sequence: row.sequence,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const seededLabels = ENTRIES.map((e) => e.label);
  const removed = await MasterData.deleteMany({
    company: company._id,
    category: CATEGORY,
    label: { $nin: seededLabels },
  });

  const total = await MasterData.countDocuments({
    company: company._id,
    category: CATEGORY,
  });

  console.log(
    `[seed-supplier-category] Upserted ${upserted}, removed ${removed.deletedCount} orphan(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-supplier-category] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
