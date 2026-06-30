import {
  EMPTY_GRN_CAPITAL_PROCUREMENT,
  EMPTY_GRN_GOVERNMENT_PROCUREMENT,
  EMPTY_GRN_PROCUREMENT_REFERENCE,
  EMPTY_GRN_RECEIPT_INFORMATION,
  EMPTY_GRN_RECEIVING_AUTHORITY,
} from "../config/goodsReceiptMpbcdcOptions.js";

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function mapProcurementReference(doc) {
  const p = doc?.procurementReference || {};
  return {
    purchaseRequisitionId: p.purchaseRequisitionId != null ? String(p.purchaseRequisitionId) : "",
    purchaseRequisitionNo: p.purchaseRequisitionNo ?? "",
    procurementCategory: p.procurementCategory ?? "",
    purchaseType: p.purchaseType ?? "",
    sourceListId: p.sourceListId != null ? String(p.sourceListId) : "",
    sourceListCode: p.sourceListCode ?? "",
    sourceListLabel: p.sourceListLabel ?? "",
    vendorEvaluationId: p.vendorEvaluationId != null ? String(p.vendorEvaluationId) : "",
    vendorEvaluationCode: p.vendorEvaluationCode ?? "",
    vendorEvaluationLabel: p.vendorEvaluationLabel ?? "",
    contractReference: p.contractReference ?? "",
    budgetReference: p.budgetReference ?? "",
  };
}

function mapReceiptInformation(doc) {
  const r = doc?.receiptInformation || {};
  return {
    receiptType: r.receiptType ?? "",
    receiptStatus: r.receiptStatus ?? "",
    inspectionRequired: r.inspectionRequired ?? "",
    qcStatus: r.qcStatus ?? "",
    acceptedQuantity: r.acceptedQuantity ?? "",
    rejectedQuantity: r.rejectedQuantity ?? "",
    shortQuantity: r.shortQuantity ?? "",
    excessQuantity: r.excessQuantity ?? "",
  };
}

function mapGovernmentProcurement(doc) {
  const g = doc?.governmentProcurement || {};
  return {
    gemProcurement: g.gemProcurement ?? "",
    tenderProcurement: g.tenderProcurement ?? "",
    inspectionCertificateAvailable: g.inspectionCertificateAvailable ?? "",
    governmentInspectionRequired: g.governmentInspectionRequired ?? "",
    inspectionCertificateNumber: g.inspectionCertificateNumber ?? "",
    inspectionAgency: g.inspectionAgency ?? "",
    inspectionDate: toInputDate(g.inspectionDate),
    governmentRemarks: g.governmentRemarks ?? "",
  };
}

function mapCapitalProcurement(doc) {
  const c = doc?.capitalProcurement || {};
  return {
    assetCreationRequired: c.assetCreationRequired ?? "",
    assetId: c.assetId != null ? String(c.assetId) : "",
    assetCode: c.assetCode ?? "",
    assetName: c.assetName ?? "",
    capitalizationPending: c.capitalizationPending ?? "",
    assetTagNumber: c.assetTagNumber ?? "",
  };
}

function mapReceivingAuthority(doc) {
  const a = doc?.receivingAuthority || {};
  return {
    receivedById: a.receivedById != null ? String(a.receivedById) : "",
    receivedByName: a.receivedByName ?? "",
    verifiedById: a.verifiedById != null ? String(a.verifiedById) : "",
    verifiedByName: a.verifiedByName ?? "",
    verifiedDate: toInputDate(a.verifiedDate),
    receivingRemarks: a.receivingRemarks ?? "",
  };
}

export function grnLineFromApi(line, index = 0) {
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  return {
    key: line.itemId ? String(line.itemId) : `line-${line.lineNo || index + 1}`,
    lineNo: line.lineNo || index + 1,
    itemId: line.itemId != null ? String(line.itemId) : "",
    itemNo: line.itemNo ?? "",
    itemName: line.itemName ?? "",
    uom: line.uom ?? "",
    qty: qty ? String(qty) : "",
    rate: rate ? String(rate) : "",
    amount: Number(line.amount) || qty * rate,
    balanceQty: Number(line.balanceQty) || 0,
  };
}

export function grnLineFromPoLine(poLine, index = 0) {
  const ordered = Number(poLine.qty) || 0;
  const received = Number(poLine.receivedQty) || 0;
  const cancelled = Number(poLine.cancelledQty) || 0;
  const balance =
    Number(poLine.balanceQty) > 0
      ? Number(poLine.balanceQty)
      : Math.max(0, ordered - received - cancelled);
  const rate = Number(poLine.rate) || 0;
  const qty = balance > 0 ? balance : 0;
  return {
    key: poLine.itemId ? String(poLine.itemId) : `line-${poLine.lineNo || index + 1}`,
    lineNo: poLine.lineNo || index + 1,
    itemId: poLine.itemId != null ? String(poLine.itemId) : "",
    itemNo: poLine.itemNo ?? "",
    itemName: poLine.itemName ?? "",
    uom: poLine.uom ?? "",
    qty: qty ? String(qty) : "",
    rate: rate ? String(rate) : "",
    amount: qty * rate,
    balanceQty: balance,
  };
}

export function computeReceiptQuantities(lines, rejectedQuantity = "") {
  let accepted = 0;
  let short = 0;
  let excess = 0;
  for (const line of lines || []) {
    const recv = Number(line.qty) || 0;
    accepted += recv;
    const balance = Number(line.balanceQty) || 0;
    if (balance > 0) {
      short += Math.max(0, balance - recv);
      excess += Math.max(0, recv - balance);
    }
  }
  return {
    acceptedQuantity: accepted || "",
    shortQuantity: short || "",
    excessQuantity: excess || "",
    rejectedQuantity: rejectedQuantity === "" || rejectedQuantity == null ? "" : Number(rejectedQuantity) || 0,
  };
}

export function computeGrnTotal(lines) {
  return (lines || []).reduce((sum, line) => {
    const qty = Number(line.qty) || 0;
    const rate = Number(line.rate) || 0;
    const amount = Number(line.amount);
    return sum + (Number.isFinite(amount) ? amount : qty * rate);
  }, 0);
}

export function prefillGrnFromPurchaseOrder(form, po) {
  if (!po) return form;
  const proc = po.procurementReference || {};
  const gov = po.governmentProcurement || {};
  const cap = po.capitalProcurement || {};
  const indentNos = (po.sourceIndentIds || []).length
    ? (po.sourceIndentNos || []).filter(Boolean).join(", ")
    : (po.sourceIndentNos || []).filter(Boolean).join(", ");
  const openLines = (po.lines || [])
    .map((line, i) => grnLineFromPoLine(line, i))
    .filter((line) => Number(line.qty) > 0 || Number(line.balanceQty) > 0);

  const receiptQty = computeReceiptQuantities(openLines, form.receiptInformation?.rejectedQuantity);

  return {
    ...form,
    purchaseOrderId: po._id != null ? String(po._id) : "",
    poNo: po.poNo ?? "",
    supplierId: po.supplierId != null ? String(po.supplierId) : "",
    supplierName: po.supplierName ?? "",
    lines: openLines.length ? openLines : form.lines,
    procurementReference: {
      ...form.procurementReference,
      purchaseRequisitionNo: indentNos || form.procurementReference?.purchaseRequisitionNo || "",
      procurementCategory: proc.procurementCategory || form.procurementReference?.procurementCategory || "",
      purchaseType: proc.purchaseType || form.procurementReference?.purchaseType || "",
      sourceListId: proc.sourceListId != null ? String(proc.sourceListId) : "",
      sourceListCode: proc.sourceListCode ?? "",
      sourceListLabel: proc.sourceListLabel ?? "",
      vendorEvaluationId: proc.vendorEvaluationId != null ? String(proc.vendorEvaluationId) : "",
      vendorEvaluationCode: proc.vendorEvaluationCode ?? "",
      vendorEvaluationLabel: proc.vendorEvaluationLabel ?? "",
      contractReference: proc.contractReference ?? "",
      budgetReference: proc.budgetReference ?? "",
    },
    governmentProcurement: {
      ...form.governmentProcurement,
      gemProcurement: gov.gemPurchase || form.governmentProcurement?.gemProcurement || "",
      tenderProcurement: gov.tenderPurchase || form.governmentProcurement?.tenderProcurement || "",
    },
    capitalProcurement: {
      ...form.capitalProcurement,
      assetId: cap.assetId != null ? String(cap.assetId) : form.capitalProcurement?.assetId || "",
      assetCode: cap.assetCode ?? form.capitalProcurement?.assetCode ?? "",
      assetName: cap.assetName ?? form.capitalProcurement?.assetName ?? "",
    },
    receiptInformation: {
      ...form.receiptInformation,
      ...receiptQty,
    },
  };
}

export function goodsReceiptDocToForm(doc) {
  return {
    grnNo: doc.grnNo ?? "",
    grnDate: toInputDate(doc.grnDate) || todayInputDate(),
    purchaseOrderId: doc.purchaseOrderId != null ? String(doc.purchaseOrderId) : "",
    poNo: doc.poNo ?? "",
    supplierId: doc.supplierId != null ? String(doc.supplierId) : "",
    supplierName: doc.supplierName ?? "",
    inventoryStoreId: doc.inventoryStoreId != null ? String(doc.inventoryStoreId) : "",
    locationId: doc.locationId != null ? String(doc.locationId) : "",
    lines: (doc.lines || []).map(grnLineFromApi),
    remarks: doc.remarks ?? "",
    status: doc.status || "Draft",
    procurementReference: mapProcurementReference(doc),
    receiptInformation: mapReceiptInformation(doc),
    governmentProcurement: mapGovernmentProcurement(doc),
    capitalProcurement: mapCapitalProcurement(doc),
    receivingAuthority: mapReceivingAuthority(doc),
  };
}

export function emptyGoodsReceiptForm(defaultReceiverName = "") {
  return {
    grnNo: "",
    grnDate: todayInputDate(),
    purchaseOrderId: "",
    poNo: "",
    supplierId: "",
    supplierName: "",
    inventoryStoreId: "",
    locationId: "",
    lines: [],
    remarks: "",
    status: "Draft",
    procurementReference: { ...EMPTY_GRN_PROCUREMENT_REFERENCE },
    receiptInformation: { ...EMPTY_GRN_RECEIPT_INFORMATION },
    governmentProcurement: { ...EMPTY_GRN_GOVERNMENT_PROCUREMENT },
    capitalProcurement: { ...EMPTY_GRN_CAPITAL_PROCUREMENT },
    receivingAuthority: {
      ...EMPTY_GRN_RECEIVING_AUTHORITY,
      receivedByName: defaultReceiverName,
    },
  };
}

function normalizeLinePayload(line, index) {
  const qty = Number(line.qty) || 0;
  const rate = Number(line.rate) || 0;
  const amount = Number(line.amount);
  return {
    lineNo: index + 1,
    itemId: line.itemId || undefined,
    itemNo: String(line.itemNo ?? "").trim(),
    itemName: String(line.itemName ?? "").trim(),
    uom: String(line.uom ?? "").trim(),
    qty,
    rate,
    amount: Number.isFinite(amount) ? amount : qty * rate,
  };
}

export function goodsReceiptFormToPayload(form, { locationId, inventoryStoreId } = {}) {
  const receipt = {
    ...form.receiptInformation,
    ...computeReceiptQuantities(form.lines, form.receiptInformation?.rejectedQuantity),
  };

  return {
    grnNo: String(form.grnNo ?? "").trim() || undefined,
    grnDate: form.grnDate || undefined,
    locationId: locationId || form.locationId || undefined,
    inventoryStoreId: inventoryStoreId || form.inventoryStoreId || undefined,
    purchaseOrderId: form.purchaseOrderId || undefined,
    poNo: String(form.poNo ?? "").trim(),
    supplierId: form.supplierId || undefined,
    remarks: String(form.remarks ?? "").trim(),
    lines: (form.lines || [])
      .filter((line) => Number(line.qty) > 0)
      .map(normalizeLinePayload),
    procurementReference: form.procurementReference,
    receiptInformation: receipt,
    governmentProcurement: form.governmentProcurement,
    capitalProcurement: form.capitalProcurement,
    receivingAuthority: form.receivingAuthority,
  };
}

export function buildGoodsReceiptDevFillForm(baseForm) {
  return {
    ...baseForm,
    procurementReference: {
      ...baseForm.procurementReference,
      procurementCategory: "GeM",
      purchaseType: "Material",
      contractReference: "CTR-2026-001",
      budgetReference: "BUD-FY26-GRN",
    },
    receiptInformation: {
      ...baseForm.receiptInformation,
      receiptType: "Material Receipt",
      receiptStatus: "Accepted",
      inspectionRequired: "Yes",
      qcStatus: "Approved",
      rejectedQuantity: "0",
    },
    governmentProcurement: {
      ...baseForm.governmentProcurement,
      gemProcurement: "Yes",
      tenderProcurement: "No",
      inspectionCertificateAvailable: "Yes",
      governmentInspectionRequired: "No",
      inspectionCertificateNumber: "INSP-2026-001",
      inspectionAgency: "MPBCDC QA Cell",
    },
    receivingAuthority: {
      ...baseForm.receivingAuthority,
      receivingRemarks: "Sample GRN receiving note",
    },
  };
}
