import { formatPrintDate } from "./poPrintHelpers.js";

function pushPrintRow(rows, label, value) {
  const v = value === null || value === undefined ? "" : String(value).trim();
  if (!v) return;
  rows.push({ label, value: v });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** MPBCDC key-value rows for purchase requisition print. */
export function buildIndentMpbcdcPrintRows(indent) {
  if (!indent) return [];
  const rows = [];
  const proc = indent.procurementInfo || {};
  const budget = indent.budgetInfo || {};
  const gov = indent.governanceInfo || {};
  const tracking = indent.approvalTracking || {};

  pushPrintRow(rows, "Requisition Type", proc.requisitionType);
  pushPrintRow(rows, "Procurement Category", proc.procurementCategory);
  pushPrintRow(rows, "Cost Center", proc.costCenter);
  pushPrintRow(rows, "Budget Head", budget.budgetHead);
  pushPrintRow(rows, "Estimated Value (₹)", formatMoney(budget.estimatedProcurementValue));
  pushPrintRow(rows, "Funding Source", budget.fundingSource);
  pushPrintRow(rows, "Financial Year", budget.financialYear);
  pushPrintRow(rows, "Budget Verification", budget.budgetVerificationStatus);
  pushPrintRow(rows, "GeM Applicable", gov.gemApplicable);
  pushPrintRow(rows, "Tender Required", gov.tenderRequired);
  pushPrintRow(rows, "Emergency Procurement", gov.emergencyProcurement);
  pushPrintRow(rows, "Approval Status", tracking.approvalStatus || indent.status);
  pushPrintRow(rows, "Approved By", tracking.approvedBy);
  pushPrintRow(rows, "Approval Date", formatPrintDate(tracking.approvalDate));

  return rows;
}

/** Summary rows for attached document types on print. */
export function buildIndentAttachmentPrintRows(files = [], documentTypes = []) {
  const byType = {};
  files.forEach((f) => {
    const code = String(f.documentTypeCode || "").trim();
    if (!code) return;
    if (!byType[code]) byType[code] = [];
    byType[code].push(f);
  });

  const rows = [];
  documentTypes.forEach((dt) => {
    const list = byType[dt.code] || [];
    if (!list.length) return;
    rows.push({
      label: dt.label,
      value: list.map((f) => f.originalName || "File").join(", "),
    });
  });
  return rows;
}
