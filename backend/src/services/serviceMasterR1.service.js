import { ServiceMasterR1 } from "../models/ServiceMasterR1.model.js";
import { SacPMaster } from "../models/SacPMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";
import { resolveServiceCategoryModule } from "../utils/serviceCategoryModule.js";
import { normalizeServiceMpbcdc } from "../utils/mpbcdcMasterFields.js";

function parseRate(value, fieldName) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    throw new AppError(`${fieldName} must be between 0 and 100`, 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 100) / 100;
}

function parseTdsRate(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    throw new AppError("TDS Rate % must be between 0 and 100", 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 100) / 100;
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

async function resolveSacRate(companyId, sacCode) {
  const code = String(sacCode ?? "").trim();
  if (!code) throw new AppError("SAC Code is required", 400, "VALIDATION_ERROR");
  const sac = await SacPMaster.findOne({ company: companyId, sacCode: code }).lean();
  if (!sac) throw new AppError(`Invalid SAC Code "${code}"`, 400, "VALIDATION_ERROR");
  return { sacCode: code, gstRate: parseRate(sac.gstRate ?? 0, "GST Rate") };
}

function normalizeNext(doc, data) {
  const serviceName = String(data?.serviceName ?? doc.serviceName ?? "").trim();
  const serviceDescription = String(data?.serviceDescription ?? doc.serviceDescription ?? "").trim();
  const serviceCategory = String(data?.serviceCategory ?? doc.serviceCategory ?? "").trim();
  const uom = String(data?.uom ?? doc.uom ?? "").trim();
  const gstRegimeApplicability = String(data?.gstRegimeApplicability ?? doc.gstRegimeApplicability ?? "").trim();
  const taxabilityType = String(data?.taxabilityType ?? doc.taxabilityType ?? "").trim();
  const rcmApplicability = String(data?.rcmApplicability ?? doc.rcmApplicability ?? "").trim();
  const itcAllowed = String(data?.itcAllowed ?? doc.itcAllowed ?? "").trim();
  const tdsApplicability = String(data?.tdsApplicability ?? doc.tdsApplicability ?? "").trim();
  const tdsSection = String(data?.tdsSection ?? doc.tdsSection ?? "").trim();
  const costCenter = String(data?.costCenter ?? doc.costCenter ?? "").trim();
  const status = data?.status === "Inactive" ? "Inactive" : "Active";
  const tdsRate = parseTdsRate(data?.tdsRate ?? doc.tdsRate ?? 0);

  if (
    !serviceName ||
    !serviceCategory ||
    !uom ||
    !gstRegimeApplicability ||
    !taxabilityType ||
    !rcmApplicability ||
    !itcAllowed ||
    !tdsApplicability ||
    !tdsSection
  ) {
    throw new AppError("Required service fields are missing", 400, "VALIDATION_ERROR");
  }

  return {
    serviceName,
    serviceDescription,
    serviceCategory,
    uom,
    gstRegimeApplicability,
    taxabilityType,
    rcmApplicability,
    itcAllowed,
    tdsApplicability,
    tdsSection,
    tdsRate,
    costCenter,
    status,
  };
}

const REVISION_FIELDS = [
  "serviceName",
  "serviceDescription",
  "uom",
  "gstRegimeApplicability",
  "sacCode",
  "taxabilityType",
  "gstRate",
  "rcmApplicability",
  "itcAllowed",
  "tdsApplicability",
  "tdsSection",
  "tdsRate",
  "costCenter",
  "status",
];

function buildChanges(prev, next) {
  const changes = [];
  for (const field of REVISION_FIELDS) {
    if (String(prev[field] ?? "") !== String(next[field] ?? "")) {
      changes.push({ field, from: prev[field], to: next[field] });
    }
  }
  return changes;
}

function snapshot(doc) {
  const o = {};
  for (const f of REVISION_FIELDS) o[f] = doc[f];
  return o;
}

export async function listServiceMasterR1(companyId) {
  return ServiceMasterR1.find({ company: companyId }).sort({ serviceId: 1 }).lean();
}

export async function getServiceMasterR1(companyId, id) {
  const doc = await ServiceMasterR1.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Service record not found", 404, "NOT_FOUND");
  return doc;
}

export async function createServiceMasterR1(companyId, data, actorId) {
  const base = normalizeNext({}, data ?? {});
  const categoryModule = await resolveServiceCategoryModule(companyId, base.serviceCategory);
  const serviceId = await allocateNextCode(companyId, categoryModule);
  const { sacCode, gstRate: sacRate } = await resolveSacRate(companyId, data?.sacCode);
  const doc = await ServiceMasterR1.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    serviceId,
    ...base,
    sacCode,
    gstRate: data?.gstRate !== undefined ? parseRate(data.gstRate, "GST Rate") : sacRate,
    revNumber: 0,
    revisionHistory: [],
    mpbcdcService: normalizeServiceMpbcdc(data),
  });
  return doc.toObject();
}

export async function updateServiceMasterR1(companyId, id, data, actor) {
  const doc = await ServiceMasterR1.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Service record not found", 404, "NOT_FOUND");

  const next = normalizeNext(doc, data ?? {});
  const { sacCode, gstRate: sacRate } = await resolveSacRate(companyId, data?.sacCode ?? doc.sacCode);
  const merged = {
    ...next,
    sacCode,
    gstRate:
      data?.gstRate !== undefined && data?.gstRate !== null && data?.gstRate !== ""
        ? parseRate(data.gstRate, "GST Rate")
        : sacRate,
  };
  const nextMpbcdc = normalizeServiceMpbcdc(data);
  const prev = snapshot(doc);
  const changes = buildChanges(prev, merged);
  const mpbcdcChanged = JSON.stringify(doc.mpbcdcService ?? {}) !== JSON.stringify(nextMpbcdc);
  if (changes.length === 0 && !mpbcdcChanged) return doc.toObject();

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;
  Object.assign(doc, merged, {
    revNumber: nextRev,
    updatedBy: actor?.userId || actor,
    mpbcdcService: nextMpbcdc,
  });
  if (changes.length > 0 || mpbcdcChanged) {
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

export async function deleteServiceMasterR1(companyId, id) {
  const doc = await ServiceMasterR1.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Service record not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
