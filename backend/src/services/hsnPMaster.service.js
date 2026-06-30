import { HsnPMaster } from "../models/HsnPMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { normalizeTaxMasterMpbcdc } from "../utils/mpbcdcMasterFields.js";

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

function buildChangeSet(doc, data) {
  const next = {
    hsnCode: data.hsnCode !== undefined ? String(data.hsnCode).trim() : doc.hsnCode,
    description:
      data.description !== undefined ? String(data.description).trim() : doc.description,
    gstRate: data.gstRate !== undefined ? parseRate(data.gstRate, "GST Rate") : doc.gstRate,
    igstRate:
      data.igstRate !== undefined ? parseRate(data.igstRate, "IGST Rate") : doc.igstRate,
    sgstRate:
      data.sgstRate !== undefined ? parseRate(data.sgstRate, "SGST Rate") : doc.sgstRate,
    cgstRate:
      data.cgstRate !== undefined ? parseRate(data.cgstRate, "CGST Rate") : doc.cgstRate,
    utgstRate:
      data.utgstRate !== undefined ? parseRate(data.utgstRate, "UTGST Rate") : doc.utgstRate,
    status:
      data.status !== undefined
        ? data.status === "Inactive"
          ? "Inactive"
          : "Active"
        : doc.status,
  };

  const fields = [
    "hsnCode",
    "description",
    "gstRate",
    "igstRate",
    "sgstRate",
    "cgstRate",
    "utgstRate",
    "status",
  ];

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

export async function listHsnPMasters(companyId) {
  return HsnPMaster.find({ company: companyId })
    .sort({ hsnCode: 1 })
    .lean();
}

export async function createHsnPMaster(companyId, data) {
  const hsnCode = String(data.hsnCode ?? "").trim();
  if (!hsnCode) {
    throw new AppError("HSN Code is required", 400, "VALIDATION_ERROR");
  }

  const existing = await HsnPMaster.findOne({ company: companyId, hsnCode });
  if (existing) {
    throw new AppError(`HSN Code "${hsnCode}" already exists`, 409, "DUPLICATE");
  }

  const doc = await HsnPMaster.create({
    company: companyId,
    hsnCode,
    description: String(data.description ?? "").trim(),
    gstRate: parseRate(data.gstRate ?? 0, "GST Rate"),
    igstRate: parseRate(data.igstRate ?? 0, "IGST Rate"),
    sgstRate: parseRate(data.sgstRate ?? 0, "SGST Rate"),
    cgstRate: parseRate(data.cgstRate ?? 0, "CGST Rate"),
    utgstRate: parseRate(data.utgstRate ?? 0, "UTGST Rate"),
    revNumber: Math.max(0, parseInt(data.revNumber, 10) || 0),
    status: data.status === "Inactive" ? "Inactive" : "Active",
    mpbcdcTax: normalizeTaxMasterMpbcdc(data),
  });

  return doc.toObject();
}

export async function updateHsnPMaster(companyId, id, data, actor) {
  const doc = await HsnPMaster.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("HSN/P record not found", 404, "NOT_FOUND");
  }

  if (data.hsnCode !== undefined) {
    const hsnCode = String(data.hsnCode).trim();
    if (!hsnCode) {
      throw new AppError("HSN Code is required", 400, "VALIDATION_ERROR");
    }
    const dup = await HsnPMaster.findOne({
      company: companyId,
      hsnCode,
      _id: { $ne: id },
    });
    if (dup) {
      throw new AppError(`HSN Code "${hsnCode}" already exists`, 409, "DUPLICATE");
    }
  }

  const { next, changes } = buildChangeSet(doc, data ?? {});
  if (changes.length === 0) {
    return doc.toObject();
  }

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  doc.hsnCode = next.hsnCode;
  doc.description = next.description;
  doc.gstRate = next.gstRate;
  doc.igstRate = next.igstRate;
  doc.sgstRate = next.sgstRate;
  doc.cgstRate = next.cgstRate;
  doc.utgstRate = next.utgstRate;
  doc.status = next.status;
  doc.mpbcdcTax = normalizeTaxMasterMpbcdc(data);
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

export async function deleteHsnPMaster(companyId, id) {
  const doc = await HsnPMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("HSN/P record not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
