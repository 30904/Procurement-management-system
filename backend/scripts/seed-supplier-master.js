/**
 * Seed sample Supplier Master records (billing + optional shipping addresses)
 * and sync Auto Increment counters from assigned supplier codes.
 *
 * Usage: npm run seed:supplier-master
 * Prerequisite: npm run seed:supplier-category && npm run seed:supplier-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { SupplierMaster } from "../src/models/SupplierMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const MODULE_LABELS = {
  DGM: "Domestic Goods Manufacturer",
  DGT: "Domestic Goods Trader",
  DSP: "Domestic Service Provider",
  DTP: "Domestic Tool Provider",
  IGM: "Imports Goods Manufacturer",
  IGT: "Imports Goods Trader",
};

function addr({
  line1,
  line2 = "",
  line3 = "",
  line4 = "",
  country,
  state,
  city,
  pinCode,
  zone = "",
}) {
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
    zone,
  };
}

const SAMPLES = [
  {
    supplierCode: "DGM/0033",
    supplierName: "Precision Components Pvt Ltd",
    categoryType: "Domestic Goods Manufacturer",
    supplierPurchaseType: "Domestic Goods Manufacturer",
    supplierNickName: "Precision Components",
    gstClassification: "B2B Regular",
    gstin: "27AABCP1234A1Z5",
    supplierCIN: "AABCP1234A",
    supplierMSMENo: "Small",
    supplierCurrency: "INR",
    supplierPaymentTerms: "Net 30 Days",
    supplierINCOTerms: "EXW – Ex-Warehouse",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierType: "Manufacturer",
    supplierBillingAddress: [
      addr({
        line1: "Plot 12, MIDC Industrial Area",
        line2: "Bhosari",
        line3: "Pune",
        country: "India",
        state: "Maharashtra",
        city: "Pune",
        pinCode: "411026",
      }),
    ],
    supplierShippingAddress: [],
  },
  {
    supplierCode: "DGT/0091",
    supplierName: "Metro Trading Corporation",
    categoryType: "Domestic Goods Trader",
    supplierPurchaseType: "Domestic Goods Trader",
    supplierNickName: "Metro Trading",
    gstClassification: "B2B Regular",
    gstin: "29AABCM5678B2Z3",
    supplierCIN: "AABCM5678B",
    supplierMSMENo: "Medium",
    supplierCurrency: "INR",
    supplierPaymentTerms: "Net 45 Days",
    supplierINCOTerms: "FCA – Free Carrier",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierType: "Trader",
    supplierBillingAddress: [
      addr({
        line1: "45 Commercial Street",
        line2: "Shivaji Nagar",
        line3: "Bengaluru",
        country: "India",
        state: "Karnataka",
        city: "Bengaluru",
        pinCode: "560001",
      }),
    ],
    supplierShippingAddress: [],
  },
  {
    supplierCode: "IGM/0001",
    supplierName: "Global Industrial Supplies Ltd",
    categoryType: "Imports Goods Manufacturer",
    supplierPurchaseType: "Imports Goods Manufacturer",
    supplierNickName: "Global Industrial",
    gstClassification: "B2B Regular",
    gstin: "24AABCG9012C1Z8",
    supplierCIN: "AABCG9012C",
    supplierMSMENo: "Not Applicable",
    supplierCurrency: "USD",
    supplierPaymentTerms: "100% Advance",
    supplierINCOTerms: "CIF – Cost, Insurance & Freight",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierType: "Manufacturer",
    supplierBillingAddress: [
      addr({
        line1: "88 Harbor View Road",
        line2: "Docklands",
        line3: "Mumbai",
        country: "India",
        state: "Maharashtra",
        city: "Mumbai",
        pinCode: "400001",
      }),
    ],
    supplierShippingAddress: [
      addr({
        line1: "JNPT Warehouse Block C",
        line2: "Nhava Sheva",
        line3: "Navi Mumbai",
        country: "India",
        state: "Maharashtra",
        city: "Navi Mumbai",
        pinCode: "400707",
      }),
    ],
  },
  {
    supplierCode: "IGT/0002",
    supplierName: "Overseas Parts Import Co",
    categoryType: "Imports Goods Trader",
    supplierPurchaseType: "Imports Goods Trader",
    supplierNickName: "Overseas Parts",
    gstClassification: "B2B Regular",
    gstin: "07AABCO3456D1Z2",
    supplierCIN: "AABCO3456D",
    supplierMSMENo: "Micro",
    supplierCurrency: "USD",
    supplierPaymentTerms: "50% Advance, 50% on Delivery",
    supplierINCOTerms: "FOB – Free on Board",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierType: "Trader",
    supplierBillingAddress: [
      addr({
        line1: "501 Trade Tower",
        line2: "Ring Road",
        line3: "New Delhi",
        country: "India",
        state: "Delhi",
        city: "New Delhi",
        pinCode: "110001",
      }),
    ],
    supplierShippingAddress: [
      addr({
        line1: "ICD Tughlakabad Shed 14",
        line2: "Badarpur",
        line3: "New Delhi",
        country: "India",
        state: "Delhi",
        city: "New Delhi",
        pinCode: "110044",
      }),
      addr({
        line1: "Chennai Port Trust Yard",
        line2: "Royapuram",
        line3: "Chennai",
        country: "India",
        state: "Tamil Nadu",
        city: "Chennai",
        pinCode: "600013",
      }),
    ],
  },
  {
    supplierCode: "DSP/0005",
    supplierName: "TechServe Solutions India",
    categoryType: "Domestic Service Provider",
    supplierPurchaseType: "Domestic Service Provider",
    supplierNickName: "TechServe",
    gstClassification: "B2B Regular",
    gstin: "33AABCT7890E1Z4",
    supplierCIN: "AABCT7890E",
    supplierMSMENo: "Small",
    supplierCurrency: "INR",
    supplierPaymentTerms: "Net 15 Days",
    supplierINCOTerms: "DDP – Delivered Duty Paid",
    isSupplierActive: "A",
    supplierCompanyType: "PVT LTD",
    supplierType: "Services",
    supplierBillingAddress: [
      addr({
        line1: "IT Park Phase 2",
        line2: "Hinjawadi",
        line3: "Pune",
        country: "India",
        state: "Maharashtra",
        city: "Pune",
        pinCode: "411057",
      }),
    ],
    supplierShippingAddress: [
      addr({
        line1: "Client Delivery Center",
        line2: "Magarpatta",
        line3: "Hadapsar",
        country: "India",
        state: "Maharashtra",
        city: "Pune",
        pinCode: "411028",
      }),
    ],
  },
];

function parseSupplierCode(supplierCode) {
  const m = String(supplierCode ?? "").trim().match(/^([A-Za-z]+)\/(\d+)$/);
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10) };
}

async function syncAutoIncrementFromSuppliers(companyId) {
  const suppliers = await SupplierMaster.find({ company: companyId })
    .select("supplierCode")
    .lean();

  const maxByModule = {};
  for (const row of suppliers) {
    const parsed = parseSupplierCode(row.supplierCode);
    if (!parsed || Number.isNaN(parsed.num)) continue;
    maxByModule[parsed.prefix] = Math.max(maxByModule[parsed.prefix] ?? 0, parsed.num);
  }

  let updated = 0;
  for (const [module, maxVal] of Object.entries(maxByModule)) {
    const moduleName = MODULE_LABELS[module] || module;
    await AutoIncrement.findOneAndUpdate(
      { company: companyId, module },
      {
        $set: {
          company: companyId,
          module,
          moduleName,
          modulePrefix: module,
          autoIncrementValue: maxVal,
          digit: 4,
        },
      },
      { upsert: true, new: true }
    );
    updated += 1;
    console.log(`  [auto-increment] ${module} → last assigned ${maxVal} (next preview ${module}/${String(maxVal + 1).padStart(4, "0")})`);
  }
  return updated;
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });

  if (!company) {
    console.error("[seed-supplier-master] No company found");
    process.exitCode = 1;
    return;
  }

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));

  const actorId = actor?._id ?? null;
  const seededCodes = SAMPLES.map((r) => r.supplierCode);

  let upserted = 0;
  for (const row of SAMPLES) {
    await SupplierMaster.findOneAndUpdate(
      { company: company._id, supplierCode: row.supplierCode },
      {
        $set: {
          company: company._id,
          createdBy: actorId,
          updatedBy: actorId,
          supplierContactMatrix: [],
          supplierBankDetails: [],
          supplierAddress: [],
          ...row,
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }

  const removed = await SupplierMaster.deleteMany({
    company: company._id,
    supplierCode: { $nin: seededCodes },
  });

  const total = await SupplierMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-supplier-master] Upserted ${upserted} supplier(s), removed ${removed.deletedCount} other(s), total ${total} for ${company.companyName}`
  );
  console.log("[seed-supplier-master] Syncing auto increment counters…");
  const synced = await syncAutoIncrementFromSuppliers(company._id);
  console.log(`[seed-supplier-master] Updated ${synced} auto-increment module(s).`);
}

main()
  .catch((err) => {
    console.error("[seed-supplier-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
