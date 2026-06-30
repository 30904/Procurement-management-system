/**
 * Seed SAC/P Master records for the demo company (matches SAC/P Summary screenshot).
 * Usage: npm run seed:sac-p-master
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { SacPMaster } from "../src/models/SacPMaster.model.js";

const SAMPLES = [
  {
    sacCode: "998311",
    description: "Management Consulting & Co.",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "998313",
    description: "Information Technology Consulting",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "998540",
    description: "Material handling charges",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "631010",
    description: "Cleaning Agent",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "741521",
    description: "Copper Waher",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "841990",
    description: "Distilled Water 5 litr can",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "3820000",
    description: "Coolant 1 ltr can",
    gstRate: 18,
    igstRate: 18,
    sgstRate: 9,
    cgstRate: 9,
    utgstRate: 9,
    revNumber: 0,
    status: "Active",
  },
  {
    sacCode: "842129",
    description: "Fuel Filter Assembly (Water...",
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
    console.error("[seed-sac-p-master] No active company found");
    process.exitCode = 1;
    return;
  }

  const seededCodes = SAMPLES.map((r) => r.sacCode);

  let upserted = 0;
  for (const row of SAMPLES) {
    await SacPMaster.findOneAndUpdate(
      { company: company._id, sacCode: row.sacCode },
      { $set: { company: company._id, ...row } },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed = await SacPMaster.deleteMany({
    company: company._id,
    sacCode: { $nin: seededCodes },
  });

  const total = await SacPMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-sac-p-master] Upserted ${upserted} records, removed ${removed.deletedCount} orphan(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-sac-p-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());

