import { PROCUREMENT_CATEGORY_OPTIONS, YES_NO_OPTIONS } from "./mpbcdcMasterOptions.js";

export { YES_NO_OPTIONS, PROCUREMENT_CATEGORY_OPTIONS };

export const REQUISITION_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
  { value: "Capital Goods", label: "Capital Goods" },
  { value: "AMC", label: "AMC" },
  { value: "Recurring Service", label: "Recurring Service" },
];

export const FUNDING_SOURCE_OPTIONS = [
  { value: "Internal Budget", label: "Internal Budget" },
  { value: "Government Grant", label: "Government Grant" },
  { value: "Project Budget", label: "Project Budget" },
  { value: "Special Allocation", label: "Special Allocation" },
];

export const BUDGET_VERIFICATION_STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Verified", label: "Verified" },
  { value: "Not Required", label: "Not Required" },
];

export const REQUISITION_APPROVAL_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

export const PURCHASE_INDENT_DOCUMENT_TYPES = [
  { code: "pi_budget_approval", label: "Budget Approval", maxFiles: 5 },
  { code: "pi_technical_note", label: "Technical Note", maxFiles: 5 },
  { code: "pi_justification_note", label: "Justification Note", maxFiles: 5 },
  { code: "pi_board_note", label: "Board Note", maxFiles: 5 },
  { code: "pi_supporting_documents", label: "Supporting Documents", maxFiles: 10 },
];

export const EMPTY_PROCUREMENT_INFO = {
  requisitionType: "",
  procurementCategory: "",
  costCenter: "",
};

export const EMPTY_BUDGET_INFO = {
  budgetHead: "",
  estimatedProcurementValue: "",
  budgetAvailable: "",
  fundingSource: "",
  financialYear: "",
  budgetReference: "",
  budgetRemarks: "",
  budgetVerificationStatus: "",
};

export const EMPTY_GOVERNANCE_INFO = {
  gemApplicable: "",
  tenderRequired: "",
  emergencyProcurement: "",
  boardApprovalRequired: "",
  procurementJustification: "",
  specialApprovalNotes: "",
};

export const EMPTY_APPROVAL_TRACKING = {
  approvalStatus: "",
  approvedBy: "",
  approvalDate: "",
  approvalRemarks: "",
};
