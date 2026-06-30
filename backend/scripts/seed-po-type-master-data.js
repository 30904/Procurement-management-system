/**
 * Seed PO Type entries in Master Data (Settings → Data Management → PO Type).
 * Usage: npm run seed:po-type
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = "PO Type";

const PO_TYPES = [
  {
    label: "Standard PO",
    value: "Standard PO",
    description: "One-time purchase order for specific goods or services",
    sequence: 1,
  },
  {
    label: "Planned PO",
    value: "Planned PO",
    description: "Purchase order linked to a planned requirement or MRP run",
    sequence: 2,
  },
  {
    label: "Blanket PO",
    value: "Blanket PO",
    description: "Long-term agreement with scheduled or call-off releases",
    sequence: 3,
  },
];

async function upsertPoTypes(companyId) {
  let count = 0;
  for (const row of PO_TYPES) {
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
    console.error("[seed-po-type] No company found");
    process.exitCode = 1;
    return;
  }

  const count = await upsertPoTypes(company._id);
  console.log(`[seed-po-type] Upserted ${count} PO Type record(s) for ${company.companyName}`);
}

main()
  .catch((err) => {
    console.error("[seed-po-type] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
