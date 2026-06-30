import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { AssetMaster } from "../src/models/AssetMaster.model.js";
import { HsnPMaster } from "../src/models/HsnPMaster.model.js";
import { SupplierMaster } from "../src/models/SupplierMaster.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const ASSETS = [
  {
    assetNo: "MCH/0001",
    assetCategory: "MCH",
    assetName: "PCB LOADER",
    assetDescription: "NTE0700LL",
    uom: "NOS",
    assetLocation: "Factory",
    subLocation: "SMT Line 1",
    assetUniqueId: "2006-0496A01",
    lifeExpectancyYears: 10,
    manufacturerName: "NUTEK",
    mpnModelNo: "NTE0700LL",
    purchaseRateExGst: 850000,
    manufacturingYear: 2006,
    ratedPowerKw: 2.5,
    status: "Active",
  },
  {
    assetNo: "MCH/0002",
    assetCategory: "MCH",
    assetName: "SOLDER PASTE PRINTER",
    assetDescription: "DEK Horizon",
    uom: "NOS",
    assetLocation: "Factory",
    subLocation: "SMT Line 1",
    assetUniqueId: "1308-16477",
    lifeExpectancyYears: 8,
    manufacturerName: "DEK",
    mpnModelNo: "Horizon 03iX",
    purchaseRateExGst: 1200000,
    manufacturingYear: 2013,
    ratedPowerKw: 4,
    status: "Active",
  },
  {
    assetNo: "MCH/0003",
    assetCategory: "MCH",
    assetName: "CHIP SHOOTER",
    assetDescription: "SIPLACE 80S20 FS02",
    uom: "NOS",
    assetLocation: "Factory",
    subLocation: "SMT Line 2",
    assetUniqueId: "2011-8821B",
    lifeExpectancyYears: 12,
    manufacturerName: "ASM",
    mpnModelNo: "SIPLACE 80S20",
    purchaseRateExGst: 4500000,
    manufacturingYear: 2011,
    ratedPowerKw: 15,
    status: "Active",
  },
  {
    assetNo: "ASTIT/0012",
    assetCategory: "ASTIT",
    assetName: "Industrial Laptop",
    assetDescription: "Engineering team laptop",
    uom: "NOS",
    assetLocation: "Corporate Office",
    subLocation: "Stores",
    assetUniqueId: "IT-2024-0012",
    lifeExpectancyYears: 5,
    purchaseRateExGst: 75000,
    status: "Active",
  },
  {
    assetNo: "ASTVH/0003",
    assetCategory: "ASTVH",
    assetName: "Delivery Van",
    assetDescription: "Company delivery vehicle",
    uom: "NOS",
    assetLocation: "Warehouse A",
    assetUniqueId: "VH-2019-003",
    lifeExpectancyYears: 7,
    purchaseRateExGst: 650000,
    status: "Inactive",
  },
];

async function syncCounter(companyId, module) {
  const rows = await AssetMaster.find({ company: companyId, assetCategory: module }).select("assetNo").lean();
  let max = 0;
  for (const row of rows) {
    const m = String(row.assetNo ?? "").match(/\/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module },
    { $set: { autoIncrementValue: max } },
    { new: true }
  );
}

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
  const actorId = actor?._id ?? null;
  const hsnRows = await HsnPMaster.find({ company: company._id }).sort({ hsnCode: 1 }).select("hsnCode gstRate").lean();
  if (!hsnRows.length) throw new Error("HSN/P records required before seeding Asset Master");
  const supplier = await SupplierMaster.findOne({ company: company._id }).sort({ supplierCode: 1 }).lean();

  const baseDate = new Date("2024-01-15");
  const capDate = new Date("2024-02-01");
  const opDate = new Date("2024-02-15");

  for (let i = 0; i < ASSETS.length; i += 1) {
    const hsn = hsnRows[i % hsnRows.length];
    const row = ASSETS[i];
    await AssetMaster.findOneAndUpdate(
      { company: company._id, assetNo: row.assetNo },
      {
        $set: {
          company: company._id,
          createdBy: actorId,
          updatedBy: actorId,
          assetNo: row.assetNo,
          assetCategory: row.assetCategory,
          assetName: row.assetName,
          assetDescription: row.assetDescription,
          uom: row.uom,
          hsnCode: hsn.hsnCode,
          gstRate: Number(hsn.gstRate ?? 0),
          lifeExpectancyYears: row.lifeExpectancyYears,
          supplierId: supplier?._id,
          supplierCode: supplier?.supplierCode || "",
          supplierName: supplier?.supplierName || "",
          manufacturerName: row.manufacturerName || "",
          mpnModelNo: row.mpnModelNo || "",
          purchaseRateExGst: row.purchaseRateExGst ?? 0,
          assetUniqueId: row.assetUniqueId || "",
          acquisitionDate: baseDate,
          capitalisationDate: capDate,
          inOperationDate: opDate,
          manufacturingYear: row.manufacturingYear,
          ratedPowerKw: row.ratedPowerKw,
          assetLocation: row.assetLocation,
          subLocation: row.subLocation || "",
          status: row.status,
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
  }

  for (const module of ["MCH", "ASTCG", "ASTFR", "ASTIT", "ASTVH"]) {
    await syncCounter(company._id, module);
  }
  console.log(`[seed-asset-master] Upserted ${ASSETS.length} assets`);
}

main()
  .catch((err) => {
    console.error("[seed-asset-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
