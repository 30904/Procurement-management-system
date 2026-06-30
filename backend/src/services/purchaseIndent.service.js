import { PurchaseIndent } from "../models/PurchaseIndent.model.js";
import { AppError } from "../utils/AppError.js";
import { normalizePurchaseIndentMpbcdc } from "../utils/mpbcdcMasterFields.js";
import { enrichIndentProcurement } from "./purchaseIndentPoLink.service.js";
import {
  scopedListFilter,
  resolveTxnContext,
  nextDocNo,
  previewDocNo,
  assertLocationAccess,
} from "./transactionBase.service.js";

const DOC_MODULE = "PIND";
const DOC_PREFIX = "PIND";

function normalizeIndentLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new AppError("At least one line item is required", 400, "VALIDATION_ERROR");
  }
  return lines.map((row, i) => {
    const qty = Number(row.qty);
    const requiredDate = row.requiredDate ? new Date(row.requiredDate) : undefined;
    if (requiredDate && Number.isNaN(requiredDate.getTime())) {
      throw new AppError(`Invalid required date on line ${i + 1}`, 400, "VALIDATION_ERROR");
    }
    return {
      lineNo: i + 1,
      itemId: row.itemId || undefined,
      itemNo: String(row.itemNo ?? "").trim(),
      itemName: String(row.itemName ?? "").trim(),
      description: String(row.description ?? "").trim(),
      uom: String(row.uom ?? "").trim(),
      qty: Number.isFinite(qty) ? qty : 0,
      requiredDate,
      lineRemarks: String(row.lineRemarks ?? "").trim(),
    };
  });
}

function sumLineQty(lines) {
  return lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);
}

function validateIndentBody(body, scope) {
  if (!body?.indentDate) throw new AppError("Indent date is required", 400, "VALIDATION_ERROR");
  const indentDate = new Date(body.indentDate);
  if (Number.isNaN(indentDate.getTime())) {
    throw new AppError("Indent date is invalid", 400, "VALIDATION_ERROR");
  }

  const department = String(body.department ?? "").trim();
  if (!department) throw new AppError("Department is required", 400, "VALIDATION_ERROR");

  const requestedBy = String(body.requestedBy ?? "").trim();
  if (!requestedBy) throw new AppError("Requested by is required", 400, "VALIDATION_ERROR");

  const ctx = resolveTxnContext(body, scope);

  const rawLines = Array.isArray(body?.lines) ? body.lines : [];
  const lines = rawLines.filter((row) => Number(row.qty) > 0);
  if (!lines.length) {
    throw new AppError("At least one line item with quantity is required", 400, "VALIDATION_ERROR");
  }

  const normalized = normalizeIndentLines(lines);
  for (const row of normalized) {
    if (!Number.isFinite(row.qty) || row.qty <= 0) {
      throw new AppError(`Invalid quantity on line ${row.itemNo || row.lineNo}`, 400, "VALIDATION_ERROR");
    }
    if (!row.itemId && !row.itemNo) {
      throw new AppError(`Item is required on line ${row.lineNo}`, 400, "VALIDATION_ERROR");
    }
  }

  let requiredByDate;
  if (body.requiredByDate) {
    requiredByDate = new Date(body.requiredByDate);
    if (Number.isNaN(requiredByDate.getTime())) {
      throw new AppError("Required-by date is invalid", 400, "VALIDATION_ERROR");
    }
  }

  const priority = String(body.priority ?? "Normal").trim();
  if (!["Normal", "Urgent"].includes(priority)) {
    throw new AppError("Priority must be Normal or Urgent", 400, "VALIDATION_ERROR");
  }

  return { ctx, lines: normalized, indentDate, department, requestedBy, priority, requiredByDate };
}

function applyMpbcdcFields(target, body) {
  const mpbcdc = normalizePurchaseIndentMpbcdc(body);
  target.procurementInfo = mpbcdc.procurementInfo;
  target.budgetInfo = mpbcdc.budgetInfo;
  target.governanceInfo = mpbcdc.governanceInfo;
  target.approvalTracking = mpbcdc.approvalTracking;
}

export async function listPurchaseIndents(companyId, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = { $nin: ["Approved", "Cancelled"] };
  return PurchaseIndent.find(filter).sort({ indentDate: -1, indentNo: -1 }).lean();
}

export async function listApprovedPurchaseIndents(companyId, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = "Approved";
  const rows = await PurchaseIndent.find(filter).sort({ indentDate: -1, indentNo: -1 }).lean();
  return rows.map(enrichIndentProcurement);
}

export async function getPurchaseIndent(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseIndent.findOne(filter).lean();
  if (!doc) throw new AppError("Purchase indent not found", 404, "NOT_FOUND");
  return enrichIndentProcurement(doc);
}

export async function previewPurchaseIndentNo(companyId, scope) {
  const ctx = resolveTxnContext({}, scope);
  const code = await previewDocNo(companyId, DOC_MODULE, DOC_PREFIX, ctx.locationId);
  return { code };
}

export async function createPurchaseIndent(companyId, body, scope, userId) {
  const { ctx, lines, indentDate, department, requestedBy, priority, requiredByDate } =
    validateIndentBody(body, scope);

  const provisionalNo = `TMP-PIND-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const doc = await PurchaseIndent.create({
    company: companyId,
    locationId: ctx.locationId,
    subLocationId: ctx.subLocationId || undefined,
    indentNo: provisionalNo,
    indentDate,
    department,
    requestedBy,
    priority,
    requiredByDate,
    status: "Draft",
    lines,
    totalQty: sumLineQty(lines),
    remarks: String(body.remarks ?? "").trim(),
    ...normalizePurchaseIndentMpbcdc(body),
    createdBy: userId,
    updatedBy: userId,
  });

  try {
    const indentNo = await nextDocNo(companyId, DOC_MODULE, DOC_PREFIX, ctx.locationId);
    doc.indentNo = indentNo;
    await doc.save();
  } catch (err) {
    await PurchaseIndent.findByIdAndDelete(doc._id).catch(() => {});
    throw err;
  }

  return doc.toObject();
}

export async function updatePurchaseIndent(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseIndent.findOne(filter);
  if (!doc) throw new AppError("Purchase indent not found", 404, "NOT_FOUND");
  if (doc.status !== "Draft") {
    throw new AppError("Only draft purchase indents can be edited", 400, "INVALID_STATUS");
  }

  if (body.locationId) doc.locationId = assertLocationAccess(scope, body.locationId);
  if (body.subLocationId !== undefined) doc.subLocationId = body.subLocationId || undefined;

  const merged = {
    indentDate: body.indentDate ?? doc.indentDate,
    department: body.department ?? doc.department,
    requestedBy: body.requestedBy ?? doc.requestedBy,
    priority: body.priority ?? doc.priority,
    requiredByDate: body.requiredByDate !== undefined ? body.requiredByDate : doc.requiredByDate,
    remarks: body.remarks !== undefined ? body.remarks : doc.remarks,
    lines: body.lines !== undefined ? body.lines : doc.lines,
    locationId: doc.locationId,
  };

  const { lines, indentDate, department, requestedBy, priority, requiredByDate } = validateIndentBody(
    merged,
    scope
  );

  doc.indentDate = indentDate;
  doc.department = department;
  doc.requestedBy = requestedBy;
  doc.priority = priority;
  doc.requiredByDate = requiredByDate;
  doc.lines = lines;
  doc.totalQty = sumLineQty(lines);
  doc.remarks = String(merged.remarks ?? "").trim();
  applyMpbcdcFields(doc, body);
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function deletePurchaseIndent(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await PurchaseIndent.findOneAndDelete(filter);
  if (!doc) throw new AppError("Draft purchase indent not found", 404, "NOT_FOUND");
  return { deleted: true, id: doc._id };
}

export async function approvePurchaseIndent(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseIndent.findOne(filter);
  if (!doc) throw new AppError("Purchase indent not found", 404, "NOT_FOUND");
  if (doc.status !== "Draft") {
    throw new AppError("Only draft purchase indents can be approved", 400, "INVALID_STATUS");
  }
  doc.status = "Approved";
  if (!doc.approvalTracking) doc.approvalTracking = {};
  doc.approvalTracking.approvalStatus = "Approved";
  doc.updatedBy = userId;
  await doc.save();
  return enrichIndentProcurement(doc.toObject());
}

export async function cancelPurchaseIndent(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseIndent.findOne(filter);
  if (!doc) throw new AppError("Purchase indent not found", 404, "NOT_FOUND");
  if (doc.status !== "Draft") {
    throw new AppError("Only draft purchase indents can be cancelled", 400, "INVALID_STATUS");
  }
  doc.status = "Cancelled";
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}
