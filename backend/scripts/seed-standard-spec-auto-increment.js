/**
 * Seed Auto Increment for Standard Specification (Spec ID → SPC/0001 style).
 * Usage: npm run seed:standard-spec-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { STANDARD_SPEC_AUTO_MODULE } from "../src/config/standardSpecification.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROW = {
  moduleName: "Standard Specification",
  module: STANDARD_SPEC_AUTO_MODULE,
  modulePrefix: "SPC",
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
    console.error("[seed-standard-spec-auto-increment] No company found");
    process.exitCode = 1;
    return;
  }

  await AutoIncrement.findOneAndUpdate(
    { company: company._id, module: ROW.module, locationId: null },
    {
      $setOnInsert: {
        company: company._id,
        moduleName: ROW.moduleName,
        module: ROW.module,
        modulePrefix: ROW.modulePrefix,
        digit: ROW.digit,
        locationId: null,
      },
      $set: { autoIncrementValue: ROW.autoIncrementValue },
    },
    { upsert: true, new: true }
  );

  console.log(
    `[seed-standard-spec-auto-increment] SPC auto increment ready for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-standard-spec-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
