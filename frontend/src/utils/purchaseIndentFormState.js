import {
  EMPTY_APPROVAL_TRACKING,
  EMPTY_BUDGET_INFO,
  EMPTY_GOVERNANCE_INFO,
  EMPTY_PROCUREMENT_INFO,
} from "../config/purchaseIndentMpbcdcOptions.js";

export const INDENT_PRIORITY_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgent", label: "Urgent" },
];

function todayInputDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateToInput(val) {
  if (!val) return "";
  return String(val).slice(0, 10);
}

function mapProcurementInfo(doc) {
  const p = doc?.procurementInfo || {};
  return {
    requisitionType: p.requisitionType ?? "",
    procurementCategory: p.procurementCategory ?? "",
    costCenter: p.costCenter ?? "",
  };
}

function mapBudgetInfo(doc) {
  const b = doc?.budgetInfo || {};
  return {
    budgetHead: b.budgetHead ?? "",
    estimatedProcurementValue:
      b.estimatedProcurementValue != null && b.estimatedProcurementValue !== ""
        ? String(b.estimatedProcurementValue)
        : "",
    budgetAvailable: b.budgetAvailable ?? "",
    fundingSource: b.fundingSource ?? "",
    financialYear: b.financialYear ?? "",
    budgetReference: b.budgetReference ?? "",
    budgetRemarks: b.budgetRemarks ?? "",
    budgetVerificationStatus: b.budgetVerificationStatus ?? "",
  };
}

function mapGovernanceInfo(doc) {
  const g = doc?.governanceInfo || {};
  return {
    gemApplicable: g.gemApplicable ?? "",
    tenderRequired: g.tenderRequired ?? "",
    emergencyProcurement: g.emergencyProcurement ?? "",
    boardApprovalRequired: g.boardApprovalRequired ?? "",
    procurementJustification: g.procurementJustification ?? "",
    specialApprovalNotes: g.specialApprovalNotes ?? "",
  };
}

function mapApprovalTracking(doc) {
  const a = doc?.approvalTracking || {};
  return {
    approvalStatus: a.approvalStatus ?? "",
    approvedBy: a.approvedBy ?? "",
    approvalDate: dateToInput(a.approvalDate),
    approvalRemarks: a.approvalRemarks ?? "",
  };
}

export function emptyPurchaseIndentForm(requestedBy = "") {
  return {
    indentNo: "",
    indentDate: todayInputDate(),
    department: "",
    requestedBy,
    priority: "Normal",
    requiredByDate: "",
    remarks: "",
    lines: [],
    procurementInfo: { ...EMPTY_PROCUREMENT_INFO },
    budgetInfo: { ...EMPTY_BUDGET_INFO },
    governanceInfo: { ...EMPTY_GOVERNANCE_INFO },
    approvalTracking: { ...EMPTY_APPROVAL_TRACKING },
  };
}

export function emptyIndentLineFromItem(item) {
  const id = item?._id != null ? String(item._id) : String(item?.id ?? "");
  return {
    key: id || `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemId: id,
    itemNo: item?.itemNo ?? "",
    itemName: item?.itemName ?? "",
    description: item?.itemDescription ?? item?.description ?? "",
    uom: item?.uom ?? "",
    qty: "",
    requiredDate: "",
    lineRemarks: "",
  };
}

function lineFromApi(line) {
  return {
    key: `line-${line.lineNo}-${line.itemId || line.itemNo}`,
    lineNo: line.lineNo,
    itemId: line.itemId != null ? String(line.itemId) : "",
    itemNo: line.itemNo ?? "",
    itemName: line.itemName ?? "",
    description: line.description ?? "",
    uom: line.uom ?? "",
    qty: line.qty != null ? String(line.qty) : "",
    requiredDate: line.requiredDate ? String(line.requiredDate).slice(0, 10) : "",
    lineRemarks: line.lineRemarks ?? "",
  };
}

export function purchaseIndentDocToForm(doc) {
  if (!doc) return emptyPurchaseIndentForm();
  return {
    indentNo: doc.indentNo ?? "",
    indentDate: doc.indentDate ? String(doc.indentDate).slice(0, 10) : todayInputDate(),
    department: doc.department ?? "",
    requestedBy: doc.requestedBy ?? "",
    priority: doc.priority ?? "Normal",
    requiredByDate: doc.requiredByDate ? String(doc.requiredByDate).slice(0, 10) : "",
    remarks: doc.remarks ?? "",
    lines: Array.isArray(doc.lines) ? doc.lines.map(lineFromApi) : [],
    procurementInfo: mapProcurementInfo(doc),
    budgetInfo: mapBudgetInfo(doc),
    governanceInfo: mapGovernanceInfo(doc),
    approvalTracking: mapApprovalTracking(doc),
  };
}

export function purchaseIndentFormToPayload(form, locationId) {
  const lines = (form.lines || [])
    .filter((row) => Number(row.qty) > 0)
    .map((row, index) => ({
      lineNo: index + 1,
      itemId: row.itemId || undefined,
      itemNo: row.itemNo,
      itemName: row.itemName,
      description: row.description,
      uom: row.uom,
      qty: Number(row.qty),
      requiredDate: row.requiredDate || undefined,
      lineRemarks: row.lineRemarks || "",
    }));

  const budget = form.budgetInfo || {};
  const estVal = budget.estimatedProcurementValue;
  const estimatedProcurementValue =
    estVal === "" || estVal == null ? undefined : Number(estVal);

  return {
    locationId,
    indentNo: form.indentNo,
    indentDate: form.indentDate,
    department: form.department,
    requestedBy: form.requestedBy,
    priority: form.priority,
    requiredByDate: form.requiredByDate || undefined,
    remarks: form.remarks,
    lines,
    status: "Draft",
    procurementInfo: form.procurementInfo || {},
    budgetInfo: {
      ...budget,
      estimatedProcurementValue,
    },
    governanceInfo: form.governanceInfo || {},
    approvalTracking: form.approvalTracking || {},
  };
}

export function computeIndentTotalQty(lines) {
  return (lines || []).reduce((s, row) => s + (Number(row.qty) || 0), 0);
}

function addDaysInputDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function currentFinancialYearLabel() {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const endShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endShort}`;
}

/**
 * Dev/demo sample for Alt+F1 on Purchase Requisition create.
 */
export function buildPurchaseIndentDevFillForm({
  requestedBy = "",
  indentNo = "",
  departmentOptions = [],
  items = [],
} = {}) {
  const department =
    departmentOptions.find((o) => o.value)?.value ??
    departmentOptions[0]?.value ??
    "Operations";
  const requiredByDate = addDaysInputDate(14);
  const sampleLines = (items || [])
    .slice(0, 2)
    .map((item) => ({
      ...emptyIndentLineFromItem(item),
      qty: "10",
      requiredDate: requiredByDate,
      lineRemarks: "Sample line (Alt+F1)",
    }));

  return {
    ...emptyPurchaseIndentForm(requestedBy || "Demo User"),
    indentNo,
    indentDate: todayInputDate(),
    department,
    requestedBy: requestedBy || "Demo User",
    priority: "Urgent",
    requiredByDate,
    remarks: "Auto-filled sample requisition (Alt+F1).",
    lines: sampleLines,
    procurementInfo: {
      requisitionType: "Material",
      procurementCategory: "Direct Purchase",
      costCenter: department,
    },
    budgetInfo: {
      budgetHead: "Office Supplies & Consumables",
      estimatedProcurementValue: "125000",
      budgetAvailable: "Yes",
      fundingSource: "Internal Budget",
      financialYear: currentFinancialYearLabel(),
      budgetReference: "BUD-REF-2026-001",
      budgetRemarks: "Budget verified for sample procurement.",
      budgetVerificationStatus: "Verified",
    },
    governanceInfo: {
      gemApplicable: "No",
      tenderRequired: "No",
      emergencyProcurement: "No",
      boardApprovalRequired: "No",
      procurementJustification: "Routine operational procurement as per annual plan.",
      specialApprovalNotes: "",
    },
    approvalTracking: {
      approvalStatus: "Draft",
      approvedBy: "",
      approvalDate: "",
      approvalRemarks: "",
    },
  };
}
