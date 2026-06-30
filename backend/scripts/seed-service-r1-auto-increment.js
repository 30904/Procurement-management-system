import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROWS = [
  { moduleName: "Repair & Maintenance", module: "RMT", modulePrefix: "RMT", autoIncrementValue: 1, digit: 4 },
  { moduleName: "Installation", module: "INS", modulePrefix: "INS", autoIncrementValue: 0, digit: 4 },
  { moduleName: "Consulting", module: "CON", modulePrefix: "CON", autoIncrementValue: 0, digit: 4 },
  { moduleName: "AMC", module: "AMC", modulePrefix: "AMC", autoIncrementValue: 0, digit: 4 },
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
  console.log(`[seed-service-r1-auto-increment] Upserted ${ROWS.length} service R1 module counters`);
}

main()
  .catch((err) => {
    console.error("[seed-service-r1-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
