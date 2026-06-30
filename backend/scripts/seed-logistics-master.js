/**
 * Seed sample Logistics Master records and sync Auto Increment counters
 * from maximum assigned lspCode per prefix.
 *
 * Usage: npm run seed:logistics-master
 * Prerequisite:
 *   npm run seed:logistics-master-data
 *   npm run seed:logistics-auto-increment
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { LogisticsMaster } from "../src/models/LogisticsMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const MODULE_LABELS = {
  LRT: "Road Transporter",
  LRL: "Rail Logistics",
  LAC: "Air Cargo",
  LSF: "Sea Freight",
  LMP: "Multimodal Partner",
};

function addr({ line1, line2 = "", line3 = "", line4 = "", country, state, city, pinCode, zone = "" }) {
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
    lspCode: "LRT/0017",
    categoryType: "Road Transporter",
    lspNameLegalEntity: "Swift Highway Movers Pvt Ltd",
    lspNickName: "Swift Movers",
    gstin: "27AAECS1122L1Z9",
    lspCIN: "AAECS1122L",
    lspCurrency: "INR",
    lspPaymentTerms: "Net 30 Days",
    freightServiceType: "Full Truck Load",
    rcmApplicability: "Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "Plot 91 Transport Nagar", city: "Pune", state: "Maharashtra", country: "India", pinCode: "411037" })],
    lspContactMatrix: [{ name: "Amit Kale", department: "Operations", email: "ops@swiftmovers.in", mobile: "9876543210", designation: "Ops Manager" }],
    lspBankDetails: [{ befName: "Swift Highway Movers Pvt Ltd", bankName: "HDFC Bank", accountNumber: "50200012345678", accountType: "Current", ifsCode: "HDFC0001234", bankSwiftCode: "HDFCINBB" }],
    lspVehicleDetails: [{ vehicleNo: "MH12AB1234" }, { vehicleNo: "MH14CD4488" }],
  },
  {
    lspCode: "LRL/0010",
    categoryType: "Rail Logistics",
    lspNameLegalEntity: "TrackLine Rail Freight LLP",
    lspNickName: "TrackLine",
    gstin: "29AAECT7788P1Z3",
    lspCIN: "AAECT7788P",
    lspCurrency: "INR",
    lspPaymentTerms: "Net 45 Days",
    freightServiceType: "Dedicated Vehicle",
    rcmApplicability: "Not Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "Sector 12 Freight Terminal", city: "Bengaluru", state: "Karnataka", country: "India", pinCode: "560048" })],
    lspContactMatrix: [{ name: "Nidhi Rao", department: "Commercial", email: "commercial@trackline.in", mobile: "9988776655", designation: "Commercial Lead" }],
    lspBankDetails: [{ befName: "TrackLine Rail Freight LLP", bankName: "ICICI Bank", accountNumber: "006401000987", accountType: "Current", ifsCode: "ICIC0000064", bankSwiftCode: "ICICINBB" }],
    lspVehicleDetails: [],
  },
  {
    lspCode: "LAC/0005",
    categoryType: "Air Cargo",
    lspNameLegalEntity: "SkyWing Cargo Services",
    lspNickName: "SkyWing",
    gstin: "07AAECS3344J1Z7",
    lspCIN: "AAECS3344J",
    lspCurrency: "USD",
    lspPaymentTerms: "100% Advance",
    freightServiceType: "Express",
    rcmApplicability: "Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "Cargo Complex, Terminal 3", city: "New Delhi", state: "Delhi", country: "India", pinCode: "110037" })],
    lspContactMatrix: [],
    lspBankDetails: [],
    lspVehicleDetails: [{ vehicleNo: "DL01EF2200" }],
  },
  {
    lspCode: "LSF/0013",
    categoryType: "Sea Freight",
    lspNameLegalEntity: "BlueWave Maritime Logistics Ltd",
    lspNickName: "BlueWave",
    gstin: "24AAECB5566D1Z6",
    lspCIN: "AAECB5566D",
    lspCurrency: "USD",
    lspPaymentTerms: "50% Advance, 50% on Delivery",
    freightServiceType: "Over Dimensional Cargo",
    rcmApplicability: "Not Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "Dock 4 Port Road", city: "Mundra", state: "Gujarat", country: "India", pinCode: "370421" })],
    lspContactMatrix: [{ name: "Rahul Dholakia", department: "Port Ops", email: "port.ops@bluewave.in", mobile: "9898989898", designation: "Terminal Manager" }],
    lspBankDetails: [{ befName: "BlueWave Maritime Logistics Ltd", bankName: "Axis Bank", accountNumber: "919020001122334", accountType: "Current", ifsCode: "UTIB0000919", bankSwiftCode: "AXISINBB" }],
    lspVehicleDetails: [{ vehicleNo: "GJ12GH1199" }],
  },
  {
    lspCode: "LMP/0003",
    categoryType: "Multimodal Partner",
    lspNameLegalEntity: "TransLink Integrated Logistics",
    lspNickName: "TransLink",
    gstin: "33AAECT9911A1Z4",
    lspCIN: "AAECT9911A",
    lspCurrency: "INR",
    lspPaymentTerms: "Net 60 Days",
    freightServiceType: "Part Truck Load",
    rcmApplicability: "Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "SIPCOT Industrial Hub", city: "Chennai", state: "Tamil Nadu", country: "India", pinCode: "600119" })],
    lspContactMatrix: [{ name: "Prerna Iyer", department: "Client Success", email: "client@translink.in", mobile: "9000011111", designation: "Key Account Manager" }],
    lspBankDetails: [{ befName: "TransLink Integrated Logistics", bankName: "SBI", accountNumber: "334455667788", accountType: "Current", ifsCode: "SBIN0000456", bankSwiftCode: "SBININBB" }],
    lspVehicleDetails: [{ vehicleNo: "TN22KL9033" }, { vehicleNo: "TN09MN2211" }],
  },
  {
    lspCode: "LRT/0018",
    categoryType: "Road Transporter",
    lspNameLegalEntity: "CargoRun Line Haul",
    lspNickName: "CargoRun",
    gstin: "19AAECC1123N1Z2",
    lspCIN: "AAECC1123N",
    lspCurrency: "INR",
    lspPaymentTerms: "Against Delivery",
    freightServiceType: "Dedicated Vehicle",
    rcmApplicability: "Applicable",
    isLspActive: "I",
    lspAddress: [addr({ line1: "NH6 Bypass Yard", city: "Kolkata", state: "West Bengal", country: "India", pinCode: "700088" })],
    lspContactMatrix: [{ name: "Sourav Sen", department: "Dispatch", email: "dispatch@cargorun.in", mobile: "9123456780", designation: "Dispatcher" }],
    lspBankDetails: [],
    lspVehicleDetails: [{ vehicleNo: "WB19PQ7788" }],
  },
  {
    lspCode: "LSF/0014",
    categoryType: "Sea Freight",
    lspNameLegalEntity: "HarborGate Shipping Services",
    lspNickName: "HarborGate",
    gstin: "27AAECH7711Q1Z0",
    lspCIN: "AAECH7711Q",
    lspCurrency: "USD",
    lspPaymentTerms: "Net 30 Days",
    freightServiceType: "Express",
    rcmApplicability: "Not Applicable",
    isLspActive: "A",
    lspAddress: [addr({ line1: "Gateway Wharf 2", city: "Mumbai", state: "Maharashtra", country: "India", pinCode: "400001" })],
    lspContactMatrix: [],
    lspBankDetails: [{ befName: "HarborGate Shipping Services", bankName: "Kotak Mahindra Bank", accountNumber: "101010101010", accountType: "Current", ifsCode: "KKBK0000999", bankSwiftCode: "KKBKINBB" }],
    lspVehicleDetails: [],
  },
];

function parseLspCode(code) {
  const m = String(code ?? "").trim().match(/^([A-Za-z]+)\/(\d+)$/);
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10) };
}

async function syncAutoIncrementFromLsp(companyId) {
  const rows = await LogisticsMaster.find({ company: companyId }).select("lspCode").lean();
  const maxByModule = {};

  for (const row of rows) {
    const parsed = parseLspCode(row.lspCode);
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
    console.log(
      `  [auto-increment] ${module} -> last assigned ${maxVal} (next preview ${module}/${String(maxVal + 1).padStart(4, "0")})`
    );
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
    console.error("[seed-logistics-master] No company found");
    process.exitCode = 1;
    return;
  }

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));
  const actorId = actor?._id ?? null;

  const seededCodes = SAMPLES.map((r) => r.lspCode);

  let upserted = 0;
  for (const row of SAMPLES) {
    await LogisticsMaster.findOneAndUpdate(
      { company: company._id, lspCode: row.lspCode },
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

  const removed = await LogisticsMaster.deleteMany({
    company: company._id,
    lspCode: { $nin: seededCodes },
  });

  const total = await LogisticsMaster.countDocuments({ company: company._id });
  console.log(
    `[seed-logistics-master] Upserted ${upserted} logistics row(s), removed ${removed.deletedCount} other row(s), total ${total} for ${company.companyName}`
  );

  console.log("[seed-logistics-master] Syncing auto increment counters...");
  const synced = await syncAutoIncrementFromLsp(company._id);
  console.log(`[seed-logistics-master] Updated ${synced} auto-increment module(s).`);
}

main()
  .catch((err) => {
    console.error("[seed-logistics-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
