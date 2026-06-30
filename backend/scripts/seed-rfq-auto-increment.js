/**
 * Company-wide RFQ auto-increment (Settings → Auto Increment).
 * Location-scoped counters: npm run seed:location-doc-auto-increment
 *
 * Usage: npm run seed:rfq-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";
import { formatAutoIncrementCode } from "../src/services/autoIncrement.service.js";

const RFQ_ROW = {
  moduleName: "Request for Quotation",
  module: "RFQ",
  modulePrefix: "RFQ",
  autoIncrementValue: 0,
  digit: 6,
};

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-rfq-auto-increment] No company found");
    process.exitCode = 1;
    return;
  }

  const doc = await AutoIncrement.findOneAndUpdate(
    { company: company._id, module: RFQ_ROW.module, locationId: null },
    { $set: { company: company._id, ...RFQ_ROW, locationId: null } },
    { upsert: true, new: true }
  );

  const nextCode = formatAutoIncrementCode(
    doc.modulePrefix,
    (Number(doc.autoIncrementValue) || 0) + 1,
    doc.digit
  );

  console.log(
    `[seed-rfq-auto-increment] ${company.companyName}: RFQ last=${doc.autoIncrementValue} → next preview ${nextCode}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-rfq-auto-increment] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
