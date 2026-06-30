import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROWS = [
  { moduleName: "Machinery", module: "MCH", modulePrefix: "MCH", autoIncrementValue: 6, digit: 4 },
  { moduleName: "Capital Goods", module: "ASTCG", modulePrefix: "ASTCG", autoIncrementValue: 8, digit: 4 },
  { moduleName: "Furniture", module: "ASTFR", modulePrefix: "ASTFR", autoIncrementValue: 4, digit: 4 },
  { moduleName: "IT Assets", module: "ASTIT", modulePrefix: "ASTIT", autoIncrementValue: 11, digit: 4 },
  { moduleName: "Vehicle", module: "ASTVH", modulePrefix: "ASTVH", autoIncrementValue: 2, digit: 4 },
];

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  for (const row of ROWS) {
    await AutoIncrement.findOneAndUpdate(
      { company: company._id, module: row.module },
      { $set: { company: company._id, ...row } },
      { upsert: true, new: true }
    );
  }
  console.log(`[seed-asset-auto-increment] Upserted ${ROWS.length} asset module counters`);
}

main()
  .catch((err) => {
    console.error("[seed-asset-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
