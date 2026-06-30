/**
 * Location-wise PO auto-increment for Factory and Pune Plant.
 * autoIncrementValue = 0 → next saved PO preview is prefix/000001.
 *
 * Usage: npm run seed:po-location-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";
import { formatAutoIncrementCode } from "../src/services/autoIncrement.service.js";

/** locationId must match Location.locationId in master */
const PO_BY_LOCATION = [
  {
    locationKey: "Factory",
    moduleName: "PO",
    module: "PO",
    modulePrefix: "FAC/26/27",
    autoIncrementValue: 0,
    digit: 6,
  },
  {
    locationKey: "Pune Plant",
    moduleName: "PO",
    module: "PO",
    modulePrefix: "PP/26/27",
    autoIncrementValue: 0,
    digit: 6,
  },
];

async function ensureLocationScopedIndexes() {
  const coll = AutoIncrement.collection;
  const indexes = await coll.indexes();
  for (const idx of indexes) {
    const keys = idx.key || {};
    const hasCompanyModule = keys.company === 1 && keys.module === 1;
    const hasLocation = keys.locationId === 1;
    if (hasCompanyModule && !hasLocation && idx.name !== "_id_") {
      try {
        await coll.dropIndex(idx.name);
        console.log(`  Dropped legacy index: ${idx.name} (use company+module+locationId instead)`);
      } catch (err) {
        console.warn(`  Could not drop index ${idx.name}:`, err.message);
      }
    }
  }
  await AutoIncrement.syncIndexes();
}

async function upsertPoForLocation(companyId, loc, row) {
  const filter = { company: companyId, module: row.module, locationId: loc._id };
  const payload = {
    company: companyId,
    moduleName: row.moduleName,
    module: row.module,
    modulePrefix: row.modulePrefix,
    autoIncrementValue: row.autoIncrementValue,
    digit: row.digit,
    locationId: loc._id,
  };

  let doc = await AutoIncrement.findOne(filter);
  if (doc) {
    doc.set(payload);
    await doc.save();
    return doc.toObject();
  }

  const legacyCentral = await AutoIncrement.findOne({
    company: companyId,
    module: row.module,
    $or: [{ locationId: null }, { locationId: { $exists: false } }],
  });

  if (legacyCentral && row.locationKey === "Factory") {
    legacyCentral.set(payload);
    await legacyCentral.save();
    return legacyCentral.toObject();
  }

  doc = await AutoIncrement.create(payload);
  return doc.toObject();
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  console.log(`\n[seed-po-location-auto-increment] ${company.companyName}\n`);
  await ensureLocationScopedIndexes();

  for (const row of PO_BY_LOCATION) {
    const loc = await Location.findOne({
      company: company._id,
      locationId: row.locationKey,
      isActive: { $ne: false },
    }).lean();

    if (!loc) {
      console.warn(`  Skip: location "${row.locationKey}" not found (run seed:two-location-demo first)`);
      continue;
    }

    const doc = await upsertPoForLocation(company._id, loc, row);
    const nextCode = formatAutoIncrementCode(
      doc.modulePrefix,
      (Number(doc.autoIncrementValue) || 0) + 1,
      doc.digit
    );
    console.log(`  ${row.locationKey}: last=${doc.autoIncrementValue} → next preview ${nextCode}`);
  }

  console.log("\nDone. Open Settings → Auto Increment, edit PO, switch Factory / Pune Plant to verify.\n");
}

main()
  .catch((err) => {
    console.error("[seed-po-location-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
