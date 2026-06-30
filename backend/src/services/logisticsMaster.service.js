import { LogisticsMaster } from "../models/LogisticsMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";
import {
  resolveLogisticsCategoryModule,
  resolveLogisticsCategoryLabel,
} from "../utils/logisticsCategoryModule.js";
import { normalizeLogisticsMpbcdc } from "../utils/mpbcdcMasterFields.js";

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

function normalizeVehicleList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((row) => ({
    vehicleNo: trimStr(row?.vehicleNo),
  }));
}

const ARRAY_TRACKED_FIELDS = new Set([
  "lspAddress",
  "lspContactMatrix",
  "lspBankDetails",
  "lspVehicleDetails",
]);

const TRACKED_FIELDS = [
  "lspNameLegalEntity",
  "lspNickName",
  "gstin",
  "lspCIN",
  "lspCurrency",
  "lspPaymentTerms",
  "freightServiceType",
  "rcmApplicability",
  "isLspActive",
  "lspAddress",
  "lspContactMatrix",
  "lspBankDetails",
  "lspVehicleDetails",
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
  if (field === "isLspActive") {
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

function normalizePayload(data) {
  return {
    lspCode: trimStr(data?.lspCode),
    categoryType: trimStr(data?.categoryType),
    lspNameLegalEntity: trimStr(data?.lspNameLegalEntity),
    lspNickName: trimStr(data?.lspNickName),
    gstin: trimStr(data?.gstin),
    lspCIN: trimStr(data?.lspCIN),
    lspCurrency: trimStr(data?.lspCurrency) || "INR",
    lspPaymentTerms: trimStr(data?.lspPaymentTerms),
    freightServiceType: trimStr(data?.freightServiceType),
    rcmApplicability: trimStr(data?.rcmApplicability),
    isLspActive: trimStr(data?.isLspActive) || "A",
    lspAddress: normalizeAddressList(data?.lspAddress),
    lspContactMatrix: normalizeContactList(data?.lspContactMatrix),
    lspBankDetails: normalizeBankList(data?.lspBankDetails),
    lspVehicleDetails: normalizeVehicleList(data?.lspVehicleDetails),
    mpbcdcLogistics: normalizeLogisticsMpbcdc(data),
  };
}

export async function listLogisticsMasters(companyId) {
  return LogisticsMaster.find({ company: companyId }).sort({ lspCode: -1 }).lean();
}

export async function createLogisticsMaster(companyId, data, actorId) {
  const payload = normalizePayload(data);
  if (!payload.categoryType) {
    throw new AppError("LSP Category is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.lspNameLegalEntity) {
    throw new AppError("LSP legal entity name is required", 400, "VALIDATION_ERROR");
  }
  if (!Array.isArray(payload.lspAddress) || payload.lspAddress.length === 0) {
    throw new AppError("At least one LSP address is required", 400, "VALIDATION_ERROR");
  }

  const moduleKey = await resolveLogisticsCategoryModule(companyId, payload.categoryType);
  const categoryLabel = await resolveLogisticsCategoryLabel(companyId, payload.categoryType);
  payload.categoryType = categoryLabel || payload.categoryType;
  payload.lspCode = await allocateNextCode(companyId, moduleKey);

  const existing = await LogisticsMaster.findOne({
    company: companyId,
    lspCode: payload.lspCode,
  });
  if (existing) {
    throw new AppError(`LSP Code "${payload.lspCode}" already exists`, 409, "DUPLICATE");
  }

  const doc = await LogisticsMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    revNumber: 0,
    revisionHistory: [],
    ...payload,
  });

  return doc.toObject();
}

export async function getLogisticsMaster(companyId, id) {
  const doc = await LogisticsMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) {
    throw new AppError("Logistics record not found", 404, "NOT_FOUND");
  }
  return doc;
}

export async function updateLogisticsMaster(companyId, id, data, actor) {
  const doc = await LogisticsMaster.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Logistics record not found", 404, "NOT_FOUND");
  }

  const actorId = actor?.userId || actor;
  const lockedCode = doc.lspCode;
  const lockedCategory = doc.categoryType;

  const payload = normalizePayload({ ...doc.toObject(), ...data });
  payload.lspCode = lockedCode;
  payload.categoryType = lockedCategory;

  if (!payload.lspCode) {
    throw new AppError("LSP Code is required", 400, "VALIDATION_ERROR");
  }
  if (!payload.lspNameLegalEntity) {
    throw new AppError("LSP legal entity name is required", 400, "VALIDATION_ERROR");
  }
  if (!Array.isArray(payload.lspAddress) || payload.lspAddress.length === 0) {
    throw new AppError("At least one LSP address is required", 400, "VALIDATION_ERROR");
  }

  const dup = await LogisticsMaster.findOne({
    company: companyId,
    lspCode: payload.lspCode,
    _id: { $ne: id },
  });
  if (dup) {
    throw new AppError(`LSP Code "${payload.lspCode}" already exists`, 409, "DUPLICATE");
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

export async function deleteLogisticsMaster(companyId, id) {
  const doc = await LogisticsMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Logistics record not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
