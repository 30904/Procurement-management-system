/**
 * VRN — Prospect Supplier registration number (e.g. VRN/0001).
 * Usage: npm run seed:prospect-supplier-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROW = {
  moduleName: "Prospect Supplier Registration",
  module: "VRN",
  modulePrefix: "VRN",
  autoIncrementValue: 5,
  digit: 4,
};

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  await AutoIncrement.findOneAndUpdate(
    { company: company._id, module: ROW.module },
    { $set: { company: company._id, ...ROW } },
    { upsert: true, new: true }
  );
  console.log(`[seed-prospect-supplier-auto-increment] Upserted VRN counter for ${company.companyName}`);
}

main()
  .catch((err) => {
    console.error("[seed-prospect-supplier-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
