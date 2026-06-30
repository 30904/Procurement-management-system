/**
 * Seed sample Prospect Supplier records.
 * Usage: npm run seed:prospect-supplier
 * Prerequisite: npm run seed:prospect-supplier-auto-increment && seed:supplier-category && seed:payment-freight
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { ProspectSupplierMaster } from "../src/models/ProspectSupplierMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

function addr({ line1, line2 = "", line3 = "", line4 = "", country, state, city, pinCode }) {
  return {
    line1,
    line2,
    line3,
    line4,
    state,
    city,
    district: city,
    pinCode,
    country,
    zone: "",
  };
}

const SAMPLES = [
  {
    registrationNo: "VRN/0001",
    registrationDate: new Date("2025-11-12"),
    categoryType: "DGM",
    supplierName: "Global Tech Components Pvt Ltd",
    gstClassification: "B2B Regular",
    gstin: "27AAAAA0000A1Z5",
    supplierPaymentTerms: "Net 30 Days",
    isSupplierActive: "A",
    assessmentStatus: "Pending",
    supplierBillingAddress: [
      addr({
        line1: "Unit 4, Tech Park Phase II",
        line2: "Hinjawadi",
        line3: "Pune",
        country: "India",
        state: "Maharashtra",
        city: "Pune",
        pinCode: "411057",
      }),
    ],
    supplierContactMatrix: [
      {
        name: "Ravi Sharma",
        department: "Procurement",
        email: "ravi.sharma@globaltech.example",
        mobile: "9876543210",
        designation: "Purchase Manager",
      },
    ],
  },
  {
    registrationNo: "VRN/0002",
    registrationDate: new Date("2026-01-08"),
    categoryType: "DGT",
    supplierName: "Northern Industrial Supplies Ltd",
    gstClassification: "B2B Regular",
    gstin: "07BBBBB1111B2Z6",
    supplierPaymentTerms: "Net 45 Days",
    isSupplierActive: "A",
    assessmentStatus: "In Review",
    assessmentNotes: "Awaiting GST verification documents.",
    assessedBy: "QA Team",
    assessedAt: new Date("2026-02-01"),
    supplierBillingAddress: [
      addr({
        line1: "22 Industrial Estate Road",
        line2: "Okhla Phase I",
        line3: "New Delhi",
        country: "India",
        state: "Delhi",
        city: "New Delhi",
        pinCode: "110020",
      }),
    ],
    supplierContactMatrix: [],
  },
  {
    registrationNo: "VRN/0003",
    registrationDate: new Date("2026-03-18"),
    categoryType: "IGM",
    supplierName: "EuroParts Trading GmbH (India Liaison)",
    gstClassification: "B2B Regular",
    gstin: "29CCCCC2222C3Z7",
    supplierPaymentTerms: "Advance 50%",
    isSupplierActive: "A",
    assessmentStatus: "Approved",
    assessmentNotes: "Import category validated; ready for conversion.",
    assessedBy: "Purchase Head",
    assessedAt: new Date("2026-04-10"),
    supplierBillingAddress: [
      addr({
        line1: "Level 8, Brigade Gateway",
        line2: "Malleswaram West",
        line3: "Bengaluru",
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
        pinCode: "560055",
      }),
    ],
    supplierContactMatrix: [
      {
        name: "Elena Fischer",
        department: "Sales",
        email: "elena@europarts.example",
        mobile: "9988776655",
        designation: "Account Manager",
      },
    ],
  },
  {
    registrationNo: "VRN/0004",
    registrationDate: new Date("2026-04-22"),
    categoryType: "DSP",
    supplierName: "Swift Maintenance Services",
    gstClassification: "B2B Regular",
    gstin: "24DDDDD3333D4Z8",
    supplierPaymentTerms: "Net 15 Days",
    isSupplierActive: "A",
    assessmentStatus: "Pending",
    supplierBillingAddress: [
      addr({
        line1: "Plot 9, GIDC Estate",
        line2: "Vatva",
        line3: "Ahmedabad",
        country: "India",
        state: "Gujarat",
        city: "Ahmedabad",
        pinCode: "382445",
      }),
    ],
    supplierContactMatrix: [],
  },
  {
    registrationNo: "VRN/0005",
    registrationDate: new Date("2026-05-20"),
    categoryType: "",
    supplierName: "Coastal Packaging Solutions",
    gstClassification: "B2B Regular",
    gstin: "33EEEEE4444E5Z9",
    supplierPaymentTerms: "Net 30 Days",
    isSupplierActive: "A",
    assessmentStatus: "Rejected",
    assessmentNotes: "Incomplete address proof — re-apply after documents received.",
    assessedBy: "Compliance",
    assessedAt: new Date("2026-05-25"),
    supplierBillingAddress: [
      addr({
        line1: "45 Harbour Road",
        line2: "Port Area",
        line3: "Chennai",
        country: "India",
        state: "Tamil Nadu",
        city: "Chennai",
        pinCode: "600001",
      }),
    ],
    supplierContactMatrix: [],
  },
];

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));

  const seededNos = SAMPLES.map((r) => r.registrationNo);
  let upserted = 0;

  for (const row of SAMPLES) {
    await ProspectSupplierMaster.findOneAndUpdate(
      { company: company._id, registrationNo: row.registrationNo },
      {
        $set: {
          company: company._id,
          createdBy: actor?._id,
          updatedBy: actor?._id,
          ...row,
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed = await ProspectSupplierMaster.deleteMany({
    company: company._id,
    registrationNo: { $nin: seededNos },
  });

  await AutoIncrement.findOneAndUpdate(
    { company: company._id, module: "VRN" },
    {
      $set: {
        company: company._id,
        moduleName: "Prospect Supplier Registration",
        module: "VRN",
        modulePrefix: "VRN",
        autoIncrementValue: 5,
        digit: 4,
      },
    },
    { upsert: true }
  );

  const total = await ProspectSupplierMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-prospect-supplier] Upserted ${upserted}, removed ${removed.deletedCount} other(s), total ${total} for ${company.companyName}`
  );
}

main()
  .catch((err) => {
    console.error("[seed-prospect-supplier] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
