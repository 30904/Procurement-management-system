/**
 * Seed Auto Increment rows for Supplier Category modules.
 * autoIncrementValue = last assigned number (preview shows value + 1).
 * Usage: npm run seed:supplier-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROWS = [
  { moduleName: "Domestic Goods Manufacturer", module: "DGM", modulePrefix: "DGM", autoIncrementValue: 31, digit: 4 },
  { moduleName: "Domestic Goods Trader", module: "DGT", modulePrefix: "DGT", autoIncrementValue: 89, digit: 4 },
  { moduleName: "Domestic Service Provider", module: "DSP", modulePrefix: "DSP", autoIncrementValue: 0, digit: 4 },
  { moduleName: "Domestic Tool Provider", module: "DTP", modulePrefix: "DTP", autoIncrementValue: 0, digit: 4 },
  { moduleName: "Imports Goods Manufacturer", module: "IGM", modulePrefix: "IGM", autoIncrementValue: 0, digit: 4 },
  { moduleName: "Imports Goods Trader", module: "IGT", modulePrefix: "IGT", autoIncrementValue: 0, digit: 4 },
];

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-supplier-auto-increment] No company found");
    process.exitCode = 1;
    return;
  }

  let upserted = 0;
  for (const row of ROWS) {
    await AutoIncrement.findOneAndUpdate(
      { company: company._id, module: row.module },
      { $set: { company: company._id, ...row } },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const total = await AutoIncrement.countDocuments({ company: company._id });
  console.log(
    `[seed-supplier-auto-increment] Upserted ${upserted} module(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-supplier-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
