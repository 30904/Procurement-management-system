/** Master Data category keys (Settings → Master Data). Keys must match stored `category` in DB. */
export const MASTER_DATA_CATEGORY = {
  /** UI label: Vendor Category */
  SUPPLIER_CATEGORY: "Supplier Category",
  CUSTOMER_CATEGORY: "Customer Category",
  LSP_CATEGORY: "LSP Category",
  PAYMENT_TERMS: "Payment Terms",
  FREIGHT_TERMS: "Freight Terms",
  FREIGHT_SERVICE_TYPE: "Type of Freight Service",
  RCM_APPLICABILITY: "RCM Applicability",
  ACCOUNT_TYPE: "Account Type",
  /** DB key — UI label: Material Category */
  ITEM_CATEGORY: "Item Category",
  PRODUCT_CATEGORY: "Product Category",
  UOM: "UoM",
  INVENTORY_STORE: "Inventory Store",
  ASSET_CATEGORY: "Asset Category",
  ASSET_LOCATION: "Asset Location",
  ASSET_SUB_LOCATION: "Asset Sub Location",
  SERVICE_CATEGORY: "Service Category",
  GST_REGIME_APPLICABILITY: "GST Regime Applicability",
  TAXABILITY_TYPE: "Taxability Type",
  ITC_ALLOWED: "ITC Allowed",
  TDS_APPLICABILITY: "TDS Applicability",
  TDS_SECTION: "TDS Section",
  TDS_RATE: "TDS Rate %",
  COST_CENTER: "Cost Center",
  PO_TYPE: "PO Type",
  INCIDENTAL_EXPENSES: "Incidental Expenses",
  MODE_OF_TRANSPORT: "Mode of Transport",
  /** DB key — UI label: Material Incoming QCL */
  ITEM_INCOMING_QCL: "Item Incoming QCL",
  INSPECTION_STANDARD: "Inspection Standard",
  MAINTENANCE_ISSUE_CATEGORY: "Maintenance Issue Category",
  BDM_MAINTENANCE_STATUS: "BDM Maintenance Status",
  LEAD_SOURCE: "Lead Source",
  LOST_REASON: "Lost Reason",
  NPD_STAGE: "NPD Stage",
  INDUSTRY_TYPE: "Industry Type",
};

/** User-facing labels for master data category keys (DB values unchanged). */
export const MASTER_DATA_CATEGORY_LABEL = {
  "Item Category": "Material Category",
  "Item Incoming QCL": "Material Incoming QCL",
};

export function masterDataCategoryLabel(category) {
  return MASTER_DATA_CATEGORY_LABEL[category] ?? category;
}
