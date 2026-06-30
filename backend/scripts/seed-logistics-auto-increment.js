/**
 * Seed Auto Increment rows for Logistics (LSP Category) modules.
 * Usage: npm run seed:logistics-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROWS = [
  { moduleName: "Road Transporter", module: "LRT", modulePrefix: "LRT", autoIncrementValue: 15, digit: 4 },
  { moduleName: "Rail Logistics", module: "LRL", modulePrefix: "LRL", autoIncrementValue: 8, digit: 4 },
  { moduleName: "Air Cargo", module: "LAC", modulePrefix: "LAC", autoIncrementValue: 4, digit: 4 },
  { moduleName: "Sea Freight", module: "LSF", modulePrefix: "LSF", autoIncrementValue: 11, digit: 4 },
  { moduleName: "Multimodal Partner", module: "LMP", modulePrefix: "LMP", autoIncrementValue: 2, digit: 4 },
];

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-logistics-auto-increment] No company found");
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
    `[seed-logistics-auto-increment] Upserted ${upserted} module(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-logistics-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
