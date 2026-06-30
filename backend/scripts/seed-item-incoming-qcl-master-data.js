/**
 * Seed Item Incoming QCL levels in Master Data (Settings → Master Data).
 * Usage: npm run seed:item-incoming-qcl
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import {
  DEFAULT_ITEM_INCOMING_QCL_LEVELS,
  ITEM_INCOMING_QCL_CATEGORY,
} from "../src/config/itemIncomingQclLevels.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = ITEM_INCOMING_QCL_CATEGORY;
const LEVELS = DEFAULT_ITEM_INCOMING_QCL_LEVELS;

async function upsertLevels(companyId) {
  let count = 0;
  for (const row of LEVELS) {
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
    console.error("[seed-item-incoming-qcl] No company found");
    process.exitCode = 1;
    return;
  }

  const count = await upsertLevels(company._id);
  console.log(
    `[seed-item-incoming-qcl] Upserted ${count} Item Incoming QCL level(s) for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-item-incoming-qcl] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
