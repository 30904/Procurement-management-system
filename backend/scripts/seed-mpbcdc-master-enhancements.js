/**
 * Backfill MPBCDC optional fields on existing masters and seed Source List + Vendor Evaluation.
 *
 * Usage: npm run seed:mpbcdc-masters
 * Prerequisite: existing master seeds (item, supplier, service-r1, etc.)
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { ServiceMasterR1 } from "../src/models/ServiceMasterR1.model.js";
import { SupplierMaster } from "../src/models/SupplierMaster.model.js";
import { AssetMaster } from "../src/models/AssetMaster.model.js";
import { LogisticsMaster } from "../src/models/LogisticsMaster.model.js";
import { PaymentTermsMaster } from "../src/models/PaymentTermsMaster.model.js";
import { HsnPMaster } from "../src/models/HsnPMaster.model.js";
import { SacPMaster } from "../src/models/SacPMaster.model.js";
import { SourceListMaster } from "../src/models/SourceListMaster.model.js";
import { VendorEvaluationMaster } from "../src/models/VendorEvaluationMaster.model.js";

function pick(list, index) {
  return list[index % list.length];
}

function isBlank(val) {
  return val === undefined || val === null || String(val).trim() === "";
}

function nestedEmpty(obj, keys) {
  if (!obj || typeof obj !== "object") return true;
  return keys.every((k) => {
    const v = obj[k];
    if (v instanceof Date) return false;
    if (typeof v === "number") return v === 0;
    return isBlank(v);
  });
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function resolveCompany() {
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  return companyCode
    ? Company.findOne({ companyCode })
    : Company.findOne({ isActive: true }).sort({ createdAt: 1 });
}

async function resolveActor(companyId) {
  return (
    (await User.findOne({ company: companyId, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }))
  );
}

async function backfillItems(companyId) {
  const rows = await ItemMaster.find({ company: companyId }).sort({ itemNo: 1 });
  let updated = 0;
  const materialTypes = ["Consumable", "Capital Good", "Asset Linked"];
  const procCategories = ["Direct Purchase", "Tender", "GeM", "Rate Contract"];
  const stockTypes = ["Stock Item", "Non Stock Item"];
  const yesNo = ["Yes", "No"];
  const approvalStatuses = ["Draft", "Pending Approval", "Approved", "Approved", "Blocked"];

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    const patch = {};
    if (nestedEmpty(doc.procurementInfo, ["materialType", "procurementCategory", "stockType", "gemApplicable"])) {
      patch.procurementInfo = {
        materialType: pick(materialTypes, i),
        procurementCategory: pick(procCategories, i),
        stockType: pick(stockTypes, i),
        gemApplicable: pick(yesNo, i),
      };
    }
    if (nestedEmpty(doc.governance, ["approvalStatus", "approvedBy", "approvalDate", "remarks"])) {
      const approved = pick(approvalStatuses, i);
      patch.governance = {
        approvalStatus: approved,
        approvedBy: approved === "Approved" ? "MPBCDC Procurement Officer" : "",
        approvalDate: approved === "Approved" ? addMonths(new Date(), -2) : null,
        remarks: approved === "Blocked" ? "Pending document verification" : "",
      };
    }
    if (Object.keys(patch).length) {
      await ItemMaster.updateOne({ _id: doc._id }, { $set: patch });
      updated += 1;
    }
  }
  return updated;
}

async function backfillServices(companyId) {
  const rows = await ServiceMasterR1.find({ company: companyId }).sort({ serviceId: 1 });
  let updated = 0;
  const serviceTypes = ["Recurring", "One Time"];
  const approvalStatuses = ["Draft", "Approved", "Approved", "Blocked"];

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.mpbcdcService, ["serviceType", "gemApplicable", "approvalStatus"])) continue;
    await ServiceMasterR1.updateOne(
      { _id: doc._id },
      {
        $set: {
          mpbcdcService: {
            serviceType: pick(serviceTypes, i),
            gemApplicable: i % 2 === 0 ? "Yes" : "No",
            approvalStatus: pick(approvalStatuses, i),
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function backfillSuppliers(companyId) {
  const rows = await SupplierMaster.find({ company: companyId }).sort({ supplierCode: 1 });
  let updated = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    const patch = {};
    if (nestedEmpty(doc.govProcurement, ["vendorType", "gemRegistered", "vendorClassification"])) {
      patch.govProcurement = {
        vendorType: pick(["Material Vendor", "Service Vendor", "Contractor", "Consultant"], i),
        gemRegistered: i % 3 === 0 ? "Yes" : "No",
        gemRegistrationNumber: i % 3 === 0 ? `GEM-MPB-${1000 + i}` : "",
        vendorRegistrationDate: addMonths(new Date(), -(12 + i)),
        vendorClassification: pick(["Local", "National", "International"], i),
        womenOwnedEnterprise: i % 4 === 0 ? "Yes" : "No",
        startupRegistered: i % 5 === 0 ? "Yes" : "No",
      };
    }
    if (nestedEmpty(doc.vendorCompliance, ["panVerified", "gstVerified", "bankVerified"])) {
      patch.vendorCompliance = {
        panVerified: "Yes",
        gstVerified: "Yes",
        bankVerified: i % 2 === 0 ? "Yes" : "No",
        complianceStatus: "Draft",
        lastComplianceReview: addMonths(new Date(), -3),
        reviewDueDate: addMonths(new Date(), 9),
        approvedBy: i % 2 === 0 ? "Compliance Team" : "",
        approvalDate: i % 2 === 0 ? addMonths(new Date(), -1) : null,
      };
    }
    if (Object.keys(patch).length) {
      await SupplierMaster.updateOne({ _id: doc._id }, { $set: patch });
      updated += 1;
    }
  }
  return updated;
}

async function backfillAssets(companyId) {
  const rows = await AssetMaster.find({ company: companyId }).sort({ assetNo: 1 });
  let updated = 0;
  const classifications = ["IT Asset", "Machinery", "Vehicle", "Furniture", "Infrastructure"];
  const modes = ["Tender", "GeM", "Direct"];
  const lifecycle = ["Active", "Under Procurement", "Retired"];

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.procurementTracking, ["assetClassification", "procurementMode", "assetLifecycleStatus"])) {
      continue;
    }
    await AssetMaster.updateOne(
      { _id: doc._id },
      {
        $set: {
          procurementTracking: {
            assetClassification: pick(classifications, i),
            procurementMode: pick(modes, i),
            purchaseReference: `PR/2025/${String(i + 1).padStart(4, "0")}`,
            poReference: doc.status === "Active" ? `PO/2025/${String(i + 1).padStart(4, "0")}` : "",
            assetLifecycleStatus: pick(lifecycle, i),
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function backfillLogistics(companyId) {
  const rows = await LogisticsMaster.find({ company: companyId }).sort({ lspCode: 1 });
  let updated = 0;
  const transportMap = {
    "Road Transporter": "Road",
    "Rail Logistics": "Rail",
    "Air Cargo": "Air",
    "Sea Freight": "Sea",
    "Multimodal Partner": "Road",
  };

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.mpbcdcLogistics, ["transportCategory", "serviceCoverage", "gemRegistered"])) continue;
    const category = String(doc.categoryType || "");
    await LogisticsMaster.updateOne(
      { _id: doc._id },
      {
        $set: {
          mpbcdcLogistics: {
            transportCategory: transportMap[category] || pick(["Road", "Rail", "Air", "Sea"], i),
            serviceCoverage: pick(["Local", "State", "National"], i),
            gemRegistered: i % 3 === 0 ? "Yes" : "No",
            approvalStatus: pick(["Draft", "Approved", "Approved", "Blocked"], i),
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function backfillPaymentTerms(companyId) {
  const rows = await PaymentTermsMaster.find({ company: companyId }).sort({ displayOrder: 1 });
  let updated = 0;
  const today = new Date();

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.mpbcdcPaymentTerms, ["approvalStatus", "governmentApproved"])) continue;
    await PaymentTermsMaster.updateOne(
      { _id: doc._id },
      {
        $set: {
          mpbcdcPaymentTerms: {
            approvalStatus: i === 0 ? "Draft" : "Approved",
            activeFrom: addMonths(today, -12),
            activeTo: addMonths(today, 24),
            governmentApproved: i % 2 === 0 ? "Yes" : "No",
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function backfillHsn(companyId) {
  const rows = await HsnPMaster.find({ company: companyId }).sort({ hsnCode: 1 });
  let updated = 0;
  const procTypes = ["Direct Purchase", "Tender", "GeM", "Rate Contract"];

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.mpbcdcTax, ["governmentCategory", "applicableCategory"])) continue;
    await HsnPMaster.updateOne(
      { _id: doc._id },
      {
        $set: {
          mpbcdcTax: {
            governmentCategory: pick(["Goods", "Capital Goods", "Consumables"], i),
            applicableCategory: pick(procTypes, i),
            activeFrom: addMonths(new Date(), -24),
            activeTo: addMonths(new Date(), 60),
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function backfillSac(companyId) {
  const rows = await SacPMaster.find({ company: companyId }).sort({ sacCode: 1 });
  let updated = 0;
  const serviceCats = ["Maintenance", "Professional", "Manpower", "Transport", "IT", "Consultancy"];

  for (let i = 0; i < rows.length; i += 1) {
    const doc = rows[i];
    if (!nestedEmpty(doc.mpbcdcTax, ["governmentCategory", "applicableCategory"])) continue;
    await SacPMaster.updateOne(
      { _id: doc._id },
      {
        $set: {
          mpbcdcTax: {
            governmentCategory: pick(["Services", "Professional Services", "Works Contract"], i),
            applicableCategory: pick(serviceCats, i),
            activeFrom: addMonths(new Date(), -24),
            activeTo: addMonths(new Date(), 60),
          },
        },
      }
    );
    updated += 1;
  }
  return updated;
}

async function seedSourceList(companyId, actorId) {
  const items = await ItemMaster.find({ company: companyId, status: "Active" }).sort({ itemNo: 1 }).limit(4).lean();
  const services = await ServiceMasterR1.find({ company: companyId, status: "Active" }).sort({ serviceId: 1 }).limit(2).lean();
  const suppliers = await SupplierMaster.find({ company: companyId }).sort({ supplierCode: 1 }).limit(6).lean();
  if (!suppliers.length) return { upserted: 0, skipped: "no suppliers" };

  const sourceTypes = ["GeM", "Tender", "Direct", "Rate Contract"];
  const refs = [
    ...items.map((r) => ({
      itemType: "Material",
      itemId: r._id,
      itemCode: r.itemNo,
      itemName: r.itemName,
    })),
    ...services.map((r) => ({
      itemType: "Service",
      itemId: r._id,
      itemCode: r.serviceId,
      itemName: r.serviceName,
    })),
  ];

  if (!refs.length) return { upserted: 0, skipped: "no materials/services" };

  let upserted = 0;
  const validFrom = addMonths(new Date(), -6);
  const validTo = addMonths(new Date(), 18);

  for (let i = 0; i < Math.min(refs.length, 6); i += 1) {
    const ref = refs[i];
    const supplier = suppliers[i % suppliers.length];
    const code = `SL${String(i + 1).padStart(4, "0")}`;
    await SourceListMaster.findOneAndUpdate(
      { company: companyId, sourceListCode: code },
      {
        $set: {
          company: companyId,
          createdBy: actorId,
          updatedBy: actorId,
          sourceListCode: code,
          itemType: ref.itemType,
          itemId: ref.itemId,
          itemCode: ref.itemCode,
          itemName: ref.itemName,
          supplierId: supplier._id,
          supplierCode: supplier.supplierCode,
          supplierName: supplier.supplierName,
          sourceType: pick(sourceTypes, i),
          isPreferredVendor: i % 2 === 0 ? "Yes" : "No",
          validFrom,
          validTo,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }
  return { upserted };
}

async function seedVendorEvaluation(companyId, actorId) {
  const suppliers = await SupplierMaster.find({ company: companyId }).sort({ supplierCode: 1 }).limit(5).lean();
  if (!suppliers.length) return { upserted: 0, skipped: "no suppliers" };

  let upserted = 0;
  for (let i = 0; i < suppliers.length; i += 1) {
    const supplier = suppliers[i];
    const code = `VE${String(i + 1).padStart(4, "0")}`;
    await VendorEvaluationMaster.findOneAndUpdate(
      { company: companyId, evaluationCode: code },
      {
        $set: {
          company: companyId,
          createdBy: actorId,
          updatedBy: actorId,
          evaluationCode: code,
          supplierId: supplier._id,
          supplierCode: supplier.supplierCode,
          supplierName: supplier.supplierName,
          priceWeight: 25,
          deliveryWeight: 25,
          qualityWeight: 25,
          complianceWeight: 25,
          minimumScore: 60 + (i % 3) * 5,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
    upserted += 1;
  }
  return { upserted };
}

async function main() {
  await connectDatabase();
  const company = await resolveCompany();
  if (!company) {
    console.error("[seed-mpbcdc-masters] No company found");
    process.exitCode = 1;
    return;
  }

  const actor = await resolveActor(company._id);
  const actorId = actor?._id ?? null;
  const companyId = company._id;

  console.log(`[seed-mpbcdc-masters] Company: ${company.companyName}`);

  const itemCount = await backfillItems(companyId);
  const serviceCount = await backfillServices(companyId);
  const supplierCount = await backfillSuppliers(companyId);
  const assetCount = await backfillAssets(companyId);
  const logisticsCount = await backfillLogistics(companyId);
  const paymentTermsCount = await backfillPaymentTerms(companyId);
  const hsnCount = await backfillHsn(companyId);
  const sacCount = await backfillSac(companyId);
  const sourceList = await seedSourceList(companyId, actorId);
  const vendorEval = await seedVendorEvaluation(companyId, actorId);

  console.log("[seed-mpbcdc-masters] Backfill complete:");
  console.log(`  Material Master: ${itemCount} record(s)`);
  console.log(`  Service Master R1: ${serviceCount} record(s)`);
  console.log(`  Vendor Master: ${supplierCount} record(s)`);
  console.log(`  Asset Master: ${assetCount} record(s)`);
  console.log(`  Logistics Master: ${logisticsCount} record(s)`);
  console.log(`  Payment Terms: ${paymentTermsCount} record(s)`);
  console.log(`  HSN/P Master: ${hsnCount} record(s)`);
  console.log(`  SAC/P Master: ${sacCount} record(s)`);
  console.log(`  Source List: ${sourceList.upserted} record(s)${sourceList.skipped ? ` (${sourceList.skipped})` : ""}`);
  console.log(`  Vendor Evaluation: ${vendorEval.upserted} record(s)${vendorEval.skipped ? ` (${vendorEval.skipped})` : ""}`);
}

main()
  .catch((err) => {
    console.error("[seed-mpbcdc-masters] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
