import { formatPrintDate } from "./poPrintHelpers.js";

function pushPrintRow(rows, label, value) {
  if (value === null || value === undefined || !String(value).trim()) return;
  rows.push({ label, value: String(value).trim() });
}

/** Optional MPBCDC fields for GRN print — only non-empty values. */
export function buildGrnMpbcdcPrintRows(grn) {
  if (!grn) return [];
  const proc = grn.procurementReference || {};
  const receipt = grn.receiptInformation || {};
  const gov = grn.governmentProcurement || {};
  const cap = grn.capitalProcurement || {};
  const auth = grn.receivingAuthority || {};
  const rows = [];

  pushPrintRow(rows, "Purchase Requisition", proc.purchaseRequisitionNo);
  pushPrintRow(rows, "Procurement Category", proc.procurementCategory);
  pushPrintRow(rows, "Purchase Type", proc.purchaseType);
  pushPrintRow(rows, "Purchase Order Reference", grn.poNo);
  pushPrintRow(rows, "Source List Reference", proc.sourceListLabel || proc.sourceListCode);
  pushPrintRow(rows, "Vendor Evaluation Reference", proc.vendorEvaluationLabel || proc.vendorEvaluationCode);
  pushPrintRow(rows, "Contract Reference", proc.contractReference);
  pushPrintRow(rows, "Budget Reference", proc.budgetReference);
  pushPrintRow(rows, "Receipt Type", receipt.receiptType);
  pushPrintRow(rows, "Receipt Status", receipt.receiptStatus);
  pushPrintRow(rows, "Inspection Required", receipt.inspectionRequired);
  pushPrintRow(rows, "QC Status", receipt.qcStatus);
  if (receipt.acceptedQuantity != null && receipt.acceptedQuantity !== "") {
    pushPrintRow(rows, "Accepted Quantity", receipt.acceptedQuantity);
  }
  if (receipt.rejectedQuantity != null && receipt.rejectedQuantity !== "") {
    pushPrintRow(rows, "Rejected Quantity", receipt.rejectedQuantity);
  }
  if (receipt.shortQuantity != null && receipt.shortQuantity !== "") {
    pushPrintRow(rows, "Short Quantity", receipt.shortQuantity);
  }
  if (receipt.excessQuantity != null && receipt.excessQuantity !== "") {
    pushPrintRow(rows, "Excess Quantity", receipt.excessQuantity);
  }
  pushPrintRow(rows, "GeM Procurement", gov.gemProcurement);
  pushPrintRow(rows, "Tender Procurement", gov.tenderProcurement);
  pushPrintRow(rows, "Inspection Certificate Available", gov.inspectionCertificateAvailable);
  pushPrintRow(rows, "Government Inspection Required", gov.governmentInspectionRequired);
  pushPrintRow(rows, "Inspection Certificate Number", gov.inspectionCertificateNumber);
  pushPrintRow(rows, "Inspection Agency", gov.inspectionAgency);
  if (gov.inspectionDate) {
    pushPrintRow(rows, "Inspection Date", formatPrintDate(gov.inspectionDate));
  }
  pushPrintRow(rows, "Government Remarks", gov.governmentRemarks);
  pushPrintRow(rows, "Asset Creation Required", cap.assetCreationRequired);
  pushPrintRow(rows, "Asset Reference", cap.assetName || cap.assetCode);
  pushPrintRow(rows, "Capitalization Pending", cap.capitalizationPending);
  pushPrintRow(rows, "Asset Tag Number", cap.assetTagNumber);
  pushPrintRow(rows, "Received By", auth.receivedByName);
  pushPrintRow(rows, "Verified By", auth.verifiedByName);
  if (auth.verifiedDate) {
    pushPrintRow(rows, "Verified Date", formatPrintDate(auth.verifiedDate));
  }
  pushPrintRow(rows, "Receiving Remarks", auth.receivingRemarks);
  return rows;
}
