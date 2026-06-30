/**
 * Seed Incidental Expenses in Master Data (Settings → Data Management → Incidental Expenses).
 * Usage: npm run seed:incidental-expenses
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const CATEGORY = "Incidental Expenses";

const INCIDENTAL_EXPENSES = [
  {
    label: "Freight & Forwarding Charges",
    value: "Freight & Forwarding Charges",
    description: "Transport and forwarding costs for the purchase order",
    sequence: 1,
  },
  {
    label: "Loading & Unloading",
    value: "Loading & Unloading",
    description: "Loading and unloading charges at origin or destination",
    sequence: 2,
  },
  {
    label: "Packing",
    value: "Packing",
    description: "Packing and crating expenses",
    sequence: 3,
  },
  {
    label: "Insurance",
    value: "Insurance",
    description: "Transit or goods insurance charges",
    sequence: 4,
  },
];

async function upsertIncidentalExpenses(companyId) {
  let count = 0;
  for (const row of INCIDENTAL_EXPENSES) {
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
    console.error("[seed-incidental-expenses] No company found");
    process.exitCode = 1;
    return;
  }

  const count = await upsertIncidentalExpenses(company._id);
  console.log(
    `[seed-incidental-expenses] Upserted ${count} Incidental Expense record(s) for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-incidental-expenses] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
