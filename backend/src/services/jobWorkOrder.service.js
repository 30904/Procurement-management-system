import { JobWorkOrder } from "../models/JobWorkOrder.model.js";
import { SupplierMaster } from "../models/SupplierMaster.model.js";
import { ItemMaster } from "../models/ItemMaster.model.js";
import { AutoIncrement } from "../models/AutoIncrement.model.js";
import { AppError } from "../utils/AppError.js";
import {
  scopedListFilter,
  resolveTxnContext,
  assertLocationAccess,
} from "./transactionBase.service.js";
import {
  financialYearSuffix,
  normalizeJwoLine,
  computeJwoValue,
} from "../utils/jwoCalculations.js";

const JWO_MODULE = "JWO";
const JWO_PREFIX = "JWO";

async function allocateJwoNo(companyId, locationId) {
  const fy = financialYearSuffix();
  const locOid = locationId || null;

  let doc = await AutoIncrement.findOneAndUpdate(
    { company: companyId, module: JWO_MODULE, locationId: locOid },
    { $inc: { autoIncrementValue: 1 } },
    { new: true }
  );
  if (!doc && locOid) {
    doc = await AutoIncrement.findOneAndUpdate(
      { company: companyId, module: JWO_MODULE, locationId: null },
      { $inc: { autoIncrementValue: 1 } },
      { new: true }
    );
  }
  if (!doc) {
    doc = await AutoIncrement.create({
      company: companyId,
      module: JWO_MODULE,
      moduleName: "Job Work Order",
      modulePrefix: JWO_PREFIX,
      locationId: locOid,
      autoIncrementValue: 1,
      digit: 6,
    });
  }
  const seq = String(doc.autoIncrementValue).padStart(6, "0");
  return `${JWO_PREFIX}/${fy}/${seq}`;
}

export async function previewJobWorkOrderNo(companyId, scope) {
  const ctx = resolveTxnContext({}, scope);
  const fy = financialYearSuffix();
  const doc = await AutoIncrement.findOne({
    company: companyId,
    module: JWO_MODULE,
    locationId: ctx.locationId || null,
  }).lean();
  const next = (Number(doc?.autoIncrementValue) || 0) + 1;
  return { code: `${JWO_PREFIX}/${fy}/${String(next).padStart(6, "0")}` };
}

function mapListRow(doc) {
  const jwoValue = doc.jwoValue && typeof doc.jwoValue === "object" ? doc.jwoValue : {};
  return {
    id: String(doc._id),
    _id: String(doc._id),
    jwoNo: doc.jwoNo,
    jwoDate: doc.jwoDate,
    jwoType: doc.jwoType || "Standard",
    jobWorkerName: doc.jobWorkerName || "",
    currency: doc.currency || "INR",
    totalJwoValue: Number(jwoValue.totalJwoValue) || Number(doc.totalAmount) || 0,
    status: doc.status || "Draft",
  };
}

export async function listJobWorkOrders(companyId, scope, query = {}) {
  const filter = scopedListFilter(companyId, scope);
  const status = String(query.status || "").trim();
  if (status) filter.status = status;
  const search = String(query.search ?? "").trim();
  if (search) {
    const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ jwoNo: re }, { jobWorkerName: re }, { orderReferenceNo: re }];
  }
  const docs = await JobWorkOrder.find(filter).sort({ jwoDate: -1, jwoNo: -1 }).lean();
  return docs.map(mapListRow);
}

export async function getJobWorkOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  const doc = await JobWorkOrder.findOne(filter).lean();
  if (!doc) throw new AppError("Job work order not found", 404, "NOT_FOUND");
  return doc;
}

async function resolveJobWorker(companyId, jobWorkerId) {
  const doc = await SupplierMaster.findOne({ _id: jobWorkerId, company: companyId }).lean();
  if (!doc) throw new AppError("Job worker not found", 404, "NOT_FOUND");
  return {
    jobWorkerId: doc._id,
    jobWorkerCode: doc.supplierCode || "",
    jobWorkerName: doc.supplierName || "",
  };
}

async function buildLinesFromPayload(companyId, rawLines) {
  if (!Array.isArray(rawLines) || !rawLines.length) {
    throw new AppError("At least one job work line is required", 400, "VALIDATION_ERROR");
  }
  const lines = [];
  for (let i = 0; i < rawLines.length; i += 1) {
    const row = rawLines[i];
    if (Number(row.qty) <= 0) continue;
    let jwiNo = String(row.jwiNo ?? "").trim();
    let jwiItemName = String(row.jwiItemName ?? "").trim();
    let jwiItemDescription = String(row.jwiItemDescription ?? "").trim();
    let sacCode = String(row.sacCode ?? "").trim();
    let uom = String(row.uom ?? "").trim();
    let gstRate = Number(row.gstRate) || 0;
    let jwiId = row.jwiId;

    if (row.jwiId) {
      const item = await ItemMaster.findOne({ _id: row.jwiId, company: companyId }).lean();
      if (item) {
        jwiId = item._id;
        jwiNo = item.itemNo;
        jwiItemName = item.itemName;
        jwiItemDescription = item.itemDescription || jwiItemDescription;
        sacCode = sacCode || item.hsnCode || "";
        uom = uom || item.uom || "";
        gstRate = Number(item.gstRate) || gstRate;
      }
    }
    lines.push(
      normalizeJwoLine(
        {
          ...row,
          jwiId,
          jwiNo,
          jwiItemName,
          jwiItemDescription,
          sacCode,
          uom,
          gstRate,
          scheduleDate: row.scheduleDate || null,
        },
        i
      )
    );
  }
  if (!lines.length) {
    throw new AppError("At least one line with quantity is required", 400, "VALIDATION_ERROR");
  }
  return lines;
}

function mergeTerms(body) {
  const terms = body.jwoTerms && typeof body.jwoTerms === "object" ? { ...body.jwoTerms } : {};
  if (body.paymentTerms !== undefined) terms.paymentTerms = String(body.paymentTerms ?? "").trim();
  if (body.jwoValidity) terms.jwoValidity = body.jwoValidity;
  return terms;
}

export async function createJobWorkOrder(companyId, body, scope, userId) {
  const ctx = resolveTxnContext(body, scope);
  const worker = await resolveJobWorker(companyId, body.jobWorkerId);
  const lines = await buildLinesFromPayload(companyId, body.lines);
  const jwoValue = computeJwoValue(lines);
  const jwoNo = await allocateJwoNo(companyId, ctx.locationId);
  const jwoValidity = body.jwoValidity
    ? new Date(body.jwoValidity)
    : body.jwoTerms?.jwoValidity
      ? new Date(body.jwoTerms.jwoValidity)
      : undefined;

  const doc = await JobWorkOrder.create({
    company: companyId,
    locationId: ctx.locationId,
    jwoNo,
    jwoDate: body.jwoDate ? new Date(body.jwoDate) : new Date(),
    jwoType: String(body.jwoType ?? "Standard").trim() || "Standard",
    jobWorkerId: worker.jobWorkerId,
    jobWorkerCode: worker.jobWorkerCode,
    jobWorkerName: worker.jobWorkerName,
    orderReferenceNo: String(body.orderReferenceNo ?? "").trim(),
    currency: String(body.currency ?? "INR").trim() || "INR",
    jwoRemarks: String(body.jwoRemarks ?? "").trim(),
    jwoValidity,
    jwoTerms: mergeTerms(body),
    jwoValue,
    totalAmount: jwoValue.totalJwoValue,
    status: "Draft",
    lines,
    createdBy: userId,
    updatedBy: userId,
  });
  return doc.toObject();
}

export async function updateJobWorkOrder(companyId, id, body, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await JobWorkOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Job work order not found or not in Draft status", 404, "NOT_FOUND");
  }

  if (body.locationId) doc.locationId = assertLocationAccess(scope, body.locationId);
  if (body.jobWorkerId) {
    const worker = await resolveJobWorker(companyId, body.jobWorkerId);
    doc.jobWorkerId = worker.jobWorkerId;
    doc.jobWorkerCode = worker.jobWorkerCode;
    doc.jobWorkerName = worker.jobWorkerName;
  }
  if (body.jwoDate) doc.jwoDate = new Date(body.jwoDate);
  if (body.jwoType !== undefined) doc.jwoType = String(body.jwoType ?? "Standard").trim() || "Standard";
  if (body.orderReferenceNo !== undefined) doc.orderReferenceNo = String(body.orderReferenceNo ?? "").trim();
  if (body.currency !== undefined) doc.currency = String(body.currency ?? "INR").trim() || "INR";
  if (body.jwoRemarks !== undefined) doc.jwoRemarks = String(body.jwoRemarks ?? "").trim();
  if (body.jwoValidity !== undefined) {
    doc.jwoValidity = body.jwoValidity ? new Date(body.jwoValidity) : undefined;
  }
  if (body.jwoTerms !== undefined || body.paymentTerms !== undefined) {
    doc.jwoTerms = mergeTerms({ ...doc.toObject(), ...body });
  }
  if (body.lines) {
    doc.lines = await buildLinesFromPayload(companyId, body.lines);
    doc.jwoValue = computeJwoValue(doc.lines);
    doc.totalAmount = doc.jwoValue.totalJwoValue;
  }
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function deleteJobWorkOrder(companyId, id, scope) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await JobWorkOrder.findOneAndDelete(filter);
  if (!doc) throw new AppError("Draft job work order not found", 404, "NOT_FOUND");
  return { deleted: true };
}

export async function approveJobWorkOrder(companyId, id, scope, userId) {
  const filter = scopedListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await JobWorkOrder.findOne(filter);
  if (!doc) {
    throw new AppError("Job work order not found or not in Draft status", 404, "NOT_FOUND");
  }
  if (!doc.lines?.length) {
    throw new AppError("Cannot approve job work order without lines", 400, "VALIDATION_ERROR");
  }
  doc.status = "Approved";
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}
