/**
 * Seed default Inspection Checklist master rows.
 * Usage: npm run seed:inspection-checklist
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import {
  DEFAULT_INSPECTION_CHECKLIST_ITEMS,
  INSPECTION_CHECKLIST_AUTO_MODULE,
} from "../src/config/inspectionChecklist.js";
import { formatAutoIncrementCode } from "../src/services/autoIncrement.service.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";
import { InspectionChecklist } from "../src/models/InspectionChecklist.model.js";

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-inspection-checklist] No company found");
    process.exitCode = 1;
    return;
  }

  const companyId = company._id;
  const digit = 4;
  const prefix = "ICL";
  let upserted = 0;

  for (let i = 0; i < DEFAULT_INSPECTION_CHECKLIST_ITEMS.length; i += 1) {
    const seq = i + 1;
    const checklistId = formatAutoIncrementCode(prefix, seq, digit);
    const checklistItem = String(DEFAULT_INSPECTION_CHECKLIST_ITEMS[i]).trim();

    await InspectionChecklist.findOneAndUpdate(
      { company: companyId, checklistId },
      {
        $set: {
          company: companyId,
          checklistId,
          checklistItem,
          displayOrder: seq,
          status: "Active",
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: INSPECTION_CHECKLIST_AUTO_MODULE, locationId: null },
    {
      $setOnInsert: {
        company: companyId,
        moduleName: "Inspection Checklist",
        module: INSPECTION_CHECKLIST_AUTO_MODULE,
        modulePrefix: prefix,
        digit,
        locationId: null,
      },
      $set: { autoIncrementValue: DEFAULT_INSPECTION_CHECKLIST_ITEMS.length },
    },
    { upsert: true }
  );

  console.log(
    `[seed-inspection-checklist] Upserted ${upserted} checklist item(s) for ${company.companyName}; ICL counter = ${DEFAULT_INSPECTION_CHECKLIST_ITEMS.length}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-inspection-checklist] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
