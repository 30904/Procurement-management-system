import { PROCUREMENT_CATEGORY_OPTIONS, YES_NO_OPTIONS } from "./mpbcdcMasterOptions.js";

export { YES_NO_OPTIONS, PROCUREMENT_CATEGORY_OPTIONS };

export const GRN_PURCHASE_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
  { value: "Capital Goods", label: "Capital Goods" },
  { value: "AMC", label: "AMC" },
];

export const GRN_RECEIPT_TYPE_OPTIONS = [
  { value: "Material Receipt", label: "Material Receipt" },
  { value: "Service Receipt", label: "Service Receipt" },
  { value: "Capital Goods Receipt", label: "Capital Goods Receipt" },
];

export const GRN_RECEIPT_STATUS_OPTIONS = [
  { value: "Pending Inspection", label: "Pending Inspection" },
  { value: "Accepted", label: "Accepted" },
  { value: "Partially Accepted", label: "Partially Accepted" },
  { value: "Rejected", label: "Rejected" },
];

export const GRN_QC_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

export const GRN_DOCUMENT_TYPES = [
  { code: "grn_delivery_challan", label: "Delivery Challan", maxFiles: 5 },
  { code: "grn_supplier_invoice", label: "Supplier Invoice Copy", maxFiles: 5 },
  { code: "grn_inspection_certificate", label: "Inspection Certificate", maxFiles: 5 },
  { code: "grn_test_certificate", label: "Test Certificate", maxFiles: 5 },
  { code: "grn_packing_list", label: "Packing List", maxFiles: 5 },
  { code: "grn_receipt_photos", label: "Material Receipt Photos", maxFiles: 10 },
  { code: "grn_supporting_documents", label: "Other Supporting Documents", maxFiles: 10 },
];

export const EMPTY_GRN_PROCUREMENT_REFERENCE = {
  purchaseRequisitionId: "",
  purchaseRequisitionNo: "",
  procurementCategory: "",
  purchaseType: "",
  sourceListId: "",
  sourceListCode: "",
  sourceListLabel: "",
  vendorEvaluationId: "",
  vendorEvaluationCode: "",
  vendorEvaluationLabel: "",
  contractReference: "",
  budgetReference: "",
};

export const EMPTY_GRN_RECEIPT_INFORMATION = {
  receiptType: "",
  receiptStatus: "",
  inspectionRequired: "",
  qcStatus: "",
  acceptedQuantity: "",
  rejectedQuantity: "",
  shortQuantity: "",
  excessQuantity: "",
};

export const EMPTY_GRN_GOVERNMENT_PROCUREMENT = {
  gemProcurement: "",
  tenderProcurement: "",
  inspectionCertificateAvailable: "",
  governmentInspectionRequired: "",
  inspectionCertificateNumber: "",
  inspectionAgency: "",
  inspectionDate: "",
  governmentRemarks: "",
};

export const EMPTY_GRN_CAPITAL_PROCUREMENT = {
  assetCreationRequired: "",
  assetId: "",
  assetCode: "",
  assetName: "",
  capitalizationPending: "",
  assetTagNumber: "",
};

export const EMPTY_GRN_RECEIVING_AUTHORITY = {
  receivedById: "",
  receivedByName: "",
  verifiedById: "",
  verifiedByName: "",
  verifiedDate: "",
  receivingRemarks: "",
};
