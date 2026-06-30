/**
 * Seed Auto Increment for Inspection Checklist (Checklist ID → ICL/0001).
 * Usage: npm run seed:inspection-checklist-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { INSPECTION_CHECKLIST_AUTO_MODULE } from "../src/config/inspectionChecklist.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ROW = {
  moduleName: "Inspection Checklist",
  module: INSPECTION_CHECKLIST_AUTO_MODULE,
  modulePrefix: "ICL",
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
    console.error("[seed-inspection-checklist-auto-increment] No company found");
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
    `[seed-inspection-checklist-auto-increment] ICL auto increment ready for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-inspection-checklist-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
