import { Rfq } from "../models/Rfq.model.js";
import { AppError } from "../utils/AppError.js";
import {
  scopedListFilter,
  resolveTxnContext,
  nextDocNo,
  previewDocNo,
  assertLocationAccess,
} from "./transactionBase.service.js";

const DOC_MODULE = "RFQ";
const DOC_PREFIX = "RFQ";

const RFQ_STATUSES = ["Draft", "Submitted", "Open", "Closed", "Cancelled", "Awarded", "Expired"];

function parseDate(value, label) {
  if (value === undefined || value === null || value === "") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid ${label}`, 400, "VALIDATION_ERROR");
  }
  return d;
}

function normalizeVendors(vendors) {
  if (!Array.isArray(vendors)) return [];
  return vendors
    .filter((v) => v && (v.supplierId || v.supplierName))
    .map((v) => ({
      supplierId: v.supplierId || undefined,
      supplierCode: String(v.supplierCode ?? "").trim(),
      supplierName: String(v.supplierName ?? "").trim(),
      preferred: Boolean(v.preferred),
      sourceListCode: String(v.sourceListCode ?? "").trim(),
      vendorRating: Number(v.vendorRating) || 0,
      msme: String(v.msme ?? "").trim(),
      gemRegistered: String(v.gemRegistered ?? "").trim(),
      contactPerson: String(v.contactPerson ?? "").trim(),
      email: String(v.email ?? "").trim(),
      mobile: String(v.mobile ?? "").trim(),
    }));
}

function normalizeLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new AppError("At least one line item is required", 400, "VALIDATION_ERROR");
  }
  return lines.map((row, i) => {
    const qty = Number(row.qty);
    if (Number.isNaN(qty) || qty <= 0) {
      throw new AppError(`Invalid quantity on line ${i + 1}`, 400, "VALIDATION_ERROR");
    }
    const lineType = row.lineType === "Service" ? "Service" : "Material";
    const expectedDelivery = parseDate(row.expectedDelivery, `expected delivery on line ${i + 1}`);
    return {
      lineNo: i + 1,
      lineType,
      itemId: lineType === "Material" ? row.itemId || undefined : undefined,
      itemNo: String(row.itemNo ?? "").trim(),
      itemName: String(row.itemName ?? "").trim(),
      serviceId: lineType === "Service" ? row.serviceId || undefined : undefined,
      serviceCode: String(row.serviceCode ?? "").trim(),
      serviceName: String(row.serviceName ?? "").trim(),
      description: String(row.description ?? "").trim(),
      uom: String(row.uom ?? "").trim(),
      qty,
      expectedDelivery,
      technicalSpecification: String(row.technicalSpecification ?? "").trim(),
      drawingReference: String(row.drawingReference ?? "").trim(),
      attachmentNote: String(row.attachmentNote ?? "").trim(),
      lineRemarks: String(row.lineRemarks ?? "").trim(),
    };
  });
}

function sumLineQty(lines) {
  return lines.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
}

function validateRfqBody(body, scope) {
  const ctx = resolveTxnContext(body, scope);
  const rfqDate = parseDate(body.rfqDate ?? new Date(), "RFQ date") || new Date();
  const requiredDeliveryDate = parseDate(body.requiredDeliveryDate, "required delivery date");
  const closingDate = parseDate(body.closingDate, "closing date");
  const vendors = normalizeVendors(body.vendors);
  if (!vendors.length) {
    throw new AppError("At least one vendor is required", 400, "VALIDATION_ERROR");
  }
  const lines = normalizeLines(body.lines);
  return {
    ctx,
    rfqDate,
    rfqType: String(body.rfqType ?? "Material").trim() || "Material",
    department: String(body.department ?? "").trim(),
    procurementCategory: String(body.procurementCategory ?? "").trim(),
    purchaseType: String(body.purchaseType ?? "").trim(),
    currency: String(body.currency ?? "INR").trim() || "INR",
    referencePrId: body.referencePrId || undefined,
    referencePrNo: String(body.referencePrNo ?? "").trim(),
    referencePlanningRef: String(body.referencePlanningRef ?? "").trim(),
    requiredDeliveryDate,
    closingDate,
    buyer: String(body.buyer ?? "").trim(),
    vendors,
    lines,
    remarks: String(body.remarks ?? "").trim(),
    terms: String(body.terms ?? "").trim(),
  };
}

function enrichRfq(doc) {
  const obj = doc?.toObject ? doc.toObject() : { ...doc };
  const createdBy = obj.createdBy;
  let createdByName = obj.buyer || "";
  if (createdBy && typeof createdBy === "object") {
    createdByName =
      createdBy.name || createdBy.userName || createdBy.userEmail || createdByName || "";
  }
  obj.vendorCount = Array.isArray(obj.vendors) ? obj.vendors.length : 0;
  obj.createdByName = createdByName;
  obj.displayStatus = resolveDisplayStatus(obj);
  return obj;
}

function resolveDisplayStatus(doc) {
  const status = doc.status || "Draft";
  if (status === "Open" && doc.closingDate) {
    const closing = new Date(doc.closingDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (!Number.isNaN(closing.getTime()) && closing < today) {
      return "Expired";
    }
  }
  return status;
}

export async function previewRfqNo(companyId, scope) {
  const ctx = resolveTxnContext({}, scope);
  const code = await previewDocNo(companyId, DOC_MODULE, DOC_PREFIX, ctx.locationId);
  return { code };
}

export async function listRfqs(companyId, scope) {
  const filter = scopedListFilter(companyId, scope);
  const docs = await Rfq.find(filter)
    .sort({ rfqDate: -1, createdAt: -1 })
    .populate("createdBy", "name userName userEmail")
    .lean();
  return docs.map(enrichRfq);
}

export async function getRfq(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await Rfq.findOne(filter)
    .populate("createdBy", "name userName userEmail")
    .lean();
  if (!doc) throw new AppError("RFQ not found", 404, "NOT_FOUND");
  return enrichRfq(doc);
}

export async function createRfq(companyId, body, scope, userId) {
  const validated = validateRfqBody(body, scope);
  const { ctx, ...fields } = validated;

  const provisionalNo = `TMP-RFQ-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const doc = await Rfq.create({
    company: companyId,
    locationId: ctx.locationId,
    subLocationId: ctx.subLocationId || undefined,
    rfqNo: provisionalNo,
    ...fields,
    status: "Draft",
    totalQty: sumLineQty(fields.lines),
    createdBy: userId,
    updatedBy: userId,
  });

  try {
    const rfqNo = await nextDocNo(companyId, DOC_MODULE, DOC_PREFIX, ctx.locationId);
    doc.rfqNo = rfqNo;
    await doc.save();
  } catch (err) {
    await Rfq.findByIdAndDelete(doc._id).catch(() => {});
    throw err;
  }

  return enrichRfq(await doc.populate("createdBy", "name userName userEmail"));
}

export async function updateRfq(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await Rfq.findOne(filter);
  if (!doc) throw new AppError("RFQ not found", 404, "NOT_FOUND");
  if (doc.status !== "Draft") {
    throw new AppError("Only draft RFQs can be edited", 400, "INVALID_STATUS");
  }

  if (body.locationId) doc.locationId = assertLocationAccess(scope, body.locationId);
  if (body.subLocationId !== undefined) doc.subLocationId = body.subLocationId || undefined;

  const merged = {
    rfqDate: body.rfqDate ?? doc.rfqDate,
    rfqType: body.rfqType ?? doc.rfqType,
    department: body.department ?? doc.department,
    procurementCategory: body.procurementCategory ?? doc.procurementCategory,
    purchaseType: body.purchaseType ?? doc.purchaseType,
    currency: body.currency ?? doc.currency,
    referencePrId: body.referencePrId !== undefined ? body.referencePrId : doc.referencePrId,
    referencePrNo: body.referencePrNo !== undefined ? body.referencePrNo : doc.referencePrNo,
    referencePlanningRef:
      body.referencePlanningRef !== undefined ? body.referencePlanningRef : doc.referencePlanningRef,
    requiredDeliveryDate:
      body.requiredDeliveryDate !== undefined ? body.requiredDeliveryDate : doc.requiredDeliveryDate,
    closingDate: body.closingDate !== undefined ? body.closingDate : doc.closingDate,
    buyer: body.buyer !== undefined ? body.buyer : doc.buyer,
    vendors: body.vendors !== undefined ? body.vendors : doc.vendors,
    lines: body.lines !== undefined ? body.lines : doc.lines,
    remarks: body.remarks !== undefined ? body.remarks : doc.remarks,
    terms: body.terms !== undefined ? body.terms : doc.terms,
    locationId: doc.locationId,
  };

  const validated = validateRfqBody(merged, scope);
  Object.assign(doc, {
    rfqDate: validated.rfqDate,
    rfqType: validated.rfqType,
    department: validated.department,
    procurementCategory: validated.procurementCategory,
    purchaseType: validated.purchaseType,
    currency: validated.currency,
    referencePrId: validated.referencePrId,
    referencePrNo: validated.referencePrNo,
    referencePlanningRef: validated.referencePlanningRef,
    requiredDeliveryDate: validated.requiredDeliveryDate,
    closingDate: validated.closingDate,
    buyer: validated.buyer,
    vendors: validated.vendors,
    lines: validated.lines,
    remarks: validated.remarks,
    terms: validated.terms,
    totalQty: sumLineQty(validated.lines),
  });
  doc.updatedBy = userId;
  await doc.save();
  return enrichRfq(await doc.populate("createdBy", "name userName userEmail"));
}

export async function deleteRfq(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await Rfq.findOneAndDelete(filter);
  if (!doc) throw new AppError("Draft RFQ not found", 404, "NOT_FOUND");
  return { deleted: true, id: doc._id };
}

async function transitionStatus(companyId, id, scope, userId, fromStatuses, toStatus) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = { $in: fromStatuses };
  const doc = await Rfq.findOne(filter);
  if (!doc) {
    throw new AppError(`RFQ not found or cannot transition to ${toStatus}`, 400, "INVALID_STATUS");
  }
  doc.status = toStatus;
  doc.updatedBy = userId;
  await doc.save();
  return enrichRfq(await doc.populate("createdBy", "name userName userEmail"));
}

export async function submitRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Draft"], "Submitted");
}

export async function openRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Submitted"], "Open");
}

export async function closeRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Open"], "Closed");
}

export async function awardRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Open", "Closed"], "Awarded");
}

export async function cancelRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Draft", "Submitted", "Open"], "Cancelled");
}

export async function expireRfq(companyId, id, scope, userId) {
  return transitionStatus(companyId, id, scope, userId, ["Open"], "Expired");
}

export { RFQ_STATUSES, resolveDisplayStatus };
