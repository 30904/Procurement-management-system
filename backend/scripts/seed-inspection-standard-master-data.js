/**
 * Seed Inspection Standard options in Master Data (Settings → Master Data).
 * Usage: npm run seed:inspection-standard
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import {
  DEFAULT_INSPECTION_STANDARDS,
  INSPECTION_STANDARD_CATEGORY,
} from "../src/config/inspectionStandard.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = INSPECTION_STANDARD_CATEGORY;
const ROWS = DEFAULT_INSPECTION_STANDARDS;

async function upsertRows(companyId) {
  let count = 0;
  for (const row of ROWS) {
    const label = String(row.label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category: CATEGORY, label },
      {
        $set: {
          company: companyId,
          category: CATEGORY,
          label,
          value: String(row.value ?? label).trim(),
          description: row.description ?? "",
          sequence: row.sequence ?? 0,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
    count += 1;
  }
  return count;
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-inspection-standard] No company found");
    process.exitCode = 1;
    return;
  }

  const count = await upsertRows(company._id);
  console.log(
    `[seed-inspection-standard] Upserted ${count} Inspection Standard option(s) for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-inspection-standard] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
