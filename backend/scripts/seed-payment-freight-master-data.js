/**
 * Seed Payment Terms and Freight Terms in Master Data.
 * Usage: npm run seed:payment-freight
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const PAYMENT_TERMS = [
  { label: "100% Advance", sequence: 1 },
  { label: "50% Advance, 50% on Delivery", sequence: 2 },
  { label: "Net 15 Days", sequence: 3 },
  { label: "Net 30 Days", sequence: 4 },
  { label: "Net 45 Days", sequence: 5 },
  { label: "Net 60 Days", sequence: 6 },
  { label: "Against Delivery", sequence: 7 },
];

const FREIGHT_TERMS = [
  { label: "EXW – Ex-Warehouse", sequence: 1 },
  { label: "FOB – Free on Board", sequence: 2 },
  { label: "CIF – Cost, Insurance & Freight", sequence: 3 },
  { label: "DDP – Delivered Duty Paid", sequence: 4 },
  { label: "FCA – Free Carrier", sequence: 5 },
  { label: "CFR – Cost and Freight", sequence: 6 },
  { label: "CPT – Carriage Paid To", sequence: 7 },
];

async function upsertCategory(companyId, category, entries) {
  let count = 0;
  for (const row of entries) {
    const label = String(row.label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category, label },
      {
        $set: {
          company: companyId,
          category,
          label,
          value: label,
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
    console.error("[seed-payment-freight] No company found");
    process.exitCode = 1;
    return;
  }

  const paymentCount = await upsertCategory(company._id, "Payment Terms", PAYMENT_TERMS);
  const freightCount = await upsertCategory(company._id, "Freight Terms", FREIGHT_TERMS);

  console.log(
    `[seed-payment-freight] Upserted ${paymentCount} Payment Terms and ${freightCount} Freight Terms for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-payment-freight] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
