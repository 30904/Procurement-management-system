import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";
import {
  resolveSupplierCategoryModule,
  resolveSupplierCategoryLabel,
} from "../utils/supplierCategoryModule.js";

function trimStr(val) {
  return val === undefined || val === null ? "" : String(val).trim();
}

function normalizeAddressList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    line1: trimStr(row?.line1),
    line2: trimStr(row?.line2),
    line3: trimStr(row?.line3),
    line4: trimStr(row?.line4),
    state: trimStr(row?.state),
    city: trimStr(row?.city),
    district: trimStr(row?.district),
    pinCode: trimStr(row?.pinCode),
    country: trimStr(row?.country),
    zone: trimStr(row?.zone),
  }));
}

function normalizeBankList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    befName: trimStr(row?.befName),
    bankName: trimStr(row?.bankName),
    accountNumber: trimStr(row?.accountNumber),
    accountType: trimStr(row?.accountType),
    ifsCode: trimStr(row?.ifsCode),
    bankSwiftCode: trimStr(row?.bankSwiftCode),
  }));
}

function normalizeContactList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    name: trimStr(row?.name),
    department: trimStr(row?.department),
    email: trimStr(row?.email),
    mobile: trimStr(row?.mobile),
    designation: trimStr(row?.designation),
  }));
}

function parseOptionalDate(val) {
  if (val === null || val === undefined || val === "") return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeGovProcurement(data) {
  const g = data?.govProcurement || {};
  return {
    vendorType: trimStr(g.vendorType),
    gemRegistered: trimStr(g.gemRegistered),
    gemRegistrationNumber: trimStr(g.gemRegistrationNumber),
    vendorRegistrationDate: parseOptionalDate(g.vendorRegistrationDate),
    vendorClassification: trimStr(g.vendorClassification),
    msmeEligible: trimStr(g.msmeEligible),
    womenOwnedEnterprise: trimStr(g.womenOwnedEnterprise),
    startupRegistered: trimStr(g.startupRegistered),
  };
}

function normalizeVendorCompliance(data) {
  const c = data?.vendorCompliance || {};
  return {
    panVerified: trimStr(c.panVerified),
    gstVerified: trimStr(c.gstVerified),
    bankVerified: trimStr(c.bankVerified),
    complianceStatus: trimStr(c.complianceStatus) || "Draft",
    lastComplianceReview: parseOptionalDate(c.lastComplianceReview),
    reviewDueDate: parseOptionalDate(c.reviewDueDate),
    approvedBy: trimStr(c.approvedBy),
    approvalDate: parseOptionalDate(c.approvalDate),
  };
}

function normalizeVendorPerformance(data, existing) {
  const p = data?.vendorPerformance || existing?.vendorPerformance || {};
  const num = (v, fallback = 0) => {
    const n = Number(v);
    if (Number.isNaN(n)) return fallback;
    return Math.max(0, n);
  };
  return {
    vendorScore: num(p.vendorScore, 0),
    deliveryRating: num(p.deliveryRating, 0),
    qualityRating: num(p.qualityRating, 0),
    overallRating: num(p.overallRating, 0),
  };
}

const ARRAY_TRACKED_FIELDS = new Set([
  "supplierBillingAddress",
  "supplierShippingAddress",
  "supplierBankDetails",
  "supplierContactMatrix",
  "supplierAddress",
]);

const TRACKED_FIELDS = [
  "supplierName",
  "supplierNickName",
  "isSupplierActive",
  "supplierCompanyType",
  "supplierCurrency",
  "supplierINCOTerms",
  "supplierPaymentTerms",
  "countryOfOrigin",
  "supplierType",
  "supplierCIN",
  "supplierURD",
  "supplierMSMENo",
  "supplierLeadTimeInDays",
  "supplierVendorCode",
  "supplierWebsite",
  "gstClassification",
  "gstin",
  "supplierBillingAddress",
  "supplierShippingAddress",
  "supplierBankDetails",
  "supplierContactMatrix",
  "supplierAddress",
];

function serializeFieldValue(val, field) {
  if (ARRAY_TRACKED_FIELDS.has(field)) {
    return JSON.stringify(val ?? []);
  }
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return String(val);
  return String(val).trim();
}

function formatChangeValue(field, val) {
  if (ARRAY_TRACKED_FIELDS.has(field)) {
    const n = Array.isArray(val) ? val.length : 0;
    return n ? `${n} record(s)` : "—";
  }
  if (field === "isSupplierActive") {
    return String(val || "").toUpperCase() === "A" ? "Active" : "Inactive";
  }
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

function buildChangeSet(doc, payload) {
  const changes = [];
  for (const field of TRACKED_FIELDS) {
    const previous = serializeFieldValue(doc[field], field);
    const current = serializeFieldValue(payload[field], field);
    if (previous !== current) {
      changes.push({
        field,
        from: formatChangeValue(field, doc[field]),
        to: formatChangeValue(field, payload[field]),
      });
    }
  }
  return changes;
}

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();

  if (!reason) {
    throw new AppError("Revision reason is required", 400, "VALIDATION_ERROR");
  }
  if (!proposedBy) {
    throw new AppError("Revision proposed by is required", 400, "VALIDATION_ERROR");
  }
  if (!approvedBy) {
    throw new AppError("Revision approved by is required", 400, "VALIDATION_ERROR");
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

function normalizePayload(data, existing) {
  const leadRaw = data?.supplierLeadTimeInDays;
  const lead =
    leadRaw === "" || leadRaw === null || leadRaw === undefined
      ? null
      : Number(leadRaw);

  return {
    supplierCode: trimStr(data?.supplierCode),
    supplierName: trimStr(data?.supplierName),
    supplierPurchaseType: trimStr(data?.supplierPurchaseType),
    isSupplierActive: trimStr(data?.isSupplierActive) || "A",
    supplierCompanyType: trimStr(data?.supplierCompanyType),
    supplierBillingAddress: normalizeAddressList(data?.supplierBillingAddress),
    supplierCurrency: trimStr(data?.supplierCurrency) || "USD",
    supplierINCOTerms: trimStr(data?.supplierINCOTerms),
    supplierPaymentTerms: trimStr(data?.supplierPaymentTerms),
    countryOfOrigin: trimStr(data?.countryOfOrigin),
    supplierAddress: normalizeAddressList(data?.supplierAddress),
    supplierBankDetails: normalizeBankList(data?.supplierBankDetails),
    supplierCIN: trimStr(data?.supplierCIN),
    supplierContactMatrix: normalizeContactList(data?.supplierContactMatrix),
    supplierLeadTimeInDays: Number.isNaN(lead) ? null : lead,
    supplierMSMENo: trimStr(data?.supplierMSMENo),
    supplierNickName: trimStr(data?.supplierNickName),
    supplierShippingAddress: normalizeAddressList(data?.supplierShippingAddress),
    supplierType: trimStr(data?.supplierType),
    supplierURD: trimStr(data?.supplierURD),
    supplierVendorCode: trimStr(data?.supplierVendorCode),
    supplierWebsite: trimStr(data?.supplierWebsite),
    categoryType: trimStr(data?.categoryType),
    gstClassification: trimStr(data?.gstClassification),
    gstin: trimStr(data?.gstin),
    govProcurement: normalizeGovProcurement(data),
    vendorCompliance: normalizeVendorCompliance(data),
    vendorPerformance: normalizeVendorPerformance(data, existing),
  };
}

export async function listSupplierMasters(companyId) {
  return SupplierMaster.find({ company: companyId })
    .sort({ supplierCode: -1 })
    .lean();
}

export async function createSupplierMaster(companyId, data, actorId) {
  const payload = normalizePayload(data);
  if (!payload.categoryType) {
    throw new AppError("Supplier Category is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.supplierName) {
    throw new AppError("Supplier Name is required", 400, "VALIDATION_ERROR");
  }

  const moduleKey = await resolveSupplierCategoryModule(companyId, payload.categoryType);
  const categoryLabel = await resolveSupplierCategoryLabel(companyId, payload.categoryType);
  payload.categoryType = categoryLabel || payload.categoryType;
  payload.supplierPurchaseType = categoryLabel || payload.supplierPurchaseType;

  payload.supplierCode = await allocateNextCode(companyId, moduleKey);

  const existing = await SupplierMaster.findOne({
    company: companyId,
    supplierCode: payload.supplierCode,
  });
  if (existing) {
    throw new AppError(
      `Supplier Code "${payload.supplierCode}" already exists`,
      409,
      "DUPLICATE"
    );
  }

  const doc = await SupplierMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    revNumber: 0,
    revisionHistory: [],
    ...payload,
  });

  return doc.toObject();
}

export async function getSupplierMaster(companyId, id) {
  const doc = await SupplierMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) {
    throw new AppError("Supplier record not found", 404, "NOT_FOUND");
  }
  return doc;
}

export async function updateSupplierMaster(companyId, id, data, actor) {
  const doc = await SupplierMaster.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Supplier record not found", 404, "NOT_FOUND");
  }

  const actorId = actor?.userId || actor;
  const lockedCode = doc.supplierCode;
  const lockedCategory = doc.categoryType;
  const lockedPurchaseType = doc.supplierPurchaseType;

  const payload = normalizePayload({ ...doc.toObject(), ...data }, doc.toObject());
  payload.supplierCode = lockedCode;
  payload.categoryType = lockedCategory;
  payload.supplierPurchaseType = lockedPurchaseType;

  if (!payload.supplierCode) {
    throw new AppError("Supplier Code is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.supplierName) {
    throw new AppError("Supplier Name is required", 400, "VALIDATION_ERROR");
  }

  const dup = await SupplierMaster.findOne({
    company: companyId,
    supplierCode: payload.supplierCode,
    _id: { $ne: id },
  });
  if (dup) {
    throw new AppError(
      `Supplier Code "${payload.supplierCode}" already exists`,
      409,
      "DUPLICATE"
    );
  }

  const changes = buildChangeSet(doc.toObject(), payload);
  if (changes.length === 0) {
    return doc.toObject();
  }

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  Object.assign(doc, payload);
  doc.revNumber = nextRev;
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

  if (doc.revisionHistory.length > 200) {
    doc.revisionHistory = doc.revisionHistory.slice(-200);
  }

  doc.updatedBy = actorId;
  await doc.save();
  return doc.toObject();
}

export async function deleteSupplierMaster(companyId, id) {
  const doc = await SupplierMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Supplier record not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
