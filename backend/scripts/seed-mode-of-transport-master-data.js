/**
 * Seed Mode of Transport in Master Data.
 * Usage: npm run seed:mode-of-transport
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = "Mode of Transport";

const MODES = [
  { label: "Road", value: "Road", description: "Surface transport by road", sequence: 1 },
  { label: "Rail", value: "Rail", description: "Transport by railway", sequence: 2 },
  { label: "Air", value: "Air", description: "Air freight / cargo", sequence: 3 },
  { label: "Sea", value: "Sea", description: "Ocean / sea freight", sequence: 4 },
];

async function upsertModes(companyId) {
  let count = 0;
  for (const row of MODES) {
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
    console.error("[seed-mode-of-transport] No company found");
    process.exitCode = 1;
    return;
  }

  const count = await upsertModes(company._id);
  console.log(`[seed-mode-of-transport] Upserted ${count} Mode of Transport record(s) for ${company.companyName}`);
}

main()
  .catch((err) => {
    console.error("[seed-mode-of-transport] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
