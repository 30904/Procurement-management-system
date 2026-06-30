import { AssetMaster } from "../models/AssetMaster.model.js";
import { HsnPMaster } from "../models/HsnPMaster.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";
import { resolveAssetCategoryModule } from "../utils/assetCategoryModule.js";
import { applyLocationFilter } from "../utils/locationScope.js";
import { resolveAssetLocationFields } from "../utils/resolveMasterLocationFields.js";
import { normalizeAssetProcurementTracking } from "../utils/mpbcdcMasterFields.js";

function parseRate(value, fieldName) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    throw new AppError(`${fieldName} must be between 0 and 100`, 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 100) / 100;
}

function parsePositiveNumber(value, fieldName, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${fieldName} is required`, 400, "VALIDATION_ERROR");
    return undefined;
  }
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new AppError(`${fieldName} must be a valid non-negative number`, 400, "VALIDATION_ERROR");
  }
  return n;
}

function parseDate(value, fieldName, required = false) {
  if (!value) {
    if (required) throw new AppError(`${fieldName} is required`, 400, "VALIDATION_ERROR");
    return undefined;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, 400, "VALIDATION_ERROR");
  }
  return d;
}

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();
  if (!reason || !proposedBy || !approvedBy) {
    throw new AppError("Revision details are required", 400, "VALIDATION_ERROR");
  }
  const revisionDate = revisionInfo?.revisionDate ? new Date(revisionInfo.revisionDate) : new Date();
  if (Number.isNaN(revisionDate.getTime())) {
    throw new AppError("Invalid revision date", 400, "VALIDATION_ERROR");
  }
  return {
    reason,
    proposedBy,
    approvedBy,
    revisionDate,
    changedBy: {
      userId: actor?.userId || undefined,
      name: String(actor?.name ?? "").trim(),
      userName: String(actor?.userName ?? "").trim(),
      userEmail: String(actor?.userEmail ?? "").trim(),
    },
  };
}

async function resolveHsnRate(companyId, hsnCode) {
  const code = String(hsnCode ?? "").trim();
  if (!code) throw new AppError("HSN Code is required", 400, "VALIDATION_ERROR");
  const hsn = await HsnPMaster.findOne({ company: companyId, hsnCode: code }).lean();
  if (!hsn) throw new AppError(`Invalid HSN Code "${code}"`, 400, "VALIDATION_ERROR");
  return { hsnCode: code, gstRate: parseRate(hsn.gstRate ?? 0, "GST Rate") };
}

async function resolveSupplier(companyId, data, doc = {}) {
  const supplierId = data?.supplierId ?? doc.supplierId;
  if (!supplierId) {
    return { supplierId: undefined, supplierCode: "", supplierName: "" };
  }
  const supplier = await SupplierMaster.findOne({ _id: supplierId, company: companyId }).lean();
  if (!supplier) throw new AppError("Invalid supplier selected", 400, "VALIDATION_ERROR");
  return {
    supplierId: supplier._id,
    supplierCode: supplier.supplierCode || "",
    supplierName: supplier.supplierName || "",
  };
}

function normalizeNext(doc, data) {
  const assetName = String(data?.assetName ?? doc.assetName ?? "").trim();
  const assetDescription = String(data?.assetDescription ?? doc.assetDescription ?? "").trim();
  const assetCategory = String(data?.assetCategory ?? doc.assetCategory ?? "").trim();
  const uom = String(data?.uom ?? doc.uom ?? "").trim();
  const assetLocation = String(data?.assetLocation ?? doc.assetLocation ?? "").trim();
  const subLocation = String(data?.subLocation ?? doc.subLocation ?? "").trim();
  const status = data?.status === "Inactive" ? "Inactive" : "Active";
  const lifeExpectancyYears = parsePositiveNumber(
    data?.lifeExpectancyYears ?? doc.lifeExpectancyYears,
    "Life Expectancy (Year)",
    true
  );
  const manufacturerName = String(data?.manufacturerName ?? doc.manufacturerName ?? "").trim();
  const mpnModelNo = String(data?.mpnModelNo ?? doc.mpnModelNo ?? "").trim();
  const assetUniqueId = String(data?.assetUniqueId ?? doc.assetUniqueId ?? "").trim();
  const acquisitionDate = parseDate(data?.acquisitionDate ?? doc.acquisitionDate, "Acquisition Date", true);
  const capitalisationDate = parseDate(data?.capitalisationDate ?? doc.capitalisationDate, "Capitalisation Date", true);
  const inOperationDate = parseDate(data?.inOperationDate ?? doc.inOperationDate, "In-Operation Date", false);
  const manufacturingYear = parsePositiveNumber(data?.manufacturingYear ?? doc.manufacturingYear, "Manufacturing Year");
  const ratedPowerKw = parsePositiveNumber(data?.ratedPowerKw ?? doc.ratedPowerKw, "Rated Power kW");
  const purchaseRateExGst = parsePositiveNumber(data?.purchaseRateExGst ?? doc.purchaseRateExGst, "Purchase Rate") ?? 0;

  if (!assetName || !assetDescription || !assetCategory || !uom || !assetLocation) {
    throw new AppError("Asset Category, Name, Description, UoM and Asset Location are required", 400, "VALIDATION_ERROR");
  }

  return {
    assetName,
    assetDescription,
    assetCategory,
    uom,
    assetLocation,
    locationId: data?.locationId || doc.locationId || undefined,
    subLocationId: data?.subLocationId || doc.subLocationId || undefined,
    subLocation,
    status,
    lifeExpectancyYears,
    manufacturerName,
    mpnModelNo,
    assetUniqueId,
    acquisitionDate,
    capitalisationDate,
    inOperationDate,
    manufacturingYear,
    ratedPowerKw,
    purchaseRateExGst,
  };
}

const REVISION_FIELDS = [
  "assetName",
  "assetDescription",
  "uom",
  "hsnCode",
  "gstRate",
  "lifeExpectancyYears",
  "supplierName",
  "manufacturerName",
  "mpnModelNo",
  "purchaseRateExGst",
  "assetUniqueId",
  "acquisitionDate",
  "capitalisationDate",
  "inOperationDate",
  "manufacturingYear",
  "ratedPowerKw",
  "assetLocation",
  "subLocation",
  "status",
];

function buildChanges(prev, next) {
  const changes = [];
  for (const field of REVISION_FIELDS) {
    const fromVal = prev[field];
    const toVal = next[field];
    const fromStr = fromVal instanceof Date ? fromVal.toISOString() : String(fromVal ?? "");
    const toStr = toVal instanceof Date ? toVal.toISOString() : String(toVal ?? "");
    if (fromStr !== toStr) {
      changes.push({ field, from: fromVal, to: toVal });
    }
  }
  return changes;
}

function snapshotForRevision(doc) {
  return {
    assetName: doc.assetName,
    assetDescription: doc.assetDescription,
    uom: doc.uom,
    hsnCode: doc.hsnCode,
    gstRate: doc.gstRate,
    lifeExpectancyYears: doc.lifeExpectancyYears,
    supplierName: doc.supplierName,
    manufacturerName: doc.manufacturerName,
    mpnModelNo: doc.mpnModelNo,
    purchaseRateExGst: doc.purchaseRateExGst,
    assetUniqueId: doc.assetUniqueId,
    acquisitionDate: doc.acquisitionDate,
    capitalisationDate: doc.capitalisationDate,
    inOperationDate: doc.inOperationDate,
    manufacturingYear: doc.manufacturingYear,
    ratedPowerKw: doc.ratedPowerKw,
    assetLocation: doc.assetLocation,
    subLocation: doc.subLocation,
    status: doc.status,
  };
}

export async function listAssetMasters(companyId, scope, { locationOnly = false } = {}) {
  let filter = { company: companyId };
  if (locationOnly && scope) {
    filter = applyLocationFilter(filter, scope, "locationId", true);
  }
  return AssetMaster.find(filter).sort({ assetNo: 1 }).lean();
}

export async function getAssetMaster(companyId, id) {
  const doc = await AssetMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Asset record not found", 404, "NOT_FOUND");
  return doc;
}

export async function createAssetMaster(companyId, data, actorId) {
  const locFields = await resolveAssetLocationFields(companyId, data ?? {});
  const base = { ...normalizeNext({}, { ...data, ...locFields }), ...locFields };
  const supplier = await resolveSupplier(companyId, data ?? {});
  const categoryModule = await resolveAssetCategoryModule(companyId, base.assetCategory);
  const assetNo = await allocateNextCode(companyId, categoryModule);
  const { hsnCode, gstRate: hsnRate } = await resolveHsnRate(companyId, data?.hsnCode);
  const doc = await AssetMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    assetNo,
    ...base,
    ...supplier,
    hsnCode,
    gstRate: data?.gstRate !== undefined ? parseRate(data.gstRate, "GST Rate") : hsnRate,
    revNumber: 0,
    revisionHistory: [],
    procurementTracking: normalizeAssetProcurementTracking(data),
  });
  return doc.toObject();
}

export async function updateAssetMaster(companyId, id, data, actor) {
  const doc = await AssetMaster.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Asset record not found", 404, "NOT_FOUND");

  const locFields = await resolveAssetLocationFields(companyId, data ?? {}, doc);
  const next = { ...normalizeNext(doc, { ...data, ...locFields }), ...locFields };
  const supplier = await resolveSupplier(companyId, data ?? {}, doc);
  const { hsnCode, gstRate: hsnRate } = await resolveHsnRate(companyId, data?.hsnCode ?? doc.hsnCode);
  const merged = {
    ...next,
    ...supplier,
    hsnCode,
    gstRate:
      data?.gstRate !== undefined && data?.gstRate !== null && data?.gstRate !== ""
        ? parseRate(data.gstRate, "GST Rate")
        : hsnRate,
  };
  const nextTracking = normalizeAssetProcurementTracking(data);
  const prev = snapshotForRevision(doc);
  const changes = buildChanges(prev, merged);
  const trackingChanged =
    JSON.stringify(doc.procurementTracking ?? {}) !== JSON.stringify(nextTracking);
  if (changes.length === 0 && !trackingChanged) return doc.toObject();

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;
  Object.assign(doc, merged, {
    revNumber: nextRev,
    updatedBy: actor?.userId || actor,
    procurementTracking: nextTracking,
  });
  if (changes.length > 0 || trackingChanged) {
    doc.revisionHistory.push({
      revisionNo: nextRev,
      revisionDate: revision.revisionDate,
      reason: revision.reason,
      proposedBy: revision.proposedBy,
      approvedBy: revision.approvedBy,
      changedBy: revision.changedBy,
      changedAt: new Date(),
      changes,
    });
  }
  if (doc.revisionHistory.length > 200) doc.revisionHistory = doc.revisionHistory.slice(-200);
  await doc.save();
  return doc.toObject();
}

export async function deleteAssetMaster(companyId, id) {
  const doc = await AssetMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Asset record not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
