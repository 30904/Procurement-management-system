import { STANDARD_SPEC_AUTO_MODULE } from "../config/standardSpecification.js";
import { StandardSpecification } from "../models/StandardSpecification.model.js";
import { allocateNextCode, previewNextCode } from "./autoIncrement.service.js";
import { AppError } from "../utils/AppError.js";

function normalizeComparable(val) {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val.trim();
  return val;
}

function buildChangeSet(doc, data) {
  const next = {
    inspectionParameter:
      data.inspectionParameter !== undefined
        ? String(data.inspectionParameter).trim()
        : doc.inspectionParameter,
    uom: data.uom !== undefined ? String(data.uom).trim() : doc.uom,
    testStandard:
      data.testStandard !== undefined ? String(data.testStandard).trim() : doc.testStandard,
    testMethod:
      data.testMethod !== undefined ? String(data.testMethod).trim() : doc.testMethod,
    status:
      data.status !== undefined
        ? data.status === "Inactive"
          ? "Inactive"
          : "Active"
        : doc.status,
  };

  const fields = ["inspectionParameter", "uom", "testStandard", "testMethod", "status"];
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

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();

  if (!reason) throw new AppError("Revision reason is required", 400, "VALIDATION_ERROR");
  if (!proposedBy) throw new AppError("Revision proposed by is required", 400, "VALIDATION_ERROR");
  if (!approvedBy) throw new AppError("Revision approved by is required", 400, "VALIDATION_ERROR");

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

function validateCreatePayload(data) {
  const inspectionParameter = String(data?.inspectionParameter ?? "").trim();
  const uom = String(data?.uom ?? "").trim();
  const testMethod = String(data?.testMethod ?? "").trim();

  if (!inspectionParameter) {
    throw new AppError("Inspection/Test Parameter is required", 400, "VALIDATION_ERROR");
  }
  if (!uom) throw new AppError("UoM is required", 400, "VALIDATION_ERROR");
  if (!testMethod) throw new AppError("Test Method is required", 400, "VALIDATION_ERROR");

  return {
    inspectionParameter,
    uom,
    testStandard: String(data?.testStandard ?? "").trim(),
    testMethod,
    status: data?.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function previewStandardSpecId(companyId) {
  return previewNextCode(companyId, STANDARD_SPEC_AUTO_MODULE);
}

export async function listStandardSpecifications(companyId) {
  return StandardSpecification.find({ company: companyId })
    .sort({ specId: -1 })
    .lean();
}

export async function getStandardSpecification(companyId, id) {
  const doc = await StandardSpecification.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Standard specification not found", 404, "NOT_FOUND");
  return doc;
}

export async function createStandardSpecification(companyId, data) {
  const payload = validateCreatePayload(data);
  const specId = await allocateNextCode(companyId, STANDARD_SPEC_AUTO_MODULE);

  const existing = await StandardSpecification.findOne({ company: companyId, specId });
  if (existing) {
    throw new AppError(`Spec ID "${specId}" already exists`, 409, "DUPLICATE");
  }

  const doc = await StandardSpecification.create({
    company: companyId,
    specId,
    ...payload,
    revNumber: 0,
  });

  return doc.toObject();
}

export async function updateStandardSpecification(companyId, id, data, actor) {
  const doc = await StandardSpecification.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Standard specification not found", 404, "NOT_FOUND");

  if (data.inspectionParameter !== undefined && !String(data.inspectionParameter).trim()) {
    throw new AppError("Inspection/Test Parameter is required", 400, "VALIDATION_ERROR");
  }
  if (data.uom !== undefined && !String(data.uom).trim()) {
    throw new AppError("UoM is required", 400, "VALIDATION_ERROR");
  }
  if (data.testMethod !== undefined && !String(data.testMethod).trim()) {
    throw new AppError("Test Method is required", 400, "VALIDATION_ERROR");
  }

  const { next, changes } = buildChangeSet(doc, data ?? {});
  if (changes.length === 0) {
    return doc.toObject();
  }

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  doc.inspectionParameter = next.inspectionParameter;
  doc.uom = next.uom;
  doc.testStandard = next.testStandard;
  doc.testMethod = next.testMethod;
  doc.status = next.status;
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

  await doc.save();
  return doc.toObject();
}

export async function deleteStandardSpecification(companyId, id) {
  const doc = await StandardSpecification.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Standard specification not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
