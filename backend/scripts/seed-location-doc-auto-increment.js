/**
 * Creates per-location auto-increment rows for PO, GRN, SO, DN, PINV, SINV from existing locations.
 * Does not modify company-wide (locationId null) counters.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { ensureAutoIncrementModule } from "../src/utils/docNumber.js";
import { sanitizeLocationCode } from "../src/utils/docNumber.js";

const MODULES = [
  { module: "PIND", prefix: "PIND" },
  { module: "RFQ", prefix: "RFQ" },
  { module: "PO", prefix: "PO" },
  { module: "GRN", prefix: "GRN" },
  { module: "SO", prefix: "SO" },
  { module: "DN", prefix: "DN" },
  { module: "PINV", prefix: "PINV" },
  { module: "SINV", prefix: "SINV" },
  { module: "ST", prefix: "ST" },
];

async function main() {
  await connectDatabase();
  const companies = await Company.find({ isActive: { $ne: false } }).lean();

  for (const company of companies) {
    const locations = await Location.find({ company: company._id, isActive: { $ne: false } }).lean();
    for (const loc of locations) {
      const locCode = sanitizeLocationCode(loc);
      for (const m of MODULES) {
        await ensureAutoIncrementModule(
          company._id,
          m.module,
          m.module,
          `${locCode}-${m.prefix}`,
          0,
          loc._id
        );
      }
    }
    console.log(`Seeded location doc counters for ${locations.length} locations — ${company.companyName}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
