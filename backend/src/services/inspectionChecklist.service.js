import { INSPECTION_CHECKLIST_AUTO_MODULE } from "../config/inspectionChecklist.js";
import { InspectionChecklist } from "../models/InspectionChecklist.model.js";
import { allocateNextCode, previewNextCode } from "./autoIncrement.service.js";
import { AppError } from "../utils/AppError.js";

function parseDisplayOrder(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new AppError("Display order must be zero or greater", 400, "VALIDATION_ERROR");
  }
  return Math.trunc(n);
}

function normalizeComparable(val) {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val.trim();
  return val;
}

function buildChangeSet(doc, data) {
  const next = {
    checklistItem:
      data.checklistItem !== undefined
        ? String(data.checklistItem).trim()
        : doc.checklistItem,
    displayOrder:
      data.displayOrder !== undefined
        ? parseDisplayOrder(data.displayOrder, doc.displayOrder ?? 0)
        : doc.displayOrder,
    status:
      data.status !== undefined
        ? data.status === "Inactive"
          ? "Inactive"
          : "Active"
        : doc.status,
  };

  const fields = ["checklistItem", "displayOrder", "status"];
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
  const checklistItem = String(data?.checklistItem ?? "").trim();
  if (!checklistItem) {
    throw new AppError("Inspection checklist item is required", 400, "VALIDATION_ERROR");
  }
  return {
    checklistItem,
    displayOrder: parseDisplayOrder(data?.displayOrder, 0),
    status: data?.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function previewInspectionChecklistId(companyId) {
  return previewNextCode(companyId, INSPECTION_CHECKLIST_AUTO_MODULE);
}

export async function listInspectionChecklists(companyId) {
  return InspectionChecklist.find({ company: companyId })
    .sort({ displayOrder: 1, checklistId: 1 })
    .lean();
}

export async function getInspectionChecklist(companyId, id) {
  const doc = await InspectionChecklist.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Inspection checklist not found", 404, "NOT_FOUND");
  return doc;
}

export async function createInspectionChecklist(companyId, data) {
  const payload = validateCreatePayload(data);
  const checklistId = await allocateNextCode(companyId, INSPECTION_CHECKLIST_AUTO_MODULE);

  const existing = await InspectionChecklist.findOne({ company: companyId, checklistId });
  if (existing) {
    throw new AppError(`Checklist ID "${checklistId}" already exists`, 409, "DUPLICATE");
  }

  const doc = await InspectionChecklist.create({
    company: companyId,
    checklistId,
    ...payload,
    revNumber: 0,
  });

  return doc.toObject();
}

export async function updateInspectionChecklist(companyId, id, data, actor) {
  const doc = await InspectionChecklist.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Inspection checklist not found", 404, "NOT_FOUND");

  if (data.checklistItem !== undefined && !String(data.checklistItem).trim()) {
    throw new AppError("Inspection checklist item is required", 400, "VALIDATION_ERROR");
  }

  const { next, changes } = buildChangeSet(doc, data ?? {});
  if (changes.length === 0) {
    return doc.toObject();
  }

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  doc.checklistItem = next.checklistItem;
  doc.displayOrder = next.displayOrder;
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

export async function deleteInspectionChecklist(companyId, id) {
  const doc = await InspectionChecklist.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Inspection checklist not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
