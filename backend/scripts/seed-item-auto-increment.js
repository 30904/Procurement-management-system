import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROWS = [
  { moduleName: "Raw Material", module: "IRM", modulePrefix: "IRM", autoIncrementValue: 12, digit: 4 },
  { moduleName: "Consumable", module: "ICN", modulePrefix: "ICN", autoIncrementValue: 8, digit: 4 },
  { moduleName: "Packing Material", module: "IPK", modulePrefix: "IPK", autoIncrementValue: 5, digit: 4 },
  { moduleName: "Semi Finished", module: "ISF", modulePrefix: "ISF", autoIncrementValue: 3, digit: 4 },
  { moduleName: "Finished Goods", module: "IFG", modulePrefix: "IFG", autoIncrementValue: 17, digit: 4 },
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
  console.log(`[seed-item-auto-increment] Upserted ${ROWS.length} item module counters`);
}

main()
  .catch((err) => {
    console.error("[seed-item-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
