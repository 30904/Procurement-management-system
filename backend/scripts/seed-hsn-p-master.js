/**
 * Seed HSN/P Master records for the demo company (matches HSN/P Summary listing).
 * Usage: npm run seed:hsn-p-master
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { HsnPMaster } from "../src/models/HsnPMaster.model.js";

const SAMPLES = [
  {
    hsnCode: "85340001",
    description: "Printed Circuit Board (PCB)",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "7208",
    description: "Mild Steel Sheets",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "998314",
    description: "IT Consulting Services",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "847130",
    description: "laptop computers",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "39201099",
    description: "10 MM Bubble sheet white",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "40151100",
    description: "Surgical gloves",
    gstRate: 12,
    igstRate: 12,
    sgstRate: 6,
    cgstRate: 6,
    utgstRate: 6,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "73269099",
    description: "ESD PCB Storage Trolley",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    hsnCode: "39235090",
    description: "liquid dispenser",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
];

async function main() {
  await connectDatabase();
  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) {
    console.error("[seed-hsn-p-master] No active company found");
    process.exitCode = 1;
    return;
  }

  const seededCodes = SAMPLES.map((r) => r.hsnCode);
  let upserted = 0;
  for (const row of SAMPLES) {
    await HsnPMaster.findOneAndUpdate(
      { company: company._id, hsnCode: row.hsnCode },
      { $set: { company: company._id, ...row } },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed = await HsnPMaster.deleteMany({
    company: company._id,
    hsnCode: { $nin: seededCodes },
  });

  const total = await HsnPMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-hsn-p-master] Upserted ${upserted} records, removed ${removed.deletedCount} orphan(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-hsn-p-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
