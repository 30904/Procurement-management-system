import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

const YES_NO = [
  { label: "Yes", value: "Yes", sequence: 1 },
  { label: "No", value: "No", sequence: 2 },
];

const CATEGORY_ENTRIES = [
  {
    category: "Service Category",
    rows: [
      { label: "Repair & Maintenance", value: "RMT", sequence: 1 },
      { label: "Installation", value: "INS", sequence: 2 },
      { label: "Consulting", value: "CON", sequence: 3 },
      { label: "AMC", value: "AMC", sequence: 4 },
    ],
  },
  {
    category: "GST Regime Applicability",
    rows: [
      { label: "Regular", sequence: 1 },
      { label: "Composition", sequence: 2 },
      { label: "Unregistered", sequence: 3 },
    ],
  },
  {
    category: "Taxability Type",
    rows: [
      { label: "Taxable", sequence: 1 },
      { label: "Exempt", sequence: 2 },
      { label: "Nil Rated", sequence: 3 },
    ],
  },
  { category: "ITC Allowed", rows: YES_NO },
  { category: "TDS Applicability", rows: YES_NO },
  {
    category: "TDS Section",
    rows: [
      { label: "194C", sequence: 1 },
      { label: "194J", sequence: 2 },
      { label: "194H", sequence: 3 },
      { label: "194I", sequence: 4 },
    ],
  },
  {
    category: "TDS Rate %",
    rows: [
      { label: "1%", value: "1", sequence: 1 },
      { label: "2%", value: "2", sequence: 2 },
      { label: "10%", value: "10", sequence: 3 },
    ],
  },
  {
    category: "Cost Center",
    rows: [
      { label: "Maintenance", sequence: 1 },
      { label: "Production", sequence: 2 },
      { label: "Administration", sequence: 3 },
      { label: "Quality", sequence: 4 },
    ],
  },
];

async function upsertCategory(companyId, category, rows) {
  for (const row of rows) {
    const label = String(row.label).trim();
    const value = String(row.value ?? label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category, label },
      {
        $set: {
          company: companyId,
          category,
          label,
          value,
          description: row.description ?? "",
          sequence: row.sequence ?? 0,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
  }
}

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  for (const entry of CATEGORY_ENTRIES) {
    await upsertCategory(company._id, entry.category, entry.rows);
    console.log(`[seed-service-r1-master-data] ${entry.category}: ${entry.rows.length} upserted`);
  }

  await upsertCategory(company._id, "RCM Applicability", YES_NO);
  console.log("[seed-service-r1-master-data] RCM Applicability: 2 upserted (Yes/No)");
}

main()
  .catch((err) => {
    console.error("[seed-service-r1-master-data] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
