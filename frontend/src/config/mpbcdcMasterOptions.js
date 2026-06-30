export const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

export const MATERIAL_TYPE_OPTIONS = [
  { value: "Consumable", label: "Consumable" },
  { value: "Capital Good", label: "Capital Good" },
  { value: "Asset Linked", label: "Asset Linked" },
];

export const PROCUREMENT_CATEGORY_OPTIONS = [
  { value: "Direct Purchase", label: "Direct Purchase" },
  { value: "Tender", label: "Tender" },
  { value: "GeM", label: "GeM" },
  { value: "Rate Contract", label: "Rate Contract" },
];

export const STOCK_TYPE_OPTIONS = [
  { value: "Stock Item", label: "Stock Item" },
  { value: "Non Stock Item", label: "Non Stock Item" },
];

export const APPROVAL_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Blocked", label: "Blocked" },
];

export const SERVICE_APPROVAL_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Approved", label: "Approved" },
  { value: "Blocked", label: "Blocked" },
];

export const SERVICE_TYPE_OPTIONS = [
  { value: "Recurring", label: "Recurring" },
  { value: "One Time", label: "One Time" },
];

export const ASSET_CLASSIFICATION_OPTIONS = [
  { value: "IT Asset", label: "IT Asset" },
  { value: "Machinery", label: "Machinery" },
  { value: "Vehicle", label: "Vehicle" },
  { value: "Furniture", label: "Furniture" },
  { value: "Infrastructure", label: "Infrastructure" },
];

export const PROCUREMENT_MODE_OPTIONS = [
  { value: "Tender", label: "Tender" },
  { value: "GeM", label: "GeM" },
  { value: "Direct", label: "Direct" },
];

export const ASSET_LIFECYCLE_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Under Procurement", label: "Under Procurement" },
  { value: "Retired", label: "Retired" },
];

export const TRANSPORT_CATEGORY_OPTIONS = [
  { value: "Road", label: "Road" },
  { value: "Rail", label: "Rail" },
  { value: "Air", label: "Air" },
  { value: "Sea", label: "Sea" },
];

export const SERVICE_COVERAGE_OPTIONS = [
  { value: "Local", label: "Local" },
  { value: "State", label: "State" },
  { value: "National", label: "National" },
];

export const SOURCE_TYPE_OPTIONS = [
  { value: "GeM", label: "GeM" },
  { value: "Tender", label: "Tender" },
  { value: "Direct", label: "Direct" },
  { value: "Rate Contract", label: "Rate Contract" },
];

export const SOURCE_ITEM_TYPE_OPTIONS = [
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
];

export const ACTIVE_INACTIVE_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export const EMPTY_ITEM_PROCUREMENT = {
  materialType: "",
  procurementCategory: "",
  stockType: "",
  gemApplicable: "",
};

export const EMPTY_ITEM_GOVERNANCE = {
  approvalStatus: "Draft",
  approvedBy: "",
  approvalDate: "",
  remarks: "",
};

export const EMPTY_SERVICE_MPBCDC = {
  serviceType: "",
  gemApplicable: "",
  approvalStatus: "Draft",
};

export const EMPTY_ASSET_PROCUREMENT = {
  assetClassification: "",
  procurementMode: "",
  purchaseReference: "",
  poReference: "",
  assetLifecycleStatus: "",
};

export const EMPTY_LOGISTICS_MPBCDC = {
  transportCategory: "",
  serviceCoverage: "",
  gemRegistered: "",
  approvalStatus: "Draft",
};

export const EMPTY_PAYMENT_TERMS_MPBCDC = {
  approvalStatus: "Draft",
  activeFrom: "",
  activeTo: "",
  governmentApproved: "",
};

export const EMPTY_TAX_MPBCDC = {
  governmentCategory: "",
  applicableCategory: "",
  activeFrom: "",
  activeTo: "",
};
