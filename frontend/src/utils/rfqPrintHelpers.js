import { formatPrintDate } from "./poPrintHelpers.js";

export function buildRfqHeaderPrintRows(rfq) {
  if (!rfq) return [];
  return [
    ["RFQ Number", rfq.rfqNo || "—"],
    ["RFQ Date", formatPrintDate(rfq.rfqDate)],
    ["RFQ Type", rfq.rfqType || "—"],
    ["Department", rfq.department || "—"],
    ["Procurement Category", rfq.procurementCategory || "—"],
    ["Purchase Type", rfq.purchaseType || "—"],
    ["Currency", rfq.currency || "INR"],
    ["Reference PR", rfq.referencePrNo || "—"],
    ["Reference Planning", rfq.referencePlanningRef || "—"],
    ["Required Delivery", formatPrintDate(rfq.requiredDeliveryDate)],
    ["Closing Date", formatPrintDate(rfq.closingDate)],
    ["Buyer", rfq.buyer || "—"],
    ["Status", rfq.displayStatus || rfq.status || "—"],
  ];
}

export function buildRfqVendorPrintRows(vendors = []) {
  return vendors.map((v, i) => [
    String(i + 1),
    v.supplierCode || "—",
    v.supplierName || "—",
    v.preferred ? "Yes" : "No",
    v.msme || "—",
    v.gemRegistered || "—",
    v.contactPerson || "—",
    v.email || "—",
    v.mobile || "—",
  ]);
}

export function buildRfqLinePrintRows(lines = []) {
  return lines
    .filter((l) => Number(l.qty) > 0)
    .map((l, i) => [
      String(i + 1),
      l.lineType === "Service" ? l.serviceCode || "—" : l.itemNo || "—",
      l.lineType === "Service" ? l.serviceName || l.description : l.itemName || l.description,
      l.uom || "—",
      String(l.qty ?? ""),
      formatPrintDate(l.expectedDelivery),
      l.technicalSpecification || "—",
      l.drawingReference || "—",
    ]);
}
