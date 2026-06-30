import { PROCUREMENT_CATEGORY_OPTIONS, YES_NO_OPTIONS } from "./mpbcdcMasterOptions.js";

export { YES_NO_OPTIONS, PROCUREMENT_CATEGORY_OPTIONS };

export const PO_PURCHASE_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
  { value: "Capital Goods", label: "Capital Goods" },
  { value: "AMC", label: "AMC" },
];

export const PO_PROCUREMENT_APPROVAL_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Closed", label: "Closed" },
];

export const PURCHASE_ORDER_DOCUMENT_TYPES = [
  { code: "po_approved_requisition", label: "Approved Purchase Requisition", maxFiles: 5 },
  { code: "po_comparative_statement", label: "Comparative Statement", maxFiles: 5 },
  { code: "po_technical_evaluation", label: "Technical Evaluation", maxFiles: 5 },
  { code: "po_financial_evaluation", label: "Financial Evaluation", maxFiles: 5 },
  { code: "po_tender_approval", label: "Tender Approval", maxFiles: 5 },
  { code: "po_gem_documents", label: "GeM Documents", maxFiles: 5 },
  { code: "po_supporting_documents", label: "Supporting Documents", maxFiles: 10 },
];

export const EMPTY_PROCUREMENT_REFERENCE = {
  procurementCategory: "",
  purchaseType: "",
  sourceListId: "",
  sourceListCode: "",
  sourceListLabel: "",
  vendorEvaluationId: "",
  vendorEvaluationCode: "",
  vendorEvaluationLabel: "",
  rateContractReference: "",
  contractReference: "",
  budgetReference: "",
};

export const EMPTY_GOVERNMENT_PROCUREMENT = {
  gemPurchase: "",
  tenderPurchase: "",
  emergencyProcurement: "",
  boardApprovalRequired: "",
  tenderNumber: "",
  gemBidNumber: "",
  governmentApprovalNumber: "",
  governmentReference: "",
};

export const EMPTY_CAPITAL_PROCUREMENT = {
  assetProcurement: "",
  assetId: "",
  assetCode: "",
  assetName: "",
  capitalizationRequired: "",
  capitalBudgetCode: "",
};

export const EMPTY_PO_APPROVAL_TRACKING = {
  approvalStatus: "",
  approvalAuthority: "",
  approvalDate: "",
  approvalRemarks: "",
};
