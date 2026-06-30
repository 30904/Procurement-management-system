/**
 * Seed Auto Increment row for Service Master module (SER).
 * Usage: npm run seed:service-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROW = {
  moduleName: "Service Master",
  module: "SER",
  modulePrefix: "SER",
  autoIncrementValue: 0,
  digit: 4,
};

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-service-auto-increment] No company found");
    process.exitCode = 1;
    return;
  }

  await AutoIncrement.findOneAndUpdate(
    { company: company._id, module: ROW.module },
    { $set: { company: company._id, ...ROW } },
    { upsert: true, new: true }
  );

  const total = await AutoIncrement.countDocuments({ company: company._id });
  console.log(
    `[seed-service-auto-increment] Upserted module SER, total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-service-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
