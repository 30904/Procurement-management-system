/**
 * Seed Standard Specification (inspection/test parameter) master rows.
 * Usage: npm run seed:standard-specifications
 * Prerequisite: npm run seed:standard-spec-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { DEFAULT_STANDARD_SPECIFICATION_SAMPLES } from "../src/config/standardSpecificationSamples.js";
import { STANDARD_SPEC_AUTO_MODULE } from "../src/config/standardSpecification.js";
import { Company } from "../src/models/Company.model.js";
import { StandardSpecification } from "../src/models/StandardSpecification.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const SAMPLE_SPECS = DEFAULT_STANDARD_SPECIFICATION_SAMPLES;

async function syncAutoIncrement(companyId, count) {
  if (count <= 0) return;
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: STANDARD_SPEC_AUTO_MODULE, locationId: null },
    { $set: { autoIncrementValue: count } },
    { upsert: true }
  );
}

async function nextSpecId(companyId) {
  const latest = await StandardSpecification.findOne({ company: companyId })
    .sort({ specId: -1 })
    .select("specId")
    .lean();
  const match = String(latest?.specId ?? "").match(/(\d+)\s*$/);
  const fromDb = match ? Number(match[1]) : 0;
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: STANDARD_SPEC_AUTO_MODULE, locationId: null },
    { $set: { autoIncrementValue: Math.max(fromDb, 0) } },
    { upsert: true }
  );
  const updated = await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: STANDARD_SPEC_AUTO_MODULE, locationId: null },
    { $inc: { autoIncrementValue: 1 } },
    { new: true }
  );
  const n = Number(updated?.autoIncrementValue || fromDb + 1);
  return `SPC/${String(n).padStart(4, "0")}`;
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-standard-specifications] No company found");
    process.exitCode = 1;
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const row of SAMPLE_SPECS) {
    const inspectionParameter = String(row.inspectionParameter).trim();
    const existing = await StandardSpecification.findOne({
      company: company._id,
      inspectionParameter,
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const specId = await nextSpecId(company._id);
    await StandardSpecification.create({
      company: company._id,
      specId,
      inspectionParameter,
      uom: row.uom,
      testStandard: row.testStandard || "",
      testMethod: row.testMethod,
      status: "Active",
      revNumber: 0,
      revisionHistory: [],
    });
    created += 1;
  }

  const total = await StandardSpecification.countDocuments({ company: company._id });
  const maxSpec = await StandardSpecification.findOne({ company: company._id })
    .sort({ specId: -1 })
    .select("specId")
    .lean();
  const maxMatch = String(maxSpec?.specId ?? "").match(/(\d+)\s*$/);
  if (maxMatch) {
    await syncAutoIncrement(company._id, Number(maxMatch[1]));
  }

  console.log(
    `[seed-standard-specifications] ${company.companyName}: created ${created}, skipped ${skipped} (already exist). Total SPC rows: ${total}. Samples defined: ${SAMPLE_SPECS.length}.`
  );
}

main()
  .catch((err) => {
    console.error("[seed-standard-specifications] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
