import { FALLBACK_INCIDENTAL_EXPENSE_ROWS } from "../config/purchaseOrderFormOptions.js";
import {
  EMPTY_CAPITAL_PROCUREMENT,
  EMPTY_GOVERNMENT_PROCUREMENT,
  EMPTY_PO_APPROVAL_TRACKING,
  EMPTY_PROCUREMENT_REFERENCE,
} from "../config/purchaseOrderMpbcdcOptions.js";
import { buildIncidentalExpenseRows } from "./masterDataOptions.js";
import { computePurchaseOrderGst } from "./poGstCalculation.js";
import { emptyLandedCost, landedCostFromPoTerms } from "./importLandedCost.js";

export function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultPoValidityDate(fromDate) {
  const base = fromDate ? new Date(fromDate) : new Date();
  if (Number.isNaN(base.getTime())) return todayInputDate();
  base.setDate(base.getDate() + 30);
  return base.toISOString().slice(0, 10);
}

export function emptyPoLineFromItem(item) {
  const id = item?._id != null ? String(item._id) : String(item?.id ?? "");
  const tagFields = {
    itemNo: true,
    itemName: true,
    itemDescription: true,
    materialCode: false,
    mpn: true,
  };
  return {
    key: id || `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemId: id,
    itemNo: item?.itemNo ?? "",
    itemName: item?.itemName ?? "",
    description: item?.itemDescription ?? item?.description ?? "",
    tag: "",
    mpn: item?.mpn ?? "",
    tagFields,
    uom: item?.uom ?? "",
    vbp: "",
    qty: "",
    rate: "",
    edd: "",
    eddDelCount: 1,
    eddSchedules: [],
    eqt: "",
    eqtPercent: "",
    receivedQty: 0,
    cancelledQty: 0,
    balanceQty: 0,
    hsnCode: item?.hsnCode ?? "",
    gstRate: Number(item?.gstRate ?? 0),
  };
}

export function emptyPoLineFromSupplierLink(row) {
  const itemId = row?.itemId != null ? String(row.itemId) : "";
  const linkId = row?.linkId != null ? String(row.linkId) : "";
  const defaultRate =
    row?.defaultRate != null && row.defaultRate !== ""
      ? String(row.defaultRate)
      : Array.isArray(row?.rates) && row.rates.length
        ? String(row.rates[0]?.rate ?? "")
        : "";
  const tagFields = {
    itemNo: true,
    itemName: true,
    itemDescription: true,
    materialCode: false,
    mpn: Boolean(row?.mpn),
  };
  return {
    key: linkId || itemId || `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    linkId,
    itemId,
    itemNo: row?.itemNo ?? "",
    itemName: row?.itemName ?? "",
    description: row?.itemDescription ?? row?.description ?? "",
    tag: row?.mpn ?? "",
    mpn: row?.mpn ?? "",
    tagFields,
    uom: row?.uom ?? "",
    vbp: defaultRate,
    qty: "",
    rate: defaultRate,
    edd: "",
    eddDelCount: 1,
    eddSchedules: [],
    eqt: "",
    eqtPercent: "",
    receivedQty: 0,
    cancelledQty: 0,
    balanceQty: 0,
    hsnCode: row?.hsnCode ?? "",
    gstRate: Number(row?.gstRate ?? 0),
  };
}

export function buildDefaultEddSchedules(line, delCount = 1) {
  const count = Math.max(1, Number(delCount) || 1);
  const poQty = Number(line?.qty);
  const qtyStr = Number.isFinite(poQty) && poQty > 0 ? String(poQty) : "";
  const uom = line?.uom ?? "";
  const existing = Array.isArray(line?.eddSchedules) ? line.eddSchedules : [];
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const prev = existing[i];
    rows.push({
      scheduleNo: i + 1,
      qty: prev?.qty ?? (i === 0 ? qtyStr : ""),
      uom: prev?.uom || uom,
      deliveryDate: prev?.deliveryDate ?? (i === 0 ? line?.edd ?? "" : ""),
    });
  }
  return rows;
}

export function computeExcessThreshold(qty, percent) {
  const q = Number(qty);
  const p = Number(percent);
  if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) return "";
  return String(Math.round(q * (1 + p / 100) * 100) / 100);
}

export function primaryEddFromSchedules(schedules) {
  const first = (schedules || []).find((r) => r?.deliveryDate);
  return first?.deliveryDate ?? "";
}

export function serializeEddForPayload(row) {
  const schedules = Array.isArray(row.eddSchedules) ? row.eddSchedules : [];
  if (!schedules.length) return String(row.edd ?? "").trim();
  if (schedules.length === 1 && !row.eddDelCount) {
    return String(schedules[0]?.deliveryDate ?? row.edd ?? "").trim();
  }
  return JSON.stringify({
    delCount: Number(row.eddDelCount) || schedules.length,
    schedules: schedules.map((s, i) => ({
      scheduleNo: i + 1,
      qty: Number(s.qty) || 0,
      uom: s.uom ?? row.uom ?? "",
      deliveryDate: s.deliveryDate ?? "",
    })),
  });
}

export function serializeEqtForPayload(row) {
  const threshold = String(row.eqt ?? "").trim();
  const percent = String(row.eqtPercent ?? "").trim();
  if (!threshold && !percent) return "";
  if (percent && threshold) {
    return JSON.stringify({ percent: Number(percent) || 0, threshold: Number(threshold) || 0 });
  }
  return threshold || percent;
}

export function computeLineBalance(qty, receivedQty = 0, cancelledQty = 0) {
  const q = Number(qty);
  if (!Number.isFinite(q) || q < 0) return 0;
  const received = Number(receivedQty) || 0;
  const cancelled = Number(cancelledQty) || 0;
  return Math.max(0, Math.round((q - received - cancelled) * 1000) / 1000);
}

export function lineAmount(line) {
  const qty = Number(line.qty);
  const rate = Number(line.rate);
  if (Number.isNaN(qty) || Number.isNaN(rate)) return 0;
  return Math.round(qty * rate * 100) / 100;
}

export function sumLineValues(lines) {
  return (lines || []).reduce((s, row) => s + lineAmount(row), 0);
}

export function sumIncidental(expenses) {
  return (expenses || []).reduce((s, row) => {
    const n = Number(row.amount);
    return s + (Number.isNaN(n) ? 0 : n);
  }, 0);
}

export function computePoValue(lines, incidentalExpenses, gstContext = {}) {
  const mappedLines = (lines || []).map((row) => ({
    ...row,
    amount: lineAmount(row),
  }));
  const result = computePurchaseOrderGst({
    lines: mappedLines,
    incidentalExpenses,
    buyerGstin: gstContext.buyerGstin || "",
    supplierGstin: gstContext.supplierGstin || "",
    buyerState: gstContext.buyerState || "",
    supplierState: gstContext.supplierState || "",
  });
  const { lines: _computedLines, ...poValue } = result;
  return poValue;
}

export function computePoGstBundle(lines, incidentalExpenses, gstContext = {}) {
  const mappedLines = (lines || []).map((row) => ({
    ...row,
    amount: lineAmount(row),
  }));
  return computePurchaseOrderGst({
    lines: mappedLines,
    incidentalExpenses,
    buyerGstin: gstContext.buyerGstin || "",
    supplierGstin: gstContext.supplierGstin || "",
    buyerState: gstContext.buyerState || "",
    supplierState: gstContext.supplierState || "",
  });
}

function toInputDate(value) {
  if (!value) return todayInputDate();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return todayInputDate();
  return d.toISOString().slice(0, 10);
}

function dateToInput(val) {
  if (!val) return "";
  return String(val).slice(0, 10);
}

function mapProcurementReference(doc) {
  const p = doc?.procurementReference || {};
  return {
    procurementCategory: p.procurementCategory ?? "",
    purchaseType: p.purchaseType ?? "",
    sourceListId: p.sourceListId != null ? String(p.sourceListId) : "",
    sourceListCode: p.sourceListCode ?? "",
    sourceListLabel: p.sourceListLabel ?? "",
    vendorEvaluationId: p.vendorEvaluationId != null ? String(p.vendorEvaluationId) : "",
    vendorEvaluationCode: p.vendorEvaluationCode ?? "",
    vendorEvaluationLabel: p.vendorEvaluationLabel ?? "",
    rateContractReference: p.rateContractReference ?? "",
    contractReference: p.contractReference ?? "",
    budgetReference: p.budgetReference ?? "",
  };
}

function mapGovernmentProcurement(doc) {
  const g = doc?.governmentProcurement || {};
  return {
    gemPurchase: g.gemPurchase ?? "",
    tenderPurchase: g.tenderPurchase ?? "",
    emergencyProcurement: g.emergencyProcurement ?? "",
    boardApprovalRequired: g.boardApprovalRequired ?? "",
    tenderNumber: g.tenderNumber ?? "",
    gemBidNumber: g.gemBidNumber ?? "",
    governmentApprovalNumber: g.governmentApprovalNumber ?? "",
    governmentReference: g.governmentReference ?? "",
  };
}

function mapCapitalProcurement(doc) {
  const c = doc?.capitalProcurement || {};
  return {
    assetProcurement: c.assetProcurement ?? "",
    assetId: c.assetId != null ? String(c.assetId) : "",
    assetCode: c.assetCode ?? "",
    assetName: c.assetName ?? "",
    capitalizationRequired: c.capitalizationRequired ?? "",
    capitalBudgetCode: c.capitalBudgetCode ?? "",
  };
}

function mapPoApprovalTracking(doc) {
  const a = doc?.approvalTracking || {};
  return {
    approvalStatus: a.approvalStatus ?? "",
    approvalAuthority: a.approvalAuthority ?? "",
    approvalDate: dateToInput(a.approvalDate),
    approvalRemarks: a.approvalRemarks ?? "",
  };
}

function parseEddToForm(eddRaw, line) {
  const str = String(eddRaw ?? "").trim();
  if (!str) {
    return { edd: "", eddDelCount: 1, eddSchedules: buildDefaultEddSchedules(line, 1) };
  }
  try {
    const parsed = JSON.parse(str);
    if (parsed?.schedules && Array.isArray(parsed.schedules)) {
      return {
        edd: primaryEddFromSchedules(parsed.schedules),
        eddDelCount: Number(parsed.delCount) || parsed.schedules.length,
        eddSchedules: parsed.schedules.map((s, i) => ({
          scheduleNo: i + 1,
          qty: s.qty != null ? String(s.qty) : "",
          uom: s.uom ?? line.uom ?? "",
          deliveryDate: s.deliveryDate ?? "",
        })),
      };
    }
  } catch {
    /* plain date string */
  }
  return {
    edd: str,
    eddDelCount: 1,
    eddSchedules: buildDefaultEddSchedules({ ...line, edd: str }, 1),
  };
}

/** Parse API/form `edd` for read-only UI (schedules, primary date). */
export function parseEddForDisplay(eddRaw, line = {}) {
  return parseEddToForm(eddRaw, line);
}

/** Parse API/form `eqt` for read-only UI. */
export function parseEqtForDisplay(eqtRaw) {
  return parseEqtToForm(eqtRaw);
}

function parseEqtToForm(eqtRaw) {
  const str = String(eqtRaw ?? "").trim();
  if (!str) return { eqt: "", eqtPercent: "" };
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") {
      return {
        eqtPercent: parsed.percent != null ? String(parsed.percent) : "",
        eqt: parsed.threshold != null ? String(parsed.threshold) : "",
      };
    }
  } catch {
    /* plain */
  }
  return { eqt: str, eqtPercent: "" };
}

export function poLineFromApi(line) {
  const base = {
    itemId: line.itemId != null ? String(line.itemId) : "",
    itemNo: line.itemNo ?? "",
    itemName: line.itemName ?? "",
    description: line.description ?? "",
    tag: line.tag ?? "",
    mpn: line.tag ?? "",
    tagFields: {
      itemNo: true,
      itemName: true,
      itemDescription: true,
      materialCode: false,
      mpn: Boolean(line.tag),
    },
    uom: line.uom ?? "",
    vbp: line.vbp != null ? String(line.vbp) : "",
    qty: line.qty != null && line.qty !== "" ? String(line.qty) : "",
    rate: line.rate != null && line.rate !== "" ? String(line.rate) : "",
    receivedQty: Number(line.receivedQty) || 0,
    cancelledQty: Number(line.cancelledQty) || 0,
    balanceQty: Number(line.balanceQty) || 0,
    hsnCode: line.hsnCode ?? "",
    gstRate: Number(line.gstRate ?? 0),
  };
  const edd = parseEddToForm(line.edd, base);
  const eqt = parseEqtToForm(line.eqt);
  return {
    key: base.itemId || `line-${line.lineNo}-${Math.random().toString(36).slice(2, 6)}`,
    ...base,
    ...edd,
    ...eqt,
  };
}

/** Merge supplier catalogue with lines already on the PO (edit mode). */
/** Apply Material Purchase Planning line qty onto supplier catalogue rows. */
export function mergeMppPrefillLines(supplierLinkRows, mppLines) {
  const qtyByItem = new Map((mppLines || []).map((row) => [String(row.itemId), row]));
  const merged = (supplierLinkRows || []).map((row) => {
    const line = emptyPoLineFromSupplierLink(row);
    const mpp = qtyByItem.get(String(line.itemId));
    if (!mpp) return line;
    const qty = mpp.qty ?? mpp.toProcure;
    return {
      ...line,
      qty: qty != null && qty !== "" ? String(qty) : "",
    };
  });
  for (const mpp of mppLines || []) {
    if (merged.some((line) => String(line.itemId) === String(mpp.itemId))) continue;
    const fallback = emptyPoLineFromItem(mpp);
    const qty = mpp.qty ?? mpp.toProcure;
    merged.push({
      ...fallback,
      qty: qty != null && qty !== "" ? String(qty) : "",
      mpn: mpp.mpn ?? mpp.tag ?? fallback.mpn,
      tag: mpp.tag ?? mpp.mpn ?? "",
    });
  }
  return merged;
}

export function mergeSupplierLinesWithExisting(existingLines, supplierLinkRows) {
  const byItemId = new Map(
    (existingLines || []).map((row) => [String(row.itemId), row])
  );
  const merged = (supplierLinkRows || []).map((row) => {
    const linkLine = emptyPoLineFromSupplierLink(row);
    const existing = byItemId.get(String(linkLine.itemId));
    if (existing) {
      byItemId.delete(String(linkLine.itemId));
      return {
        ...linkLine,
        ...existing,
        key: existing.key,
        tagFields: existing.tagFields || linkLine.tagFields,
      };
    }
    return linkLine;
  });
  for (const leftover of byItemId.values()) {
    merged.push(leftover);
  }
  return merged;
}

export function purchaseOrderDocToForm(doc, incidentalExpenseRows = []) {
  const expenses = incidentalExpenseRows.length
    ? buildIncidentalExpenseRows(incidentalExpenseRows, doc.incidentalExpenses)
    : (doc.incidentalExpenses || []).map((r) => ({ ...r }));
  const terms = doc.poTerms || {};
  return {
    poNo: doc.poNo ?? "",
    poDate: toInputDate(doc.poDate),
    supplierId: doc.supplierId != null ? String(doc.supplierId) : "",
    supplierName: doc.supplierName ?? "",
    supplierCurrency: doc.currency || "INR",
    poType: doc.poType ?? "",
    orderReferenceNo: doc.orderReferenceNo ?? "",
    orderReferenceDate: doc.orderReferenceDate ? toInputDate(doc.orderReferenceDate) : "",
    lines: (doc.lines || []).map(poLineFromApi),
    incidentalExpenses: expenses,
    poValue: doc.poValue || computePoValue([], expenses),
    poTerms: {
      shipToLocation: terms.shipToLocation ?? "",
      shipToLocationId: terms.shipToLocationId != null ? String(terms.shipToLocationId) : "",
      modeOfTransport: terms.modeOfTransport ?? "",
      freightTerms: terms.freightTerms ?? "",
      transporterName: terms.transporterName ?? "",
      paymentTerms: terms.paymentTerms ?? "",
      poValidity: terms.poValidity ? toInputDate(terms.poValidity) : defaultPoValidityDate(),
      poRemarks: terms.poRemarks ?? doc.remarks ?? "",
    },
    landedCost: landedCostFromPoTerms(terms),
    importMeta: {
      incoterm: terms.importMeta?.incoterm ?? terms.incoterm ?? "",
    },
    sourceIndentIds: (doc.sourceIndentIds || []).map((id) => String(id)),
    sourceIndentNos: Array.isArray(doc.sourceIndentNos) ? doc.sourceIndentNos : [],
    procurementReference: mapProcurementReference(doc),
    governmentProcurement: mapGovernmentProcurement(doc),
    capitalProcurement: mapCapitalProcurement(doc),
    approvalTracking: mapPoApprovalTracking(doc),
    status: doc.status || "Draft",
    grnStatus: doc.grnStatus || "Not Started",
  };
}

export function emptyPurchaseOrderForm(incidentalExpenses = []) {
  const expenses = incidentalExpenses.length
    ? incidentalExpenses.map((r) => ({ ...r }))
    : FALLBACK_INCIDENTAL_EXPENSE_ROWS.map((r) => ({ ...r }));
  return {
    poNo: "",
    poDate: todayInputDate(),
    supplierId: "",
    supplierName: "",
    supplierCurrency: "INR",
    poType: "",
    orderReferenceNo: "",
    orderReferenceDate: "",
    lines: [],
    incidentalExpenses: expenses,
    poValue: computePoValue([], expenses),
    poTerms: {
      shipToLocation: "",
      shipToLocationId: "",
      modeOfTransport: "",
      freightTerms: "",
      transporterName: "",
      paymentTerms: "",
      poValidity: defaultPoValidityDate(),
      poRemarks: "",
    },
    landedCost: emptyLandedCost(),
    importMeta: { incoterm: "" },
    sourceIndentIds: [],
    sourceIndentNos: [],
    procurementReference: { ...EMPTY_PROCUREMENT_REFERENCE },
    governmentProcurement: { ...EMPTY_GOVERNMENT_PROCUREMENT },
    capitalProcurement: { ...EMPTY_CAPITAL_PROCUREMENT },
    approvalTracking: { ...EMPTY_PO_APPROVAL_TRACKING },
    status: "Draft",
  };
}

export function purchaseOrderFormToPayload(form, locationId, gstContext = {}, options = {}) {
  const incidentalExpenses = (form.incidentalExpenses || []).map((r) => ({
    description: String(r.description ?? "").trim(),
    amount: Number(r.amount) || 0,
  }));

  const baseLines = (form.lines || [])
    .filter((row) => Number(row.qty) > 0)
    .map((row, index) => {
      const qty = Number(row.qty);
      const receivedQty = Number(row.receivedQty) || 0;
      const cancelledQty = Number(row.cancelledQty) || 0;
      return {
        lineNo: index + 1,
        itemId: row.itemId,
        itemNo: row.itemNo,
        itemName: row.itemName,
        description: row.description,
        tag: row.tag,
        uom: row.uom,
        vbp: Number(row.vbp) || 0,
        qty,
        receivedQty,
        cancelledQty,
        balanceQty: computeLineBalance(qty, receivedQty, cancelledQty),
        rate: Number(row.rate) || 0,
        amount: lineAmount(row),
        edd: serializeEddForPayload(row),
        eqt: serializeEqtForPayload(row),
        hsnCode: row.hsnCode,
        gstRate: row.gstRate,
      };
    });

  const gstBundle = computePurchaseOrderGst({
    lines: baseLines,
    incidentalExpenses,
    ...gstContext,
  });

  const lines = baseLines.map((row, index) => {
    const tax = gstBundle.lines[index];
    if (!tax) return row;
    return {
      ...row,
      amount: tax.taxableAmount ?? row.amount,
      taxableAmount: tax.taxableAmount ?? row.amount,
      igstRate: tax.igstRate ?? 0,
      igstAmt: tax.igstAmt ?? 0,
      cgstRate: tax.cgstRate ?? 0,
      cgstAmt: tax.cgstAmt ?? 0,
      sgstRate: tax.sgstRate ?? 0,
      sgstAmt: tax.sgstAmt ?? 0,
      totalTax: tax.totalTax ?? 0,
    };
  });

  const { lines: _ignored, ...poValue } = gstBundle;

  return {
    locationId,
    poDate: form.poDate,
    supplierId: form.supplierId,
    poType: form.poType,
    currency: form.supplierCurrency || "INR",
    orderReferenceNo: form.orderReferenceNo,
    orderReferenceDate: form.orderReferenceDate || undefined,
    lines,
    incidentalExpenses,
    poValue,
    poTerms: {
      ...(form.poTerms || {}),
      ...(options.poChannel ? { poChannel: options.poChannel } : {}),
      ...(options.poChannel === "import"
        ? {
            importMeta: {
              incoterm: String(form.importMeta?.incoterm ?? "").trim(),
              exchangeRate: Number(form.landedCost?.exchangeRate) || undefined,
            },
            landedCost: { ...(form.landedCost || {}) },
          }
        : {}),
    },
    status: form.status || "Draft",
    grnStatus: form.grnStatus || "Not Started",
    remarks: form.poTerms?.poRemarks || "",
    sourceIndentIds: Array.isArray(form.sourceIndentIds)
      ? [...new Set(form.sourceIndentIds.map((id) => String(id)).filter(Boolean))]
      : [],
    procurementReference: form.procurementReference || {},
    governmentProcurement: form.governmentProcurement || {},
    capitalProcurement: form.capitalProcurement || {},
    approvalTracking: form.approvalTracking || {},
  };
}
