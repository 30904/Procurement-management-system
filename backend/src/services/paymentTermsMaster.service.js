import { PaymentTermsMaster } from "../models/PaymentTermsMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { normalizePaymentTermsMpbcdc } from "../utils/mpbcdcMasterFields.js";

const CODE_PREFIX = "PTS";
const CODE_DIGITS = 4;

function normalizeComparable(val) {
  if (val === undefined) return undefined;
  if (typeof val === "string") return val.trim();
  return val;
}

function parseDisplayOrder(value, fieldName = "Order") {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new AppError(`${fieldName} must be a non-negative number`, 400, "VALIDATION_ERROR");
  }
  return Math.floor(n);
}

function buildChangeSet(doc, data) {
  const next = {
    paymentTermsCode:
      data.paymentTermsCode !== undefined
        ? String(data.paymentTermsCode).trim().toUpperCase()
        : doc.paymentTermsCode,
    displayOrder:
      data.order !== undefined
        ? parseDisplayOrder(data.order, "Order")
        : data.displayOrder !== undefined
          ? parseDisplayOrder(data.displayOrder, "Order")
          : doc.displayOrder,
    description:
      data.description !== undefined ? String(data.description).trim() : doc.description,
    status:
      data.status !== undefined
        ? data.status === "Inactive"
          ? "Inactive"
          : "Active"
        : doc.status,
  };

  const fields = ["paymentTermsCode", "displayOrder", "description", "status"];
  const changes = [];
  for (const field of fields) {
    const previous = normalizeComparable(doc[field]);
    const current = normalizeComparable(next[field]);
    if (previous !== current) {
      changes.push({
        field: field === "displayOrder" ? "order" : field,
        from: previous,
        to: current,
      });
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

export async function getNextPaymentTermsCode(companyId) {
  const regex = new RegExp(`^${CODE_PREFIX}\\d{${CODE_DIGITS}}$`, "i");
  const latest = await PaymentTermsMaster.findOne({
    company: companyId,
    paymentTermsCode: regex,
  })
    .sort({ paymentTermsCode: -1 })
    .select({ paymentTermsCode: 1 })
    .lean();

  let nextNum = 1;
  if (latest?.paymentTermsCode) {
    const suffix = Number(String(latest.paymentTermsCode).slice(CODE_PREFIX.length));
    if (Number.isFinite(suffix)) nextNum = suffix + 1;
  }

  return `${CODE_PREFIX}${String(nextNum).padStart(CODE_DIGITS, "0")}`;
}

export async function listPaymentTermsMasters(companyId) {
  return PaymentTermsMaster.find({ company: companyId })
    .sort({ displayOrder: 1, paymentTermsCode: 1 })
    .lean();
}

export async function createPaymentTermsMaster(companyId, data) {
  const paymentTermsCode = String(data.paymentTermsCode ?? "").trim().toUpperCase();
  if (!paymentTermsCode) {
    throw new AppError("Payment Terms Code is required", 400, "VALIDATION_ERROR");
  }

  const description = String(data.description ?? "").trim();
  if (!description) {
    throw new AppError("Payment Terms Description is required", 400, "VALIDATION_ERROR");
  }

  const existing = await PaymentTermsMaster.findOne({ company: companyId, paymentTermsCode });
  if (existing) {
    throw new AppError(`Payment Terms Code "${paymentTermsCode}" already exists`, 409, "DUPLICATE");
  }

  const doc = await PaymentTermsMaster.create({
    company: companyId,
    paymentTermsCode,
    displayOrder: parseDisplayOrder(data.order ?? data.displayOrder ?? 0, "Order"),
    description,
    revNumber: 0,
    status: data.status === "Inactive" ? "Inactive" : "Active",
    mpbcdcPaymentTerms: normalizePaymentTermsMpbcdc(data),
  });

  return doc.toObject();
}

export async function updatePaymentTermsMaster(companyId, id, data, actor) {
  const doc = await PaymentTermsMaster.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Payment Terms record not found", 404, "NOT_FOUND");
  }

  if (data.paymentTermsCode !== undefined) {
    const paymentTermsCode = String(data.paymentTermsCode).trim().toUpperCase();
    if (!paymentTermsCode) {
      throw new AppError("Payment Terms Code is required", 400, "VALIDATION_ERROR");
    }
    const dup = await PaymentTermsMaster.findOne({
      company: companyId,
      paymentTermsCode,
      _id: { $ne: id },
    });
    if (dup) {
      throw new AppError(`Payment Terms Code "${paymentTermsCode}" already exists`, 409, "DUPLICATE");
    }
  }

  const { next, changes } = buildChangeSet(doc, data ?? {});
  if (changes.length === 0) {
    return doc.toObject();
  }

  if (!data?.revisionInfo) {
    throw new AppError("Revision information is required to save changes", 400, "VALIDATION_ERROR");
  }

  const revision = parseRevisionInfo(data.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;

  doc.paymentTermsCode = next.paymentTermsCode;
  doc.displayOrder = next.displayOrder;
  doc.description = next.description;
  doc.status = next.status;
  doc.mpbcdcPaymentTerms = normalizePaymentTermsMpbcdc(data);
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

export async function deletePaymentTermsMaster(companyId, id) {
  const doc = await PaymentTermsMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Payment Terms record not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
