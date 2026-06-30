/**
 * Seed sample Service Master records and sync SER auto increment
 * from maximum assigned serviceNo.
 *
 * Usage: npm run seed:service-master
 * Prerequisite:
 *   npm run seed:sac-p-master
 *   npm run seed:service-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { SacPMaster } from "../src/models/SacPMaster.model.js";
import { ServiceMaster } from "../src/models/ServiceMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const DESCRIPTIONS = [
  "Annual machine maintenance service",
  "On-site installation support",
  "Plant equipment calibration service",
  "Emergency breakdown service visit",
  "Preventive maintenance contract",
  "Electrical panel inspection service",
  "PLC commissioning support service",
  "Consumables handling service",
];

const FALLBACK_SAC_CODES = [
  "998311",
  "998313",
  "998540",
  "631010",
  "741521",
  "841990",
  "3820000",
  "842129",
];

function parseServiceCode(code) {
  const m = String(code ?? "").trim().match(/^([A-Za-z]+)\/(\d+)$/);
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10) };
}

async function syncServiceAutoIncrement(companyId) {
  const rows = await ServiceMaster.find({ company: companyId }).select("serviceNo").lean();
  let maxVal = 0;

  for (const row of rows) {
    const parsed = parseServiceCode(row.serviceNo);
    if (!parsed || parsed.prefix !== "SER" || Number.isNaN(parsed.num)) continue;
    maxVal = Math.max(maxVal, parsed.num);
  }

  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: "SER" },
    {
      $set: {
        company: companyId,
        module: "SER",
        moduleName: "Service Master",
        modulePrefix: "SER",
        autoIncrementValue: maxVal,
        digit: 4,
      },
    },
    { upsert: true, new: true }
  );

  console.log(
    `  [auto-increment] SER -> last assigned ${maxVal} (next preview SER/${String(maxVal + 1).padStart(4, "0")})`
  );
}

async function resolveSacRows(companyId) {
  const sacRows = await SacPMaster.find({ company: companyId, status: "Active" })
    .sort({ sacCode: 1 })
    .select("sacCode gstRate")
    .lean();

  if (sacRows.length > 0) return sacRows;

  const fallbackRows = await SacPMaster.find({ company: companyId, sacCode: { $in: FALLBACK_SAC_CODES } })
    .sort({ sacCode: 1 })
    .select("sacCode gstRate")
    .lean();

  return fallbackRows;
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-service-master] No company found");
    process.exitCode = 1;
    return;
  }

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));
  const actorId = actor?._id ?? null;

  const sacRows = await resolveSacRows(company._id);
  if (sacRows.length === 0) {
    console.error("[seed-service-master] No SAC/P records found. Seed SAC/P first.");
    process.exitCode = 1;
    return;
  }

  const samples = Array.from({ length: 8 }).map((_, index) => {
    const sac = sacRows[index % sacRows.length];
    const seq = index + 1;
    return {
      serviceNo: `SER/${String(seq).padStart(4, "0")}`,
      serviceDescription: DESCRIPTIONS[index],
      sacCode: sac.sacCode,
      gstRate: Number(sac.gstRate ?? 0),
      status: index === 5 ? "Inactive" : "Active",
    };
  });

  const seededCodes = samples.map((r) => r.serviceNo);

  let upserted = 0;
  for (const row of samples) {
    await ServiceMaster.findOneAndUpdate(
      { company: company._id, serviceNo: row.serviceNo },
      {
        $set: {
          company: company._id,
          createdBy: actorId,
          updatedBy: actorId,
          revNumber: 0,
          revisionHistory: [],
          ...row,
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed = await ServiceMaster.deleteMany({
    company: company._id,
    serviceNo: { $nin: seededCodes },
  });

  const total = await ServiceMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-service-master] Upserted ${upserted} service(s), removed ${removed.deletedCount} other(s), total ${total} for ${company.companyName}`
  );

  console.log("[seed-service-master] Syncing auto increment counter...");
  await syncServiceAutoIncrement(company._id);
  console.log("[seed-service-master] Synced module SER.");
}

main()
  .catch((err) => {
    console.error("[seed-service-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
