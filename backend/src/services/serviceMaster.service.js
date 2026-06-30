import { ServiceMaster } from "../models/ServiceMaster.model.js";
import { SacPMaster } from "../models/SacPMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";

function parseRate(value, fieldName) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    throw new AppError(`${fieldName} must be between 0 and 100`, 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 100) / 100;
}

function normalizeComparable(val) {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val.trim();
  return val;
}

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();

  if (!reason) throw new AppError("Revision reason is required", 400, "VALIDATION_ERROR");
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

async function resolveSacGstRate(companyId, sacCode) {
  const normalizedSacCode = String(sacCode ?? "").trim();
  if (!normalizedSacCode) {
    throw new AppError("SAC Code is required", 400, "VALIDATION_ERROR");
  }

  const sac = await SacPMaster.findOne({ company: companyId, sacCode: normalizedSacCode }).lean();
  if (!sac) {
    throw new AppError(
      `Invalid SAC Code "${normalizedSacCode}". SAC/P record not found`,
      400,
      "VALIDATION_ERROR"
    );
  }

  return {
    sacCode: normalizedSacCode,
    gstRate: parseRate(sac.gstRate ?? 0, "GST Rate"),
  };
}

function buildChangeSet(doc, data) {
  const next = {
    serviceDescription:
      data.serviceDescription !== undefined
        ? String(data.serviceDescription).trim()
        : doc.serviceDescription,
    sacCode: data.sacCode !== undefined ? String(data.sacCode).trim() : doc.sacCode,
    gstRate: data.gstRate !== undefined ? parseRate(data.gstRate, "GST Rate") : doc.gstRate,
    status:
      data.status !== undefined
        ? data.status === "Inactive"
          ? "Inactive"
          : "Active"
        : doc.status,
  };

  const fields = ["serviceDescription", "sacCode", "gstRate", "status"];
  const changes = [];
  for (const field of fields) {
    const previous = normalizeComparable(doc[field]);
    const current = normalizeComparable(next[field]);
    if (previous !== current) {
      changes.push({ field, from: previous, to: current });
    }
  }

  return { next, changes };
}

export async function listServiceMasters(companyId) {
  return ServiceMaster.find({ company: companyId }).sort({ serviceNo: 1 }).lean();
}

export async function getServiceMaster(companyId, id) {
  const doc = await ServiceMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) {
    throw new AppError("Service record not found", 404, "NOT_FOUND");
  }
  return doc;
}

export async function createServiceMaster(companyId, data, actorId) {
  const serviceDescription = String(data?.serviceDescription ?? "").trim();
  if (!serviceDescription) {
    throw new AppError("Service Description is required", 400, "VALIDATION_ERROR");
  }

  const { sacCode, gstRate: sacGstRate } = await resolveSacGstRate(companyId, data?.sacCode);
  const serviceNo = await allocateNextCode(companyId, "SER");

  const existing = await ServiceMaster.findOne({ company: companyId, serviceNo });
  if (existing) {
    throw new AppError(`Service No "${serviceNo}" already exists`, 409, "DUPLICATE");
  }

  const doc = await ServiceMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    serviceNo,
    serviceDescription,
    sacCode,
    gstRate:
      data?.gstRate !== undefined && data?.gstRate !== null && data?.gstRate !== ""
        ? parseRate(data.gstRate, "GST Rate")
        : sacGstRate,
    status: data?.status === "Inactive" ? "Inactive" : "Active",
    revNumber: Math.max(0, parseInt(data?.revNumber, 10) || 0),
    revisionHistory: [],
  });

  return doc.toObject();
}

export async function updateServiceMaster(companyId, id, data, actor) {
  const doc = await ServiceMaster.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Service record not found", 404, "NOT_FOUND");
  }

  const actorId = actor?.userId || actor;
  const nextData = { ...(data ?? {}) };

  const incomingDescription =
    nextData.serviceDescription !== undefined
      ? String(nextData.serviceDescription).trim()
      : doc.serviceDescription;
  if (!incomingDescription) {
    throw new AppError("Service Description is required", 400, "VALIDATION_ERROR");
  }
  nextData.serviceDescription = incomingDescription;

  const incomingSacCode =
    nextData.sacCode !== undefined ? String(nextData.sacCode).trim() : String(doc.sacCode).trim();
  const { sacCode, gstRate: sacGstRate } = await resolveSacGstRate(companyId, incomingSacCode);
  nextData.sacCode = sacCode;
  if (nextData.gstRate === undefined || nextData.gstRate === null || nextData.gstRate === "") {
    nextData.gstRate = sacGstRate;
  }

  const { next, changes } = buildChangeSet(doc, nextData);
  if (changes.length === 0) return doc.toObject();

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  doc.serviceDescription = next.serviceDescription;
  doc.sacCode = next.sacCode;
  doc.gstRate = next.gstRate;
  doc.status = next.status;
  doc.revNumber = nextRev;
  doc.updatedBy = actorId;

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

  await doc.save();
  return doc.toObject();
}

export async function deleteServiceMaster(companyId, id) {
  const doc = await ServiceMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Service record not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
