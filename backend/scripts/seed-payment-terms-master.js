/**
 * Seed Payment Terms Master (PTS0001–PTS0007).
 * Usage: npm run seed:payment-terms-master
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { PaymentTermsMaster } from "../src/models/PaymentTermsMaster.model.js";

const SAMPLES = [
  { paymentTermsCode: "PTS0001", displayOrder: 1, description: "30 Days", status: "Active" },
  { paymentTermsCode: "PTS0002", displayOrder: 2, description: "45 Days", status: "Active" },
  { paymentTermsCode: "PTS0003", displayOrder: 3, description: "60 Days", status: "Active" },
  { paymentTermsCode: "PTS0004", displayOrder: 4, description: "90 Days", status: "Active" },
  { paymentTermsCode: "PTS0005", displayOrder: 5, description: "100% Advance", status: "Active" },
  {
    paymentTermsCode: "PTS0006",
    displayOrder: 6,
    description: "60 Days Credit On Invoice Date",
    status: "Active",
  },
  {
    paymentTermsCode: "PTS0007",
    displayOrder: 7,
    description: "DAA at 120 Days from BL Date",
    status: "Active",
  },
];

async function main() {
  await connectDatabase();
  const company =
    (await Company.findOne({ isActive: true }).sort({ createdAt: 1 })) ||
    (await Company.findOne().sort({ createdAt: 1 }));

  if (!company) {
    console.error("[seed-payment-terms-master] No company found. Run seed:framework first.");
    process.exitCode = 1;
    return;
  }

  const companyId = company._id;
  let created = 0;
  let updated = 0;

  for (const row of SAMPLES) {
    const result = await PaymentTermsMaster.findOneAndUpdate(
      { company: companyId, paymentTermsCode: row.paymentTermsCode },
      {
        $set: {
          company: companyId,
          paymentTermsCode: row.paymentTermsCode,
          displayOrder: row.displayOrder,
          description: row.description,
          status: row.status,
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) created += 1;
    else updated += 1;
  }

  console.log(
    `[seed-payment-terms-master] Company: ${company.companyName} — created: ${created}, updated: ${updated}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-payment-terms-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
