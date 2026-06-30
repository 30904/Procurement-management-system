import { PROCUREMENT_CATEGORY_OPTIONS } from "./mpbcdcMasterOptions.js";

export { PROCUREMENT_CATEGORY_OPTIONS };

export const RFQ_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
  { value: "Mixed", label: "Mixed" },
];

export const RFQ_PURCHASE_TYPE_OPTIONS = [
  { value: "Domestic", label: "Domestic" },
  { value: "Import", label: "Import" },
  { value: "Capital", label: "Capital" },
  { value: "Rate Contract", label: "Rate Contract" },
];

export const RFQ_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Awarded", label: "Awarded" },
  { value: "Expired", label: "Expired" },
];

export const RFQ_CURRENCY_OPTIONS = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

export const RFQ_DOCUMENT_TYPES = [
  { code: "rfq_technical_spec", label: "Technical Specification", maxFiles: 5 },
  { code: "rfq_drawing", label: "Drawing / Annexure", maxFiles: 5 },
  { code: "rfq_terms", label: "Terms & Conditions", maxFiles: 3 },
  { code: "rfq_supporting", label: "Supporting Documents", maxFiles: 10 },
];

export const RFQ_LINE_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
];
