import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { GoodsReceipt } from "../models/GoodsReceipt.model.js";
import { PurchaseInvoice } from "../models/PurchaseInvoice.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { Location } from "../models/Location.model.js";
import { AppError } from "../utils/AppError.js";
import { adjustStock } from "./stock.service.js";
import {
  linkPurchaseOrderToIndents,
  syncIndentLinksForPoStatus,
} from "./purchaseIndentPoLink.service.js";
import {
  normalizeGoodsReceiptMpbcdc,
  normalizePurchaseOrderMpbcdc,
} from "../utils/mpbcdcMasterFields.js";
import {
  normalizeLines,
  sumLines,
  scopedListFilter,
  resolveTxnContext,
  nextDocNo,
  previewDocNo,
  assertLocationAccess,
} from "./transactionBase.service.js";
import { auditLocationOnUpdate } from "./locationAudit.service.js";
import { toObjectId } from "../utils/locationScope.js";
import {
  enrichPoLine,
  derivePoGrnStatus,
  derivePoHeaderStatusFromGrn,
  lineMatchKey,
} from "../utils/poLineFulfillment.js";
import {
  getPoTermsSnapshotForCompany,
  mergePoTermsWithSnapshot,
} from "./poTermsConfig.service.js";
import { getEffectiveGstin } from "./locationScope.service.js";
import {
  computePurchaseOrderGst,
  primarySupplierState,
} from "../utils/poGstCalculation.js";
import { assertDomesticPoSupplier } from "../utils/domesticSupplier.js";
import { assertImportPoSupplier } from "../utils/importSupplier.js";
import { buildAmendmentChangeSummary } from "../utils/purchaseOrderAmendment.js";

function normalizePoLines(lines, { resetFulfillment = false } = {}) {
  const base = normalizeLines(lines);
  return base.map((row, index) => {
    const qty = Number(row.qty) || 0;
    const receivedQty = resetFulfillment ? 0 : Number(row.receivedQty) || 0;
    const cancelledQty = resetFulfillment ? 0 : Number(row.cancelledQty) || 0;
    return enrichPoLine({
      ...row,
      lineNo: row.lineNo || index + 1,
      qty,
      receivedQty,
      cancelledQty,
    });
  });
}

function validatePoLineFulfillment(lines) {
  for (const line of lines) {
    const qty = Number(line.qty) || 0;
    const received = Number(line.receivedQty) || 0;
    const cancelled = Number(line.cancelledQty) || 0;
    if (received + cancelled > qty + 0.0001) {
      throw new AppError(
        `Received + cancelled qty cannot exceed PO qty on line ${line.itemNo || line.lineNo}`,
        400,
        "VALIDATION_ERROR"
      );
    }
  }
}

async function applyGrnToPurchaseOrder(poId, grnLines, userId) {
  const po = await PurchaseOrder.findById(poId);
  if (!po) return null;

  const byKey = new Map();
  for (const line of po.lines) {
    byKey.set(lineMatchKey(line), line);
  }

  for (const gl of grnLines) {
    const recv = Number(gl.qty) || 0;
    if (recv <= 0) continue;
    let pl =
      byKey.get(lineMatchKey(gl)) ||
      po.lines.find((l) => l.itemId && gl.itemId && String(l.itemId) === String(gl.itemId));
    if (!pl) continue;
    pl.receivedQty = (Number(pl.receivedQty) || 0) + recv;
  }

  po.lines = po.lines.map((line) => enrichPoLine(line.toObject?.() ?? line));
  validatePoLineFulfillment(po.lines);
  po.grnStatus = derivePoGrnStatus(po.lines);
  const baseStatus = po.status === "Draft" ? "Approved" : po.status;
  if (po.status !== "Cancelled") {
    po.status = derivePoHeaderStatusFromGrn(baseStatus, po.grnStatus);
  }
  po.updatedBy = userId;
  await po.save();
  return po.toObject();
}

async function resolveSupplier(companyId, supplierId) {
  const sup = await SupplierMaster.findOne({ _id: supplierId, company: companyId }).lean();
  if (!sup) throw new AppError("Supplier not found", 404, "NOT_FOUND");
  return {
    supplierId: sup._id,
    supplierName: sup.supplierName || "",
    gstin: String(sup.gstin || "").trim(),
    state: primarySupplierState(sup),
  };
}

async function resolveBuyerGstContext(companyId, poLocationId, poTerms) {
  const shipToId = poTerms?.shipToLocationId;
  const locId = shipToId || poLocationId;
  const loc = await Location.findOne({ _id: locId, company: companyId }).lean();
  if (!loc) return { buyerGstin: "", buyerState: "" };

  let buyerGstin = await getEffectiveGstin(companyId, loc._id);
  if (!buyerGstin) {
    buyerGstin = String(loc.gstin || "").trim();
  }
  if (!buyerGstin && loc.usesCompanyGstin) {
    const central = await Location.findOne({
      company: companyId,
      isCentral: true,
      isActive: { $ne: false },
    })
      .select({ gstin: 1 })
      .lean();
    buyerGstin = String(central?.gstin || "").trim();
  }
  return {
    buyerGstin,
    buyerState: String(loc.state || "").trim(),
  };
}

function applyGstFieldsToLines(lines, gstComputedLines) {
  return lines.map((line, index) => {
    const tax = gstComputedLines[index];
    if (!tax) return line;
    return {
      ...line,
      amount: tax.taxableAmount ?? line.amount,
      taxableAmount: tax.taxableAmount ?? line.amount,
      igstRate: tax.igstRate ?? 0,
      igstAmt: tax.igstAmt ?? 0,
      cgstRate: tax.cgstRate ?? 0,
      cgstAmt: tax.cgstAmt ?? 0,
      sgstRate: tax.sgstRate ?? 0,
      sgstAmt: tax.sgstAmt ?? 0,
      totalTax: tax.totalTax ?? 0,
    };
  });
}

function poValueFromGstResult(gstResult) {
  const { lines: _lines, ...poValue } = gstResult;
  return poValue;
}

// —— Purchase Order ——

export async function listPurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = { $nin: ["Approved", "Cancelled"] };
  const poChannel = String(query.poChannel ?? "").trim().toLowerCase();
  if (poChannel === "domestic") {
    filter["poTerms.poChannel"] = "domestic";
  } else if (poChannel === "import") {
    filter["poTerms.poChannel"] = "import";
  } else {
    filter["poTerms.poChannel"] = { $nin: ["domestic", "import"] };
  }
  return PurchaseOrder.find(filter).sort({ poDate: -1, poNo: -1 }).lean();
}

function parseReportDate(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function gstAmountFromPoValue(poValue = {}) {
  const totalTax = Number(poValue.totalTax);
  if (Number.isFinite(totalTax) && totalTax > 0) return totalTax;
  return (
    (Number(poValue.totalIgst) || 0) +
    (Number(poValue.totalCgst) || 0) +
    (Number(poValue.totalSgst) || 0)
  );
}

function mapPoReportRow(doc) {
  const poValue = doc.poValue && typeof doc.poValue === "object" ? doc.poValue : {};
  const status = doc.status || "Draft";
  const grnStatus = doc.grnStatus || "Not Started";
  let displayStatus = status;
  if (status === "Approved") {
    if (grnStatus === "Partial") displayStatus = "GRN Partial Created";
    else if (grnStatus === "Complete") displayStatus = "GRN Complete";
    else if (grnStatus === "Short Closed") displayStatus = "Short Closed";
    else displayStatus = "Report Generated";
  } else if (status === "Closed") {
    displayStatus = "Closed";
  } else if (status === "Cancelled") {
    displayStatus = "Cancelled";
  }

  return {
    _id: doc._id,
    poNo: doc.poNo,
    poDate: doc.poDate,
    supplierId: doc.supplierId,
    supplierName: doc.supplierName || "",
    currency: doc.currency || "INR",
    taxableAmount: Number(poValue.totalTaxable) || 0,
    gstAmount: gstAmountFromPoValue(poValue),
    totalPoValue: Number(poValue.totalPoValue) || Number(doc.totalAmount) || 0,
    orderReferenceNo: doc.orderReferenceNo || "",
    status: displayStatus,
    approvalStatus: status,
    grnStatus,
    purchaseType: doc.procurementReference?.purchaseType || "",
    procurementCategory: doc.procurementReference?.procurementCategory || "",
    mpbcdcApprovalStatus: doc.approvalTracking?.approvalStatus || "",
    gemPurchase: doc.governmentProcurement?.gemPurchase || "",
    tenderPurchase: doc.governmentProcurement?.tenderPurchase || "",
  };
}

/** Paginated PO register for Reports → Purchase Order (all statuses). */
export async function listPurchaseOrderReport(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  /** Report register: approved/processed POs only (exclude draft and cancelled). */
  filter.status = { $nin: ["Draft", "Cancelled"] };
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || 25));
  const search = String(query.search ?? "").trim();

  const from = parseReportDate(query.fromDate, false);
  const to = parseReportDate(query.toDate, true);
  if (from || to) {
    filter.poDate = {};
    if (from) filter.poDate.$gte = from;
    if (to) filter.poDate.$lte = to;
  }

  if (query.supplierId) {
    filter.supplierId = query.supplierId;
  }

  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ poNo: re }, { supplierName: re }, { orderReferenceNo: re }];
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    PurchaseOrder.find(filter).sort({ poDate: -1, poNo: -1 }).skip(skip).limit(pageSize).lean(),
    PurchaseOrder.countDocuments(filter),
  ]);

  const totalsAgg = await PurchaseOrder.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTaxable: {
          $sum: { $ifNull: ["$poValue.totalTaxable", 0] },
        },
        totalGst: {
          $sum: {
            $add: [
              { $ifNull: ["$poValue.totalIgst", 0] },
              { $ifNull: ["$poValue.totalCgst", 0] },
              { $ifNull: ["$poValue.totalSgst", 0] },
            ],
          },
        },
        totalPoValue: {
          $sum: {
            $ifNull: ["$poValue.totalPoValue", { $ifNull: ["$totalAmount", 0] }],
          },
        },
      },
    },
  ]);

  const totalsRow = totalsAgg[0] || {};
  return {
    items: docs.map(mapPoReportRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    totals: {
      totalTaxable: Number(totalsRow.totalTaxable) || 0,
      totalGst: Number(totalsRow.totalGst) || 0,
      totalPoValue: Number(totalsRow.totalPoValue) || 0,
    },
  };
}

function parseLineDeliveryDate(eddRaw) {
  const str = String(eddRaw ?? "").trim();
  if (!str) return null;
  if (str.startsWith("{")) {
    try {
      const parsed = JSON.parse(str);
      const schedules = parsed?.schedules;
      if (Array.isArray(schedules) && schedules.length) {
        const first = schedules.find((s) => s?.deliveryDate) || schedules[0];
        const raw = first?.deliveryDate;
        if (!raw) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    } catch {
      /* plain date below */
    }
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapItemWisePoReportRow(entry) {
  const line = entry.line || {};
  return {
    _id: `${entry._id}_${line.lineNo ?? 0}`,
    poId: entry._id,
    poNo: entry.poNo,
    poDate: entry.poDate,
    deliveryDate: parseLineDeliveryDate(line.edd),
    supplierName: entry.supplierName || "",
    itemId: line.itemId,
    itemNo: line.itemNo || "",
    itemName: line.itemName || "",
    itemDescription: line.description || "",
    uom: line.uom || "",
    poQty: Number(line.qty) || 0,
    poRate: Number(line.rate) || 0,
  };
}

function buildItemWisePoReportMatch(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = { $nin: ["Draft", "Cancelled"] };

  const from = parseReportDate(query.fromDate, false);
  const to = parseReportDate(query.toDate, true);
  if (from || to) {
    filter.poDate = {};
    if (from) filter.poDate.$gte = from;
    if (to) filter.poDate.$lte = to;
  }

  const pipeline = [{ $match: filter }, { $unwind: "$lines" }, { $match: { "lines.qty": { $gt: 0 } } }];

  const itemOid = toObjectId(query.itemId);
  if (itemOid) {
    pipeline.push({ $match: { "lines.itemId": itemOid } });
  }

  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    pipeline.push({
      $match: {
        $or: [
          { poNo: re },
          { supplierName: re },
          { "lines.itemNo": re },
          { "lines.itemName": re },
          { "lines.description": re },
        ],
      },
    });
  }

  return pipeline;
}

/** Paginated PO lines for Reports → Item Wise PO. */
export async function listItemWisePoReport(companyId, scope, query = {}) {
  if (query.itemId && !toObjectId(query.itemId)) {
    return {
      items: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
    };
  }

  const forExport = query.export === "1" || query.export === "true";
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = forExport
    ? 10000
    : Math.min(100, Math.max(5, Number(query.pageSize) || 25));
  const skip = (page - 1) * pageSize;

  const pipeline = buildItemWisePoReportMatch(companyId, scope, query);
  pipeline.push({ $sort: { poDate: -1, poNo: -1, "lines.lineNo": 1 } });
  pipeline.push({
    $facet: {
      items: [
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            poNo: 1,
            poDate: 1,
            supplierName: 1,
            line: "$lines",
          },
        },
      ],
      total: [{ $count: "count" }],
    },
  });

  const [facetResult] = await PurchaseOrder.aggregate(pipeline);
  const rawItems = facetResult?.items || [];
  const total = facetResult?.total?.[0]?.count ?? 0;

  return {
    items: rawItems.map(mapItemWisePoReportRow),
    pagination: {
      page: forExport ? 1 : page,
      pageSize,
      total,
      totalPages: forExport ? 1 : Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getPurchaseOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter).lean();
  if (!doc) throw new AppError("Purchase order not found", 404, "NOT_FOUND");
  return doc;
}

export async function previewPurchaseOrderNo(companyId, scope) {
  const ctx = resolveTxnContext({}, scope);
  const code = await previewDocNo(companyId, "PO", "PO", ctx.locationId);
  return { code };
}

function isBlanketPoType(poType) {
  return String(poType ?? "")
    .trim()
    .toLowerCase() === "blanket po";
}

function validatePurchaseOrderCreate(body, scope) {
  const supplierId = body?.supplierId;
  if (!supplierId) throw new AppError("Supplier is required", 400, "VALIDATION_ERROR");

  const poType = String(body?.poType ?? "").trim();
  if (!poType) throw new AppError("PO type is required", 400, "VALIDATION_ERROR");

  if (!body?.poDate) throw new AppError("PO date is required", 400, "VALIDATION_ERROR");
  const poDate = new Date(body.poDate);
  if (Number.isNaN(poDate.getTime())) {
    throw new AppError("PO date is invalid", 400, "VALIDATION_ERROR");
  }

  const ctx = resolveTxnContext(body, scope);
  const terms = body?.poTerms || {};
  if (!String(terms.shipToLocation ?? "").trim() && !terms.shipToLocationId) {
    throw new AppError("Ship-To location is required in PO Terms", 400, "VALIDATION_ERROR");
  }

  const rawLines = Array.isArray(body?.lines) ? body.lines : [];
  const lines = rawLines.filter((row) => Number(row.qty) > 0);
  if (!lines.length) {
    throw new AppError("At least one line item with quantity is required", 400, "VALIDATION_ERROR");
  }

  const blanket = isBlanketPoType(poType);
  for (let i = 0; i < lines.length; i += 1) {
    const row = lines[i];
    const label = String(row.itemNo || row.itemName || i + 1).trim();
    const qty = Number(row.qty);
    const rate = Number(row.rate ?? 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new AppError(`Invalid quantity on line ${label}`, 400, "VALIDATION_ERROR");
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new AppError(`Rate is required on line ${label}`, 400, "VALIDATION_ERROR");
    }
    if (!blanket && !String(row.edd ?? "").trim()) {
      throw new AppError(`EDD is required on line ${label}`, 400, "VALIDATION_ERROR");
    }
  }

  return { ctx, lines, poDate, poType };
}

function applyPoMeta(body, doc) {
  if (body.poType !== undefined) doc.poType = String(body.poType ?? "").trim() || "Standard PO";
  if (body.currency !== undefined) doc.currency = String(body.currency ?? "").trim() || "INR";
  if (body.orderReferenceNo !== undefined) doc.orderReferenceNo = String(body.orderReferenceNo ?? "").trim();
  if (body.orderReferenceDate !== undefined) {
    doc.orderReferenceDate = body.orderReferenceDate ? new Date(body.orderReferenceDate) : undefined;
  }
  if (body.incidentalExpenses !== undefined) {
    doc.incidentalExpenses = Array.isArray(body.incidentalExpenses) ? body.incidentalExpenses : [];
  }
  if (body.poValue !== undefined) doc.poValue = body.poValue || {};
  if (body.poTerms !== undefined) doc.poTerms = body.poTerms || {};
}

function applyPurchaseOrderMpbcdc(target, body) {
  const mpbcdc = normalizePurchaseOrderMpbcdc(body);
  target.procurementReference = mpbcdc.procurementReference;
  target.governmentProcurement = mpbcdc.governmentProcurement;
  target.capitalProcurement = mpbcdc.capitalProcurement;
  target.approvalTracking = mpbcdc.approvalTracking;
}

export async function createPurchaseOrder(companyId, body, scope, userId) {
  const { ctx, lines: validatedLines, poDate, poType } = validatePurchaseOrderCreate(body, scope);
  const supplierDoc = await SupplierMaster.findOne({
    _id: body.supplierId,
    company: companyId,
  }).lean();
  if (!supplierDoc) throw new AppError("Supplier not found", 404, "NOT_FOUND");
  const poChannel = body.poTerms?.poChannel;
  assertDomesticPoSupplier(supplierDoc, poChannel);
  assertImportPoSupplier(supplierDoc, poChannel);
  const supplier = await resolveSupplier(companyId, body.supplierId);
  const buyerCtx = await resolveBuyerGstContext(companyId, ctx.locationId, body.poTerms || {});
  const incidentalExpenses = Array.isArray(body.incidentalExpenses) ? body.incidentalExpenses : [];
  const gstResult = computePurchaseOrderGst({
    lines: validatedLines,
    incidentalExpenses,
    buyerGstin: buyerCtx.buyerGstin,
    supplierGstin: supplier.gstin,
    buyerState: buyerCtx.buyerState,
    supplierState: supplier.state,
  });
  const lines = applyGstFieldsToLines(
    normalizePoLines(validatedLines, { resetFulfillment: true }),
    gstResult.lines
  );
  const poValue = poValueFromGstResult(gstResult);
  const totalAmount = Number(poValue.totalPoValue) > 0 ? Number(poValue.totalPoValue) : sumLines(lines);
  const termsSnapshot = await getPoTermsSnapshotForCompany(companyId);
  const poTerms = await mergePoTermsWithSnapshot(companyId, {
    ...(body.poTerms || {}),
    openingLineHtml: termsSnapshot.openingLineHtml,
    termsBodyHtml: termsSnapshot.termsBodyHtml,
    poPrintFormatKey: termsSnapshot.poPrintFormatKey,
    poPrintFormatName: termsSnapshot.poPrintFormatName,
    poPrintTemplateKey: termsSnapshot.poPrintTemplateKey,
  });
  const provisionalPoNo = `TMP-PO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const doc = await PurchaseOrder.create({
    company: companyId,
    locationId: ctx.locationId,
    subLocationId: ctx.subLocationId || undefined,
    inventoryStoreId: ctx.inventoryStoreId || undefined,
    poNo: provisionalPoNo,
    poDate,
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    poType,
    currency: body.currency || "INR",
    orderReferenceNo: String(body.orderReferenceNo ?? "").trim(),
    orderReferenceDate: body.orderReferenceDate ? new Date(body.orderReferenceDate) : undefined,
    incidentalExpenses,
    poValue,
    poTerms,
    status: "Draft",
    grnStatus: "Not Started",
    lines,
    totalAmount,
    remarks: String(body.remarks ?? "").trim(),
    ...normalizePurchaseOrderMpbcdc(body),
    createdBy: userId,
    updatedBy: userId,
  });

  try {
    const poNo = await nextDocNo(companyId, "PO", "PO", ctx.locationId);
    doc.poNo = poNo;
    await doc.save();
  } catch (err) {
    await PurchaseOrder.findByIdAndDelete(doc._id).catch(() => {});
    throw err;
  }

  const sourceIndentIds = Array.isArray(body.sourceIndentIds) ? body.sourceIndentIds : [];
  if (sourceIndentIds.length) {
    await linkPurchaseOrderToIndents(companyId, sourceIndentIds, doc);
    const refreshed = await PurchaseOrder.findById(doc._id).lean();
    return refreshed || doc.toObject();
  }

  return doc.toObject();
}

export async function updatePurchaseOrder(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter);
  if (!doc) throw new AppError("Purchase order not found", 404, "NOT_FOUND");
  if (doc.status !== "Draft") {
    throw new AppError("Only draft purchase orders can be edited", 400, "INVALID_STATUS");
  }
  if (
    body.supplierId &&
    String(body.supplierId) !== String(doc.supplierId)
  ) {
    throw new AppError(
      "Supplier cannot be changed on an existing purchase order",
      400,
      "VALIDATION_ERROR"
    );
  }
  const before = { locationId: doc.locationId, subLocationId: doc.subLocationId };
  if (body.locationId) doc.locationId = assertLocationAccess(scope, body.locationId);
  if (body.subLocationId !== undefined) doc.subLocationId = body.subLocationId || undefined;
  if (body.inventoryStoreId !== undefined) doc.inventoryStoreId = body.inventoryStoreId || undefined;

  const mergedOperationalTerms =
    body.poTerms !== undefined
      ? { ...(doc.poTerms?.toObject?.() ?? doc.poTerms ?? {}), ...(body.poTerms || {}) }
      : { ...(doc.poTerms?.toObject?.() ?? doc.poTerms ?? {}) };
  const poTerms = await mergePoTermsWithSnapshot(companyId, mergedOperationalTerms);
  const incidentalExpenses =
    body.incidentalExpenses !== undefined
      ? Array.isArray(body.incidentalExpenses)
        ? body.incidentalExpenses
        : []
      : doc.incidentalExpenses;

  if (body.lines) {
    const rawLines = (Array.isArray(body.lines) ? body.lines : []).filter(
      (row) => Number(row.qty) > 0
    );
    if (!rawLines.length) {
      throw new AppError("At least one line item with quantity is required", 400, "VALIDATION_ERROR");
    }
    const supplier = await resolveSupplier(companyId, doc.supplierId);
    const buyerCtx = await resolveBuyerGstContext(companyId, doc.locationId, poTerms);
    const gstResult = computePurchaseOrderGst({
      lines: rawLines,
      incidentalExpenses,
      buyerGstin: buyerCtx.buyerGstin,
      supplierGstin: supplier.gstin,
      buyerState: buyerCtx.buyerState,
      supplierState: supplier.state,
    });
    doc.lines = applyGstFieldsToLines(
      normalizePoLines(rawLines, { resetFulfillment: false }),
      gstResult.lines
    );
    validatePoLineFulfillment(doc.lines);
    doc.grnStatus = derivePoGrnStatus(doc.lines);
    doc.poValue = poValueFromGstResult(gstResult);
    doc.totalAmount =
      Number(gstResult.totalPoValue) > 0 ? Number(gstResult.totalPoValue) : sumLines(doc.lines);
    doc.incidentalExpenses = incidentalExpenses;
  } else if (body.incidentalExpenses !== undefined) {
    doc.incidentalExpenses = incidentalExpenses;
  }

  if (body.poDate) doc.poDate = new Date(body.poDate);
  doc.poTerms = poTerms;
  applyPoMeta(body, doc);
  applyPurchaseOrderMpbcdc(doc, body);
  if (body.remarks !== undefined) doc.remarks = String(body.remarks).trim();
  doc.updatedBy = userId;
  await doc.save();
  await auditLocationOnUpdate({
    companyId,
    entityType: "PurchaseOrder",
    entityId: doc._id,
    before,
    after: { locationId: doc.locationId, subLocationId: doc.subLocationId },
    userId,
  });
  return doc.toObject();
}

export async function approvePurchaseOrder(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await PurchaseOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Purchase order not found or not in Draft status", 404, "NOT_FOUND");
  }
  doc.status = "Approved";
  if (!doc.approvalTracking) doc.approvalTracking = {};
  doc.approvalTracking.approvalStatus = "Approved";
  doc.updatedBy = userId;
  await doc.save();
  await syncIndentLinksForPoStatus(companyId, doc);
  return doc.toObject();
}

export async function cancelPurchaseOrder(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await PurchaseOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Purchase order not found or not in Draft status", 404, "NOT_FOUND");
  }
  doc.status = "Cancelled";
  doc.updatedBy = userId;
  await doc.save();
  await syncIndentLinksForPoStatus(companyId, doc);
  return doc.toObject();
}

export async function deletePurchaseOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await PurchaseOrder.findOneAndDelete(filter);
  if (!doc) throw new AppError("Purchase order not found or not in Draft", 404, "NOT_FOUND");
  return { deleted: true };
}

// —— PO Amendment ——

function assertPoAmendable(doc) {
  if (!doc) throw new AppError("Purchase order not found", 404, "NOT_FOUND");
  if (doc.status !== "Approved") {
    throw new AppError("Only approved purchase orders can be amended", 400, "INVALID_STATUS");
  }
  if (String(doc.grnStatus || "") !== "Not Started") {
    throw new AppError("PO cannot be amended after GRN has started", 400, "GRN_STARTED");
  }
}

function mapAmendPoListRow(doc) {
  const poValue = doc.poValue && typeof doc.poValue === "object" ? doc.poValue : {};
  return {
    _id: doc._id,
    id: String(doc._id),
    poNo: doc.poNo,
    poDate: doc.poDate,
    supplierId: doc.supplierId,
    supplierName: doc.supplierName || "",
    poType: doc.poType || "Standard PO",
    currency: doc.currency || "INR",
    totalPoValue: Number(poValue.totalPoValue) || Number(doc.totalAmount) || 0,
    ppv: Number(poValue.ppv ?? doc.ppv ?? 0),
    amd: Number(doc.amendRevNo) || 0,
    amendRevNo: Number(doc.amendRevNo) || 0,
    amendStatus: doc.amendStatus || "None",
    status: doc.status,
    grnStatus: doc.grnStatus || "Not Started",
    hasPendingAmendment: doc.amendStatus === "Pending",
  };
}

export async function listAmendablePurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = "Approved";
  filter.grnStatus = "Not Started";
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ poNo: re }, { supplierName: re }, { orderReferenceNo: re }];
  }
  const docs = await PurchaseOrder.find(filter).sort({ poDate: -1, poNo: -1 }).lean();
  return docs.map(mapAmendPoListRow);
}

export async function getPurchaseOrderAmendmentHistory(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter)
    .select("poNo amendRevNo amendStatus amendmentHistory pendingAmendment")
    .lean();
  if (!doc) throw new AppError("Purchase order not found", 404, "NOT_FOUND");
  return {
    poNo: doc.poNo,
    amendRevNo: doc.amendRevNo || 0,
    amendStatus: doc.amendStatus || "None",
    pendingAmendment: doc.pendingAmendment || null,
    history: doc.amendmentHistory || [],
  };
}

function mergeAmendmentLines(existingLines, incomingLines) {
  const byKey = new Map();
  for (const line of existingLines) {
    byKey.set(lineMatchKey(line), line);
  }
  return normalizePoLines(
    incomingLines.map((row, index) => {
      const prev = byKey.get(lineMatchKey(row));
      return enrichPoLine({
        ...row,
        lineNo: row.lineNo || index + 1,
        receivedQty: prev ? Number(prev.receivedQty) || 0 : 0,
        cancelledQty: prev ? Number(prev.cancelledQty) || 0 : 0,
      });
    }),
    { resetFulfillment: false }
  );
}

async function computeAmendmentPayload(companyId, doc, body) {
  const poTerms = await mergePoTermsWithSnapshot(companyId, {
    ...(doc.poTerms?.toObject?.() ?? doc.poTerms ?? {}),
    ...(body.poTerms || {}),
  });
  const incidentalExpenses =
    body.incidentalExpenses !== undefined
      ? Array.isArray(body.incidentalExpenses)
        ? body.incidentalExpenses
        : []
      : doc.incidentalExpenses;

  const rawLines = (Array.isArray(body.lines) ? body.lines : []).filter((row) => Number(row.qty) > 0);
  if (!rawLines.length) {
    throw new AppError("At least one line item with quantity is required", 400, "VALIDATION_ERROR");
  }

  const supplier = await resolveSupplier(companyId, doc.supplierId);
  const buyerCtx = await resolveBuyerGstContext(companyId, doc.locationId, poTerms);
  const gstResult = computePurchaseOrderGst({
    lines: rawLines,
    incidentalExpenses,
    buyerGstin: buyerCtx.buyerGstin,
    supplierGstin: supplier.gstin,
    buyerState: buyerCtx.buyerState,
    supplierState: supplier.state,
  });
  const lines = applyGstFieldsToLines(mergeAmendmentLines(doc.lines, rawLines), gstResult.lines);
  validatePoLineFulfillment(lines);

  return {
    poDate: body.poDate ? new Date(body.poDate) : doc.poDate,
    poType: body.poType !== undefined ? String(body.poType ?? "").trim() || doc.poType : doc.poType,
    currency: body.currency !== undefined ? String(body.currency ?? "").trim() || doc.currency : doc.currency,
    orderReferenceNo:
      body.orderReferenceNo !== undefined
        ? String(body.orderReferenceNo ?? "").trim()
        : doc.orderReferenceNo,
    orderReferenceDate:
      body.orderReferenceDate !== undefined
        ? body.orderReferenceDate
          ? new Date(body.orderReferenceDate)
          : undefined
        : doc.orderReferenceDate,
    remarks: body.remarks !== undefined ? String(body.remarks ?? "").trim() : doc.remarks,
    incidentalExpenses,
    poTerms,
    lines,
    poValue: poValueFromGstResult(gstResult),
    totalAmount:
      Number(gstResult.totalPoValue) > 0 ? Number(gstResult.totalPoValue) : sumLines(lines),
  };
}

export async function submitPurchaseOrderAmendment(companyId, id, body, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter);
  assertPoAmendable(doc);

  const payload = await computeAmendmentPayload(companyId, doc, body);
  const now = new Date();
  doc.amendStatus = "Pending";
  doc.pendingAmendment = {
    ...payload,
    submittedAt: now,
    submittedBy: actor?.userId,
    submittedByName: actor?.name || actor?.userName || "",
    amendmentRemarks: String(body.amendmentRemarks ?? body.remarks ?? "").trim(),
  };
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendPoListRow(doc.toObject());
}

export async function updatePurchaseOrderAmendment(companyId, id, body, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter);
  assertPoAmendable(doc);
  if (doc.amendStatus !== "Pending" || !doc.pendingAmendment) {
    throw new AppError("No pending amendment to update", 400, "NO_PENDING_AMENDMENT");
  }

  const payload = await computeAmendmentPayload(companyId, doc, body);
  const prev = doc.pendingAmendment;
  doc.pendingAmendment = {
    ...payload,
    submittedAt: prev.submittedAt || new Date(),
    submittedBy: prev.submittedBy || actor?.userId,
    submittedByName: prev.submittedByName || actor?.name || "",
    amendmentRemarks: String(
      body.amendmentRemarks ?? prev.amendmentRemarks ?? body.remarks ?? ""
    ).trim(),
  };
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendPoListRow(doc.toObject());
}

export async function approvePurchaseOrderAmendment(companyId, id, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter);
  assertPoAmendable(doc);
  if (doc.amendStatus !== "Pending" || !doc.pendingAmendment) {
    throw new AppError("No pending amendment to approve", 400, "NO_PENDING_AMENDMENT");
  }

  const before = doc.toObject();
  const pending = doc.pendingAmendment;
  const revisionNo = (Number(doc.amendRevNo) || 0) + 1;
  const now = new Date();

  doc.poDate = pending.poDate || doc.poDate;
  doc.poType = pending.poType || doc.poType;
  doc.currency = pending.currency || doc.currency;
  doc.orderReferenceNo = pending.orderReferenceNo ?? doc.orderReferenceNo;
  doc.orderReferenceDate = pending.orderReferenceDate ?? doc.orderReferenceDate;
  doc.remarks = pending.remarks ?? doc.remarks;
  doc.incidentalExpenses = pending.incidentalExpenses ?? doc.incidentalExpenses;
  doc.poTerms = pending.poTerms ?? doc.poTerms;
  doc.lines = pending.lines ?? doc.lines;
  doc.poValue = pending.poValue ?? doc.poValue;
  doc.totalAmount = pending.totalAmount ?? doc.totalAmount;
  doc.grnStatus = derivePoGrnStatus(doc.lines);
  validatePoLineFulfillment(doc.lines);

  const after = doc.toObject();
  const changes = buildAmendmentChangeSummary(before, after);

  doc.amendRevNo = revisionNo;
  doc.amendStatus = "None";
  doc.pendingAmendment = null;
  doc.amendmentHistory = doc.amendmentHistory || [];
  doc.amendmentHistory.push({
    revisionNo,
    submittedAt: pending.submittedAt || now,
    submittedBy: pending.submittedBy,
    submittedByName: pending.submittedByName || "",
    approvedAt: now,
    approvedBy: actor?.userId,
    approvedByName: actor?.name || actor?.userName || "",
    remarks: pending.amendmentRemarks || "",
    changes,
    snapshot: {
      totalPoValue: after.poValue?.totalPoValue,
      currency: after.currency,
      lineCount: Array.isArray(after.lines) ? after.lines.length : 0,
    },
  });
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendPoListRow(doc.toObject());
}

// —— PO Cancel (approved, GRN not started) ——

function assertPoCancellable(doc) {
  assertPoAmendable(doc);
  if (doc.amendStatus === "Pending") {
    throw new AppError(
      "Cannot cancel while an amendment is pending approval",
      400,
      "PENDING_AMENDMENT"
    );
  }
}

export async function listCancellablePurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = "Approved";
  filter.grnStatus = "Not Started";
  filter.amendStatus = { $ne: "Pending" };
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ poNo: re }, { supplierName: re }, { orderReferenceNo: re }];
  }
  const docs = await PurchaseOrder.find(filter).sort({ poDate: -1, poNo: -1 }).lean();
  return docs.map(mapAmendPoListRow);
}

export async function cancelApprovedPurchaseOrder(companyId, id, scope, actor, body = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseOrder.findOne(filter);
  assertPoCancellable(doc);

  const cancelRemarks = String(body.cancelRemarks ?? body.remarks ?? "").trim();
  if (!cancelRemarks) {
    throw new AppError("Cancellation remarks are required", 400, "VALIDATION_ERROR");
  }

  const now = new Date();
  doc.status = "Cancelled";
  doc.cancelRemarks = cancelRemarks;
  doc.cancelledAt = now;
  doc.cancelledBy = actor?.userId;
  doc.cancelledByName = actor?.name || actor?.userName || "";
  doc.pendingAmendment = null;
  doc.amendStatus = "None";
  doc.updatedBy = actor?.userId;
  await doc.save();
  await syncIndentLinksForPoStatus(companyId, doc);
  return mapAmendPoListRow(doc.toObject());
}

// —— Goods Receipt ——

function applyGoodsReceiptMpbcdc(target, body) {
  const mpbcdc = normalizeGoodsReceiptMpbcdc(body);
  target.procurementReference = mpbcdc.procurementReference;
  target.receiptInformation = mpbcdc.receiptInformation;
  target.governmentProcurement = mpbcdc.governmentProcurement;
  target.capitalProcurement = mpbcdc.capitalProcurement;
  target.receivingAuthority = mpbcdc.receivingAuthority;
}

export async function listGoodsReceipts(companyId, scope) {
  return GoodsReceipt.find(scopedListFilter(companyId, scope))
    .sort({ grnDate: -1, grnNo: -1 })
    .lean();
}

export async function getGoodsReceipt(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await GoodsReceipt.findOne(filter).lean();
  if (!doc) throw new AppError("GRN not found", 404, "NOT_FOUND");
  return doc;
}

export async function createGoodsReceipt(companyId, body, scope, userId) {
  const ctx = resolveTxnContext(body, scope, { requireStore: true });
  const lines = normalizeLines(body.lines);
  const supplier = await resolveSupplier(companyId, body.supplierId);
  const grnNo = body.grnNo?.trim() || (await nextDocNo(companyId, "GRN", "GRN", ctx.locationId));

  const mpbcdc = normalizeGoodsReceiptMpbcdc(body);
  const doc = await GoodsReceipt.create({
    company: companyId,
    locationId: ctx.locationId,
    subLocationId: ctx.subLocationId || undefined,
    inventoryStoreId: ctx.inventoryStoreId,
    grnNo,
    grnDate: body.grnDate ? new Date(body.grnDate) : new Date(),
    purchaseOrderId: body.purchaseOrderId || undefined,
    poNo: String(body.poNo ?? "").trim(),
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    status: "Draft",
    lines,
    totalAmount: sumLines(lines),
    remarks: String(body.remarks ?? "").trim(),
    procurementReference: mpbcdc.procurementReference,
    receiptInformation: mpbcdc.receiptInformation,
    governmentProcurement: mpbcdc.governmentProcurement,
    capitalProcurement: mpbcdc.capitalProcurement,
    receivingAuthority: mpbcdc.receivingAuthority,
    createdBy: userId,
    updatedBy: userId,
  });
  return doc.toObject();
}

export async function updateGoodsReceipt(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await GoodsReceipt.findOne(filter);
  if (!doc) throw new AppError("GRN not found", 404, "NOT_FOUND");
  if (doc.status === "Posted") throw new AppError("Posted GRN cannot be edited", 400, "INVALID_STATUS");
  if (body.lines) {
    doc.lines = normalizeLines(body.lines);
    doc.totalAmount = sumLines(doc.lines);
  }
  if (body.grnDate) doc.grnDate = new Date(body.grnDate);
  if (body.remarks !== undefined) doc.remarks = String(body.remarks).trim();
  applyGoodsReceiptMpbcdc(doc, body);
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function postGoodsReceipt(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await GoodsReceipt.findOne(filter);
  if (!doc) throw new AppError("GRN not found", 404, "NOT_FOUND");
  if (doc.status === "Posted") throw new AppError("GRN already posted", 400, "INVALID_STATUS");

  for (const line of doc.lines) {
    if (!line.itemId || !line.qty) continue;
    await adjustStock(companyId, {
      locationId: doc.locationId,
      inventoryStoreId: doc.inventoryStoreId,
      itemId: line.itemId,
      itemNo: line.itemNo,
      uom: line.uom,
      qtyDelta: line.qty,
    });
  }

  doc.status = "Posted";
  doc.updatedBy = userId;
  await doc.save();

  if (doc.purchaseOrderId) {
    await applyGrnToPurchaseOrder(doc.purchaseOrderId, doc.lines, userId);
  }

  return doc.toObject();
}

export async function deleteGoodsReceipt(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await GoodsReceipt.findOneAndDelete(filter);
  if (!doc) throw new AppError("GRN not found or not in Draft", 404, "NOT_FOUND");
  return { deleted: true };
}

// —— Purchase Invoice ——

export async function listPurchaseInvoices(companyId, scope) {
  return PurchaseInvoice.find(scopedListFilter(companyId, scope))
    .sort({ invoiceDate: -1, invoiceNo: -1 })
    .lean();
}

export async function getPurchaseInvoice(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseInvoice.findOne(filter).lean();
  if (!doc) throw new AppError("Purchase invoice not found", 404, "NOT_FOUND");
  return doc;
}

export async function createPurchaseInvoice(companyId, body, scope, userId) {
  const ctx = resolveTxnContext(body, scope);
  const lines = normalizeLines(body.lines);
  const supplier = await resolveSupplier(companyId, body.supplierId);
  const invoiceNo = body.invoiceNo?.trim() || (await nextDocNo(companyId, "PINV", "PINV", ctx.locationId));

  const doc = await PurchaseInvoice.create({
    company: companyId,
    locationId: ctx.locationId,
    subLocationId: ctx.subLocationId || undefined,
    inventoryStoreId: ctx.inventoryStoreId || undefined,
    invoiceNo,
    invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    goodsReceiptId: body.goodsReceiptId || undefined,
    grnNo: String(body.grnNo ?? "").trim(),
    status: body.status || "Draft",
    lines,
    totalAmount: sumLines(lines),
    remarks: String(body.remarks ?? "").trim(),
    createdBy: userId,
    updatedBy: userId,
  });
  return doc.toObject();
}

export async function updatePurchaseInvoice(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await PurchaseInvoice.findOne(filter);
  if (!doc) throw new AppError("Purchase invoice not found", 404, "NOT_FOUND");
  if (body.lines) {
    doc.lines = normalizeLines(body.lines);
    doc.totalAmount = sumLines(doc.lines);
  }
  if (body.invoiceDate) doc.invoiceDate = new Date(body.invoiceDate);
  if (body.status) doc.status = body.status;
  if (body.remarks !== undefined) doc.remarks = String(body.remarks).trim();
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function deletePurchaseInvoice(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await PurchaseInvoice.findOneAndDelete(filter);
  if (!doc) throw new AppError("Invoice not found or not in Draft", 404, "NOT_FOUND");
  return { deleted: true };
}
