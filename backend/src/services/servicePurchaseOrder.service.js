import { ServicePurchaseOrder } from "../models/ServicePurchaseOrder.model.js";
import { ServiceMaster } from "../models/ServiceMaster.model.js";
import { LogisticsMaster } from "../models/LogisticsMaster.model.js";
import { AutoIncrement } from "../models/AutoIncrement.model.js";
import { AppError } from "../utils/AppError.js";
import {
  scopedListFilter,
  resolveTxnContext,
  assertLocationAccess,
} from "./transactionBase.service.js";
import {
  financialYearSuffix,
  normalizeSpoLine,
  computeSpoValue,
} from "../utils/spoCalculations.js";
import { buildSpoAmendmentChangeSummary } from "../utils/spoAmendment.js";

function spoModuleKey(category) {
  return category === "Import" ? "SPO_IMP" : "SPO_DOM";
}

function spoDocPrefix(category) {
  return category === "Import" ? "IPO" : "DPO";
}

async function allocateSpoNo(companyId, category, locationId) {
  const module = spoModuleKey(category);
  const prefix = spoDocPrefix(category);
  const fy = financialYearSuffix();
  const locOid = locationId || null;

  let doc = await AutoIncrement.findOneAndUpdate(
    { company: companyId, module, locationId: locOid },
    { $inc: { autoIncrementValue: 1 } },
    { new: true }
  );
  if (!doc && locOid) {
    doc = await AutoIncrement.findOneAndUpdate(
      { company: companyId, module, locationId: null },
      { $inc: { autoIncrementValue: 1 } },
      { new: true }
    );
  }
  if (!doc) {
    doc = await AutoIncrement.create({
      company: companyId,
      module,
      moduleName: `Service PO ${category}`,
      modulePrefix: prefix,
      locationId: locOid,
      autoIncrementValue: 1,
      digit: 6,
    });
  }
  const seq = String(doc.autoIncrementValue).padStart(6, "0");
  return `${prefix}/${fy}/${seq}`;
}

export async function previewServicePurchaseOrderNo(companyId, scope, category = "Domestic") {
  const ctx = resolveTxnContext({}, scope);
  const module = spoModuleKey(category);
  const prefix = spoDocPrefix(category);
  const fy = financialYearSuffix();
  const doc = await AutoIncrement.findOne({
    company: companyId,
    module,
    locationId: ctx.locationId || null,
  }).lean();
  const next = (Number(doc?.autoIncrementValue) || 0) + 1;
  return { code: `${prefix}/${fy}/${String(next).padStart(6, "0")}` };
}

function mapListRow(doc) {
  const spoValue = doc.spoValue && typeof doc.spoValue === "object" ? doc.spoValue : {};
  return {
    id: String(doc._id),
    _id: String(doc._id),
    spoNo: doc.spoNo,
    spoDate: doc.spoDate,
    serviceCategory: doc.serviceCategory || "Domestic",
    serviceProviderName: doc.serviceProviderName || "",
    currency: doc.currency || "INR",
    totalSpoValue: Number(spoValue.totalSpoValue) || Number(doc.totalAmount) || 0,
    status: doc.status || "Draft",
  };
}

export async function listServicePurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  const status = String(query.status || "").trim();
  if (status) filter.status = status;
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { spoNo: re },
      { serviceProviderName: re },
      { orderReferenceNo: re },
    ];
  }
  const docs = await ServicePurchaseOrder.find(filter).sort({ spoDate: -1, spoNo: -1 }).lean();
  return docs.map(mapListRow);
}

export async function getServicePurchaseOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter).lean();
  if (!doc) throw new AppError("Service purchase order not found", 404, "NOT_FOUND");
  return doc;
}

async function resolveServiceProvider(companyId, providerId) {
  const doc = await LogisticsMaster.findOne({ _id: providerId, company: companyId }).lean();
  if (!doc) throw new AppError("Service provider not found", 404, "NOT_FOUND");
  return {
    serviceProviderId: doc._id,
    serviceProviderName: doc.lspNameLegalEntity || doc.lspNickName || "",
  };
}

async function buildLinesFromPayload(companyId, rawLines) {
  if (!Array.isArray(rawLines) || !rawLines.length) {
    throw new AppError("At least one service line is required", 400, "VALIDATION_ERROR");
  }
  const lines = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const row = rawLines[i];
    if (Number(row.qty) <= 0) continue;
    let sacCode = String(row.sacCode ?? "").trim();
    let description = String(row.description ?? "").trim();
    let gstRate = Number(row.gstRate) || 0;
    let serviceNo = String(row.serviceNo ?? "").trim();
    let serviceId = row.serviceId;

    if (row.serviceId) {
      const svc = await ServiceMaster.findOne({
        _id: row.serviceId,
        company: companyId,
        status: "Active",
      }).lean();
      if (svc) {
        serviceId = svc._id;
        serviceNo = svc.serviceNo;
        sacCode = svc.sacCode;
        description = svc.serviceDescription || description;
        gstRate = Number(svc.gstRate) || gstRate;
      }
    }
    if (!sacCode) {
      throw new AppError(`SAC code is required on line ${i + 1}`, 400, "VALIDATION_ERROR");
    }
    lines.push(
      normalizeSpoLine(
        {
          ...row,
          serviceId,
          serviceNo,
          sacCode,
          description,
          gstRate,
        },
        i
      )
    );
  }
  if (!lines.length) {
    throw new AppError("At least one service line with quantity is required", 400, "VALIDATION_ERROR");
  }
  return lines;
}

export async function createServicePurchaseOrder(companyId, body, scope, userId) {
  const ctx = resolveTxnContext(body, scope);
  const category = body.serviceCategory === "Import" ? "Import" : "Domestic";
  const provider = await resolveServiceProvider(companyId, body.serviceProviderId);
  const lines = await buildLinesFromPayload(companyId, body.lines);
  const spoValue = computeSpoValue(lines);

  const spoNo = await allocateSpoNo(companyId, category, ctx.locationId);
  const doc = await ServicePurchaseOrder.create({
    company: companyId,
    locationId: ctx.locationId,
    spoNo,
    spoDate: body.spoDate ? new Date(body.spoDate) : new Date(),
    serviceCategory: category,
    serviceProviderId: provider.serviceProviderId,
    serviceProviderName: provider.serviceProviderName,
    orderReferenceNo: String(body.orderReferenceNo ?? "").trim(),
    currency: String(body.currency ?? "INR").trim() || "INR",
    spoRemarks: String(body.spoRemarks ?? "").trim(),
    spoValidity: body.spoValidity ? new Date(body.spoValidity) : undefined,
    paymentTerms: String(body.paymentTerms ?? "").trim(),
    spoValue,
    totalAmount: spoValue.totalSpoValue,
    status: "Draft",
    lines,
    createdBy: userId,
    updatedBy: userId,
  });
  return doc.toObject();
}

export async function updateServicePurchaseOrder(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await ServicePurchaseOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Service purchase order not found or not in Draft status", 404, "NOT_FOUND");
  }

  if (body.locationId) doc.locationId = assertLocationAccess(scope, body.locationId);
  if (body.serviceCategory) doc.serviceCategory = body.serviceCategory === "Import" ? "Import" : "Domestic";
  if (body.serviceProviderId) {
    const provider = await resolveServiceProvider(companyId, body.serviceProviderId);
    doc.serviceProviderId = provider.serviceProviderId;
    doc.serviceProviderName = provider.serviceProviderName;
  }
  if (body.spoDate) doc.spoDate = new Date(body.spoDate);
  if (body.orderReferenceNo !== undefined) doc.orderReferenceNo = String(body.orderReferenceNo ?? "").trim();
  if (body.currency !== undefined) doc.currency = String(body.currency ?? "INR").trim() || "INR";
  if (body.spoRemarks !== undefined) doc.spoRemarks = String(body.spoRemarks ?? "").trim();
  if (body.spoValidity !== undefined) {
    doc.spoValidity = body.spoValidity ? new Date(body.spoValidity) : undefined;
  }
  if (body.paymentTerms !== undefined) doc.paymentTerms = String(body.paymentTerms ?? "").trim();
  if (body.lines) {
    doc.lines = await buildLinesFromPayload(companyId, body.lines);
    doc.spoValue = computeSpoValue(doc.lines);
    doc.totalAmount = doc.spoValue.totalSpoValue;
  }
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function deleteServicePurchaseOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await ServicePurchaseOrder.findOneAndDelete(filter);
  if (!doc) throw new AppError("Draft SPO not found", 404, "NOT_FOUND");
  return { deleted: true };
}

export async function listActiveServicesForSpo(companyId) {
  return ServiceMaster.find({ company: companyId, status: "Active" })
    .sort({ serviceNo: 1 })
    .select("serviceNo serviceDescription sacCode gstRate")
    .lean();
}

export async function approveServicePurchaseOrder(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await ServicePurchaseOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Service purchase order not found or not in Draft status", 404, "NOT_FOUND");
  }
  doc.status = "Approved";
  doc.receiptStatus = doc.receiptStatus || "Not Started";
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

// —— SPO Amendment ——

function assertSpoAmendable(doc) {
  if (!doc) throw new AppError("Service purchase order not found", 404, "NOT_FOUND");
  if (doc.status !== "Approved") {
    throw new AppError("Only approved service purchase orders can be amended", 400, "INVALID_STATUS");
  }
  if (String(doc.receiptStatus || "") !== "Not Started") {
    throw new AppError("SPO cannot be amended after service receipt has started", 400, "RECEIPT_STARTED");
  }
}

function mapAmendSpoListRow(doc) {
  const spoValue = doc.spoValue && typeof doc.spoValue === "object" ? doc.spoValue : {};
  return {
    _id: doc._id,
    id: String(doc._id),
    spoNo: doc.spoNo,
    spoDate: doc.spoDate,
    serviceCategory: doc.serviceCategory || "Domestic",
    serviceProviderName: doc.serviceProviderName || "",
    currency: doc.currency || "INR",
    totalSpoValue: Number(spoValue.totalSpoValue) || Number(doc.totalAmount) || 0,
    amd: Number(doc.amendRevNo) || 0,
    amendRevNo: Number(doc.amendRevNo) || 0,
    amendStatus: doc.amendStatus || "None",
    status: doc.status,
    receiptStatus: doc.receiptStatus || "Not Started",
    hasPendingAmendment: doc.amendStatus === "Pending",
  };
}

function receiptNotStartedFilter() {
  return { $or: [{ receiptStatus: "Not Started" }, { receiptStatus: { $exists: false } }] };
}

export async function listAmendableServicePurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = "Approved";
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = [
      receiptNotStartedFilter(),
      { $or: [{ spoNo: re }, { serviceProviderName: re }, { orderReferenceNo: re }] },
    ];
  } else {
    Object.assign(filter, receiptNotStartedFilter());
  }
  const docs = await ServicePurchaseOrder.find(filter).sort({ spoDate: -1, spoNo: -1 }).lean();
  return docs.map(mapAmendSpoListRow);
}

export async function getServicePurchaseOrderAmendmentHistory(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter)
    .select("spoNo amendRevNo amendStatus amendmentHistory pendingAmendment")
    .lean();
  if (!doc) throw new AppError("Service purchase order not found", 404, "NOT_FOUND");
  return {
    spoNo: doc.spoNo,
    amendRevNo: doc.amendRevNo || 0,
    amendStatus: doc.amendStatus || "None",
    pendingAmendment: doc.pendingAmendment || null,
    history: doc.amendmentHistory || [],
  };
}

async function computeSpoAmendmentPayload(companyId, doc, body) {
  const lines = await buildLinesFromPayload(companyId, body.lines);
  const spoValue = computeSpoValue(lines);
  return {
    spoDate: body.spoDate ? new Date(body.spoDate) : doc.spoDate,
    serviceCategory:
      body.serviceCategory !== undefined
        ? body.serviceCategory === "Import"
          ? "Import"
          : "Domestic"
        : doc.serviceCategory,
    orderReferenceNo:
      body.orderReferenceNo !== undefined
        ? String(body.orderReferenceNo ?? "").trim()
        : doc.orderReferenceNo,
    currency:
      body.currency !== undefined ? String(body.currency ?? "").trim() || doc.currency : doc.currency,
    spoRemarks:
      body.spoRemarks !== undefined ? String(body.spoRemarks ?? "").trim() : doc.spoRemarks,
    spoValidity:
      body.spoValidity !== undefined
        ? body.spoValidity
          ? new Date(body.spoValidity)
          : undefined
        : doc.spoValidity,
    paymentTerms:
      body.paymentTerms !== undefined ? String(body.paymentTerms ?? "").trim() : doc.paymentTerms,
    lines,
    spoValue,
    totalAmount: spoValue.totalSpoValue,
  };
}

export async function submitServicePurchaseOrderAmendment(companyId, id, body, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter);
  assertSpoAmendable(doc);

  const payload = await computeSpoAmendmentPayload(companyId, doc, body);
  const now = new Date();
  doc.amendStatus = "Pending";
  doc.pendingAmendment = {
    ...payload,
    submittedAt: now,
    submittedBy: actor?.userId,
    submittedByName: actor?.name || actor?.userName || "",
    amendmentRemarks: String(body.amendmentRemarks ?? body.spoRemarks ?? "").trim(),
  };
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendSpoListRow(doc.toObject());
}

export async function updateServicePurchaseOrderAmendment(companyId, id, body, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter);
  assertSpoAmendable(doc);
  if (doc.amendStatus !== "Pending" || !doc.pendingAmendment) {
    throw new AppError("No pending amendment to update", 400, "NO_PENDING_AMENDMENT");
  }

  const payload = await computeSpoAmendmentPayload(companyId, doc, body);
  const prev = doc.pendingAmendment;
  doc.pendingAmendment = {
    ...payload,
    submittedAt: prev.submittedAt || new Date(),
    submittedBy: prev.submittedBy || actor?.userId,
    submittedByName: prev.submittedByName || actor?.name || "",
    amendmentRemarks: String(
      body.amendmentRemarks ?? prev.amendmentRemarks ?? body.spoRemarks ?? ""
    ).trim(),
  };
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendSpoListRow(doc.toObject());
}

export async function approveServicePurchaseOrderAmendment(companyId, id, scope, actor) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter);
  assertSpoAmendable(doc);
  if (doc.amendStatus !== "Pending" || !doc.pendingAmendment) {
    throw new AppError("No pending amendment to approve", 400, "NO_PENDING_AMENDMENT");
  }

  const before = doc.toObject();
  const pending = doc.pendingAmendment;
  const revisionNo = (Number(doc.amendRevNo) || 0) + 1;
  const now = new Date();

  doc.spoDate = pending.spoDate || doc.spoDate;
  doc.serviceCategory = pending.serviceCategory || doc.serviceCategory;
  doc.orderReferenceNo = pending.orderReferenceNo ?? doc.orderReferenceNo;
  doc.currency = pending.currency || doc.currency;
  doc.spoRemarks = pending.spoRemarks ?? doc.spoRemarks;
  doc.spoValidity = pending.spoValidity ?? doc.spoValidity;
  doc.paymentTerms = pending.paymentTerms ?? doc.paymentTerms;
  doc.lines = pending.lines ?? doc.lines;
  doc.spoValue = pending.spoValue ?? doc.spoValue;
  doc.totalAmount = pending.totalAmount ?? doc.totalAmount;

  const after = doc.toObject();
  const changes = buildSpoAmendmentChangeSummary(before, after);

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
      totalSpoValue: after.spoValue?.totalSpoValue,
      currency: after.currency,
      lineCount: Array.isArray(after.lines) ? after.lines.length : 0,
    },
  });
  doc.updatedBy = actor?.userId;
  await doc.save();
  return mapAmendSpoListRow(doc.toObject());
}

// —— SPO Cancel (approved, receipt not started) ——

function assertSpoCancellable(doc) {
  assertSpoAmendable(doc);
  if (doc.amendStatus === "Pending") {
    throw new AppError(
      "Cannot cancel while an amendment is pending approval",
      400,
      "PENDING_AMENDMENT"
    );
  }
}

export async function listCancellableServicePurchaseOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = "Approved";
  filter.amendStatus = { $ne: "Pending" };
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = [
      receiptNotStartedFilter(),
      { $or: [{ spoNo: re }, { serviceProviderName: re }, { orderReferenceNo: re }] },
    ];
  } else {
    Object.assign(filter, receiptNotStartedFilter());
  }
  const docs = await ServicePurchaseOrder.find(filter).sort({ spoDate: -1, spoNo: -1 }).lean();
  return docs.map(mapAmendSpoListRow);
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

function mapSpoReportRow(doc) {
  const spoValue = doc.spoValue && typeof doc.spoValue === "object" ? doc.spoValue : {};
  const status = doc.status || "Draft";
  const receiptStatus = doc.receiptStatus || "Not Started";
  let displayStatus = status;
  if (status === "Approved") {
    if (receiptStatus === "Partial") displayStatus = "Receipt Partial";
    else if (receiptStatus === "Complete") displayStatus = "Receipt Complete";
    else if (receiptStatus === "Short Closed") displayStatus = "Short Closed";
  } else if (status === "Cancelled") {
    displayStatus = "Cancelled";
  }

  return {
    _id: doc._id,
    spoNo: doc.spoNo,
    spoDate: doc.spoDate,
    serviceProviderId: doc.serviceProviderId,
    serviceProviderName: doc.serviceProviderName || "",
    serviceCategory: doc.serviceCategory || "Domestic",
    currency: doc.currency || "INR",
    taxableAmount: Number(spoValue.totalTaxable) || 0,
    gstAmount: Number(spoValue.totalGst) || 0,
    totalSpoValue: Number(spoValue.totalSpoValue) || Number(doc.totalAmount) || 0,
    orderReferenceNo: doc.orderReferenceNo || "",
    status: displayStatus,
    approvalStatus: status,
    receiptStatus,
  };
}

/** Paginated SPO register for Reports → Service Purchase Order. */
export async function listServicePurchaseOrderReport(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter.status = { $nin: ["Draft", "Cancelled"] };
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(5, Number(query.pageSize) || 25));
  const search = String(query.search ?? "").trim();

  const from = parseReportDate(query.fromDate, false);
  const to = parseReportDate(query.toDate, true);
  if (from || to) {
    filter.spoDate = {};
    if (from) filter.spoDate.$gte = from;
    if (to) filter.spoDate.$lte = to;
  }

  if (query.serviceProviderId) {
    filter.serviceProviderId = query.serviceProviderId;
  }

  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ spoNo: re }, { serviceProviderName: re }, { orderReferenceNo: re }];
  }

  const skip = (page - 1) * pageSize;
  const [docs, total] = await Promise.all([
    ServicePurchaseOrder.find(filter).sort({ spoDate: -1, spoNo: -1 }).skip(skip).limit(pageSize).lean(),
    ServicePurchaseOrder.countDocuments(filter),
  ]);

  const totalsAgg = await ServicePurchaseOrder.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTaxable: { $sum: { $ifNull: ["$spoValue.totalTaxable", 0] } },
        totalGst: { $sum: { $ifNull: ["$spoValue.totalGst", 0] } },
        totalSpoValue: {
          $sum: {
            $ifNull: ["$spoValue.totalSpoValue", { $ifNull: ["$totalAmount", 0] }],
          },
        },
      },
    },
  ]);

  const totalsRow = totalsAgg[0] || {};
  return {
    items: docs.map(mapSpoReportRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    totals: {
      totalTaxable: Number(totalsRow.totalTaxable) || 0,
      totalGst: Number(totalsRow.totalGst) || 0,
      totalSpoValue: Number(totalsRow.totalSpoValue) || 0,
    },
  };
}

export async function cancelApprovedServicePurchaseOrder(companyId, id, scope, actor, body = {}) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await ServicePurchaseOrder.findOne(filter);
  assertSpoCancellable(doc);

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
  return mapAmendSpoListRow(doc.toObject());
}
