export const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

export const GOV_VENDOR_TYPE_OPTIONS = [
  { value: "Material Vendor", label: "Material Vendor" },
  { value: "Service Vendor", label: "Service Vendor" },
  { value: "Contractor", label: "Contractor" },
  { value: "Consultant", label: "Consultant" },
];

export const GOV_VENDOR_CLASSIFICATION_OPTIONS = [
  { value: "Local", label: "Local" },
  { value: "National", label: "National" },
  { value: "International", label: "International" },
];

export const COMPLIANCE_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Pending Verification", label: "Pending Verification" },
  { value: "Verified", label: "Verified" },
  { value: "Blocked", label: "Blocked" },
];

export const VENDOR_DOCUMENT_TYPES = [
  { code: "vendor_pan_document", label: "PAN Document", maxFiles: 1 },
  { code: "vendor_gst_certificate", label: "GST Certificate", maxFiles: 1 },
  { code: "vendor_msme_certificate", label: "MSME Certificate", maxFiles: 1 },
  { code: "vendor_gem_registration_certificate", label: "GeM Registration Certificate", maxFiles: 1 },
  { code: "vendor_cancelled_cheque", label: "Cancelled Cheque", maxFiles: 1 },
  { code: "vendor_other_supporting", label: "Other Supporting Documents", maxFiles: 10 },
];
