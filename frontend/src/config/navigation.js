/** Base path for authenticated app area */
export const APP_BASE = "/app";

export function appPath(segment) {
  if (!segment) return APP_BASE;
  const s = String(segment).replace(/^\/+/, "");
  return `${APP_BASE}/${s}`.replace(/\/+/g, "/");
}

/** Copy for placeholder screens keyed by segment path under /app. */
const ERP_MODULE_LABELS = {
  "leads-npd": "Leads & NPD",
  planning: "Planning",
  sales: "Sales",
  purchase: "Purchase",
  stores: "Stores",
  production: "Production",
  maintenance: "Maintenance",
  quality: "Quality",
  dispatch: "Dispatch",
  hrm: "HR",
  accounts: "Accounts",
  finance: "Finance",
};

function buildHubModuleCopy(hubSegment, hubTitle, { hubDescription, childDescription }) {
  const entries = {
    [hubSegment]: { title: hubTitle, description: hubDescription },
  };
  for (const [segment, label] of Object.entries(ERP_MODULE_LABELS)) {
    entries[`${hubSegment}/${segment}`] = {
      title: label,
      description: childDescription(label),
    };
  }
  return entries;
}

export const MODULE_COPY = {
  "leads-npd": {
    title: "Leads & NPD",
    description: "Leads and new product development.",
  },
  "leads-npd/npd-request": {
    title: "NPD Request",
    description: "Create and manage new product development requests.",
  },
  "leads-npd/npd-feasibility": {
    title: "NPD Feasibility",
    description: "Assess feasibility for NPD initiatives.",
  },
  "leads-npd/dashboard": {
    title: "Leads & NPD Dashboard",
    description: "Pipeline KPIs, opportunity metrics, and NPD stage visibility.",
  },
  "leads-npd/lead-register": {
    title: "Lead Register",
    description: "Capture enquiries and move them through sales stages.",
  },
  "leads-npd/opportunity": {
    title: "Opportunity Management",
    description: "Track qualified opportunities and expected revenue.",
  },
  "leads-npd/quotation": {
    title: "Quotation Management",
    description: "Manage quotation lifecycle linked to opportunities.",
  },
  "leads-npd/sample-development": {
    title: "Sample Development",
    description: "Track sample preparation and handoff.",
  },
  "leads-npd/customer-trial": {
    title: "Customer Trial",
    description: "Capture customer validation outcomes and rework loops.",
  },
  "leads-npd/commercialization": {
    title: "Product Commercialization",
    description: "Move approved NPDs into SKU/BOM/Routing readiness.",
  },
  "leads-npd/configuration": {
    title: "Leads & NPD Configuration",
    description: "Configure pipeline stages, workflows, and approvals.",
  },
  purchase: {
    title: "Purchase",
    description: "Purchase orders, planning, delivery challans, and related workflows.",
  },
  "purchase/purchase-order": {
    title: "Purchase Orders",
    description: "Create, amend, cancel, and manage purchase orders.",
  },
  "purchase/purchase-order/generate-po": {
    title: "Purchase Orders",
    description: "View and create purchase orders.",
  },
  "purchase/purchase-order/generate-po/new": {
    title: "New Purchase Order",
    description: "Create a new purchase order.",
  },
  "purchase/purchase-order/generate-po/:id": {
    title: "Purchase Order",
    description: "View purchase order details.",
  },
  "purchase/purchase-order/generate-po/:id/edit": {
    title: "Edit Purchase Order",
    description: "Edit a draft purchase order.",
  },
  "purchase/purchase-order/generate-po/:id/print": {
    title: "Purchase Order Preview",
    description: "Print preview of purchase order (A4).",
  },
  "purchase/purchase-order/amend-po": {
    title: "Amend PO",
    description: "Amend open purchase orders.",
  },
  "purchase/purchase-order/cancel-po": {
    title: "Cancel PO",
    description: "Cancel purchase orders.",
  },
  "purchase/purchase-order/short-po-closing": {
    title: "Short PO Closing",
    description: "Short-close partially received POs.",
  },
  "purchase/purchase-order/repeat-po": {
    title: "Repeat PO",
    description: "Repeat a previous purchase order.",
  },
  "purchase/purchase-order-domestic": {
    title: "Domestic Purchase Orders",
    description: "Domestic purchase orders.",
  },
  "purchase/purchase-order-import": {
    title: "Import Purchase Orders",
    description: "Import purchase orders.",
  },
  "purchase/debit-note": { title: "Debit Notes", description: "Debit note processing." },
  "purchase/pr-to-po": { title: "PR to PO", description: "Convert purchase requisitions to purchase orders." },
  "purchase/material-purchase-planning": {
    title: "Procurement Planning",
    description: "Plan material purchases.",
  },
  "purchase/delivery-challan-e-way-bill": {
    title: "Delivery Challan E-Way Bill",
    description: "Delivery challan and e-way bill.",
  },
  "purchase/service-po": {
    title: "Service Purchase Orders",
    description: "Generate, amend, and cancel service purchase orders.",
  },
  "purchase/service-po/generate-spo": {
    title: "Generate SPO",
    description: "Create new service purchase orders.",
  },
  "purchase/service-po/cancel-spo": {
    title: "Cancel SPO",
    description: "Cancel service purchase orders.",
  },
  "purchase/service-po/amend-spo": {
    title: "Amend SPO",
    description: "Amend open service purchase orders.",
  },
  "purchase/mjw-delivery-challan": {
    title: "MJW Delivery Challan",
    description: "MJW delivery challan.",
  },
  "purchase/job-work": {
    title: "Job Work",
    description: "Job work orders and subcontractor processing.",
  },
  "purchase/job-work/generate-jwo": {
    title: "Generate JWO",
    description: "Create and approve job work orders.",
  },
  "purchase/intra-delivery-challan": {
    title: "Intra Delivery Challan",
    description: "Intra delivery challan.",
  },
  "purchase/pinv-authorisation": {
    title: "Invoice Verification",
    description: "Purchase invoice authorisation.",
  },
  "purchase/delivery-challan-generic": {
    title: "Delivery Challan (Generic)",
    description: "Generic delivery challan.",
  },
  "purchase/purchase-indent": {
    title: "Purchase Requisition — Summary",
    description: "View and manage draft purchase requisitions.",
  },
  "purchase/purchase-indent/new": {
    title: "New Purchase Requisition",
    description: "Create a new purchase requisition.",
  },
  "purchase/purchase-indent/:id": {
    title: "Purchase Requisition",
    description: "View, approve, or cancel a purchase requisition.",
  },
  "purchase/purchase-indent/:id/edit": {
    title: "Edit Purchase Requisition",
    description: "Edit a draft purchase requisition.",
  },
  "purchase/rfq-management": {
    title: "RFQ Management",
    description: "Manage request for quotation cycles.",
  },
  "purchase/quotation-management": {
    title: "Quotation Management",
    description: "Capture and track vendor quotations.",
  },
  "purchase/comparative-statement": {
    title: "Comparative Statement",
    description: "Compare vendor quotes for procurement award.",
  },
  "purchase/contract-management": {
    title: "Contract Management",
    description: "Manage procurement contracts.",
  },
  finance: {
    title: "Finance",
    description: "Invoice verification and finance workflows.",
  },
  "finance/invoice-verification": {
    title: "Invoice Verification",
    description: "Verify vendor invoices for payment processing.",
  },
  stores: {
    title: "Stores",
    description: "Goods inward, transfer, GRN, inventory, and stores workflows.",
  },
  "stores/grn": { title: "Goods Receipt", description: "Goods receipt note." },
  "stores/goods-inward": { title: "Material Receipt", description: "Record material receipt." },
  "stores/goods-transfer": { title: "Material Transfer", description: "Transfer material between locations." },
  "stores/goods-return-acceptance": {
    title: "Goods Return Acceptance",
    description: "Accept returned goods.",
  },
  "stores/cancel-grn": { title: "Cancel Goods Receipt", description: "Cancel goods receipt notes." },
  "stores/rework-authorisation": {
    title: "ReWork Authorisation",
    description: "Authorise rework for returned or rejected goods.",
  },
  "stores/purchase-requisition": {
    title: "Purchase Requisition",
    description: "Stores purchase requisition.",
  },
  "stores/inventory-inward-entry": {
    title: "Inventory Adjustment",
    description: "Inventory adjustment entry.",
  },
  "stores/stores-inventory-reco": {
    title: "Physical Verification",
    description: "Stores inventory reconciliation.",
  },
  "stores/gte": { title: "GTE", description: "Goods transfer entry." },
  "stores/finished-goods-inward-entry": {
    title: "Finished Goods Inward Entry",
    description: "Finished goods inward entry.",
  },
  "stores/intra-delivery-challan": {
    title: "Intra Delivery Challan",
    description: "Intra delivery challan from stores.",
  },
  "stores/debit-note": { title: "Debit Note", description: "Stores debit note." },
  "stores/delivery-challan-e-way-bill": {
    title: "Delivery Challan E-Way Bill",
    description: "Delivery challan and e-way bill.",
  },
  "stores/goods-return-rm-quarantine-stores": {
    title: "Goods Return to RM Quarantine Stores",
    description: "Return goods to RM quarantine stores.",
  },
  "stores/gin": { title: "GIN", description: "Goods issue note." },
  "stores/smart-gte-intra": { title: "Smart GTE (Intra)", description: "Smart intra goods transfer entry." },
  "stores/drn-for-goods-return": {
    title: "DRN for Goods Return",
    description: "Debit return note for goods return.",
  },
  // "stores/gate-pass": {
  //   title: "Gate Pass",
  //   description: "Issue gate passes for material movement.",
  // },
  production: {
    title: "Production",
    description: "Manufacturing, job cards, inventory reco, and production workflows.",
  },
  "production/electronic-mfg-ems": {
    title: "Electronic Mfg. EMS",
    description: "Electronic manufacturing EMS.",
  },
  "production/engineering-service-request": {
    title: "Engineering Service Request",
    description: "Engineering service requests.",
  },
  "production/smart-gtr": { title: "Smart GTR", description: "Smart goods transfer request." },
  "production/jc-entry": { title: "JC Entry", description: "Job card entry." },
  "production/jw-delivery-challan": {
    title: "JW Delivery Challan",
    description: "Job work delivery challan.",
  },
  "production/product-sku": { title: "Product (SKU)", description: "Product and SKU management." },
  "production/production-inventory-reco": {
    title: "Production Inventory Reco",
    description: "Production inventory reconciliation.",
  },
  "production/goods-return-rm-quarantine-stores": {
    title: "Goods Return to RM Quarantine Stores",
    description: "Return goods to RM quarantine stores from production.",
  },
  maintenance: {
    title: "Maintenance",
    description: "Breakdown, preventive maintenance, and related workflows.",
  },
  "maintenance/breakdown-maintenance": {
    title: "Breakdown Maintenance",
    description: "Breakdown maintenance requests and tracking.",
  },
  "maintenance/preventive-maintenance": {
    title: "Preventive Maintenance",
    description: "Scheduled preventive maintenance.",
  },
  "maintenance/purchase-requisition": {
    title: "Purchase Requisition",
    description: "Maintenance purchase requisitions.",
  },
  "maintenance/goods-transfer-request-intra": {
    title: "Goods Transfer Request (Intra)",
    description: "Intra goods transfer requests for maintenance.",
  },
  quality: {
    title: "Quality",
    description: "Quality control, inspections, batch release, and QC workflows.",
  },
  "quality/mrn": { title: "MRN", description: "Material receipt note for quality." },
  "quality/wo-execution": { title: "WO Execution", description: "Work order execution." },
  "quality/pdir-entry": { title: "PDIR Entry", description: "PDIR entry." },
  "quality/purchase-requisition": {
    title: "Purchase Requisition",
    description: "Quality purchase requisitions.",
  },
  "quality/job-card-entry": { title: "Job Card Entry", description: "Job card entry." },
  "quality/rejection-summary": { title: "Rejection Summary", description: "Rejection summary reports." },
  "quality/gtr": { title: "GTR", description: "Goods transfer request." },
  "quality/jc-entry": { title: "JC Entry", description: "Job card entry (JC)." },
  "quality/material-re-validation": {
    title: "Material Re-Validation",
    description: "Material re-validation.",
  },
  "quality/qc-batch-release-entry": {
    title: "QC Batch Release Entry",
    description: "QC batch release entry.",
  },
  "quality/batch-card-execution": {
    title: "Batch Card Execution",
    description: "Batch card execution.",
  },
  sales: {
    title: "Sales",
    description: "Sales masters, customers, SKU, and product data.",
  },
  "sales/gst-s": { title: "GST/S", description: "GST and state configuration." },
  "sales/service-master": { title: "Service Master", description: "Service master data." },
  "sales/b2b-customer": { title: "B2B Customer", description: "B2B customer master." },
  "sales/sku": { title: "SKU", description: "SKU master." },
  "sales/sku-customer-interface": {
    title: "SKU-Customer Interface",
    description: "SKU and customer interface mapping.",
  },
  "sales/logistics": { title: "Logistics", description: "Logistics master data." },
  "sales/customer-open-po": { title: "Customer Open PO", description: "Customer open purchase orders." },
  "sales/product-master": { title: "Product Master", description: "Product master data." },
  "masters/sales": { title: "Sales", description: "Sales master data under Masters." },
  "masters/sales/gst-s": { title: "GST/S", description: "GST and state configuration." },
  "masters/sales/gst-s/hsn-s-master": {
    title: "HSN/S Summary",
    description: "HSN/S master data — codes, tax rates, and revisions.",
  },
  "masters/sales/gst-s/sac-s-master": { title: "SAC/S Master", description: "SAC/S master data." },
  "masters/sales/service-master": { title: "Service Master", description: "Service master data." },
  "masters/sales/b2b-customer": { title: "B2B Customer", description: "B2B customer master." },
  "masters/sales/sku": { title: "SKU", description: "SKU master." },
  "masters/sales/sku-customer-interface": {
    title: "SKU-Customer Interface",
    description: "SKU and customer interface mapping.",
  },
  "masters/sales/logistics": { title: "Logistics", description: "Logistics master data." },
  "masters/sales/customer-open-po": {
    title: "Customer Open PO",
    description: "Customer open purchase orders.",
  },
  "masters/sales/product-master": { title: "Product Master", description: "Product master data." },
  "masters/purchase": { title: "Purchase", description: "Purchase master data under Masters." },
  "masters/purchase/gst-p": { title: "Tax Masters", description: "Tax configuration for procurement." },
  "masters/purchase/gst-p/hsn-p-master": {
    title: "HSN Master",
    description: "HSN master data — codes, tax rates, and revisions.",
  },
  "masters/purchase/gst-p/sac-p-master": { title: "SAC Master", description: "SAC master data." },
  "masters/purchase/service-master": { title: "Service Master", description: "Service master data." },
  "masters/purchase/supplier": {
    title: "Vendor Master",
    description: "Vendor master — codes, addresses, bank details, and status.",
  },
  "masters/purchase/item-master": { title: "Material Master", description: "Material master data." },
  "masters/purchase/prospect-supplier": { title: "Prospect Vendor", description: "Prospect vendor master." },
  "masters/purchase/upload-item-master": { title: "Upload Material Master", description: "Upload material master data." },
  "masters/purchase/logistics": { title: "Logistics Master", description: "Logistics master data." },
  "masters/purchase/asset-master-capitalised": {
    title: "Asset Master",
    description: "Asset master data.",
  },
  "masters/purchase/payment-terms": {
    title: "Payment Terms Summary",
    description: "Payment terms master.",
  },
  "masters/purchase/service-master-r1": { title: "Service Master R1", description: "Service master R1." },
  "masters/purchase/source-list": { title: "Source List", description: "Approved vendor source list." },
  "masters/purchase/vendor-evaluation": { title: "Vendor Evaluation", description: "Vendor evaluation and scorecards." },
  "configuration/item-document-types": {
    title: "Material Document Types",
    description: "Configure drawing and document upload types for Material Master.",
  },
  "configuration/po-type": {
    title: "PO Type",
    description: "Configure purchase order types and display order for Purchase Orders.",
  },
  "configuration/incidental-expenses": {
    title: "Incidental Expenses",
    description: "Configure incidental expense types and display order for purchase orders.",
  },
  "configuration/po-terms-and-conditions": {
    title: "PO Terms & Conditions",
    description: "Configure opening line and terms appended to supplier purchase order copies.",
  },
  "configuration/item-attributes": {
    title: "Material Attributes",
    description: "Configure industry-specific attribute definitions for Material Master.",
  },
  "masters/purchase/stock-levels": { title: "Stock Levels", description: "Stock levels master." },
  "masters/purchase/old-item-master": { title: "Old Material Master", description: "Legacy material master." },
  "masters/purchase/supplier-evaluation-master": {
    title: "Supplier Evaluation Master",
    description: "Supplier evaluation master.",
  },
  "masters/purchase/transporter-master": { title: "Transporter Master", description: "Transporter master." },
  "purchase/purchase-indent/approved": {
    title: "Approved Requisitions",
    description: "Approved purchase requisitions and linked purchase orders.",
  },
  "masters/planning": { title: "Planning", description: "Planning master data under Masters." },
  "masters/planning/sku-attributes": { title: "SKU Attributes", description: "SKU attributes." },
  "masters/planning/bom": { title: "BOM", description: "Bill of material master." },
  "masters/planning/stock-levels": { title: "Stock Levels", description: "Stock levels and reorder planning." },
  "masters/planning/stock-levels/item-inl": {
    title: "Material INL",
    description: "Material inventory level summary with min-max and reorder calculations.",
  },
  "masters/planning/jw-master": { title: "JW Master", description: "Job-work master data." },
  "masters/planning/prospect-master": { title: "Prospect Master", description: "Prospect master data." },
  "masters/planning/npd-master": { title: "NPD Master", description: "NPD master data." },
  "masters/planning/old-item-master": { title: "Old Material Master", description: "Legacy material master." },
  "masters/planning/process-master": { title: "Process Master", description: "Process master data." },
  "masters/planning/supplier-master": { title: "Supplier Master", description: "Supplier master data." },
  "masters/planning/b2b-customer": { title: "B2B Customer", description: "B2B customer master." },
  "masters/planning/sku-master": { title: "SKU Master", description: "SKU master data." },
  "masters/planning/sku-process-flow": { title: "SKU Process Flow", description: "SKU process flow master." },
  "masters/planning/bill-of-material": { title: "Bill of Material", description: "Bill of material master." },
  "masters/leads-npd": { title: "NPD", description: "NPD master data under Masters." },
  "masters/leads-npd/prospect-master": { title: "Prospect Master", description: "Prospect master data." },
  "masters/leads-npd/npd-master": { title: "NPD Master", description: "NPD master data." },
  "masters/leads-npd/old-item-master": { title: "Old Material Master", description: "Legacy material master." },
  "masters/leads-npd/process-master": { title: "Process Master", description: "Process master data." },
  "masters/leads-npd/supplier-master": { title: "Supplier Master", description: "Supplier master data." },
  "masters/leads-npd/b2b-customer": { title: "B2B Customer", description: "B2B customer master." },
  "masters/leads-npd/sku-master": { title: "SKU Master", description: "SKU master data." },
  "masters/leads-npd/sku-attributes": { title: "SKU Attributes", description: "SKU attributes." },
  "masters/leads-npd/sku-process-flow": { title: "SKU Process Flow", description: "SKU process flow master." },
  "masters/leads-npd/bill-of-material": { title: "Bill of Material", description: "Bill of material master." },
  "masters/production": { title: "Production", description: "Production master data under Masters." },
  "masters/production/electronic-mfg-ems": {
    title: "Electronic Mfg. EMS",
    description: "Electronic manufacturing EMS master.",
  },
  "masters/production/mould-master": { title: "Mould Master", description: "Mould master data." },
  "masters/production/product-lines": { title: "Product Lines", description: "Product lines master." },
  "masters/production/std-cost-sheet": { title: "STD Cost Sheet", description: "Standard cost sheet master." },
  "masters/production/demand-source": { title: "Demand Source", description: "Demand source master." },
  "masters/maintenance": { title: "Maintenance", description: "Maintenance master data under Masters." },
  "masters/maintenance/production-line": {
    title: "Production Line",
    description: "Production line master.",
  },
  "masters/maintenance/tool-master": { title: "Tool Master", description: "Tool master data." },
  "masters/maintenance/tool-customer-interface": {
    title: "Tool - Customer Interface",
    description: "Tool and customer interface mapping.",
  },
  "masters/maintenance/asset-master": { title: "Asset Master", description: "Asset master data." },
  "masters/maintenance/quality-equipment-master": {
    title: "Quality Equipment Master",
    description: "Quality equipment master data.",
  },
  "masters/quality": { title: "Quality", description: "Quality master data under Masters." },
  "masters/quality/item-qcl": { title: "Material QCL", description: "Material quality control limits." },
  "masters/quality/standard-specifications": {
    title: "Standard Specifications",
    description: "Standard specifications master.",
  },
  "masters/quality/inspection-checklist": {
    title: "Inspection Checklist",
    description: "Inspection checklist master.",
  },
  "masters/quality/rm-specifications": { title: "RM Specifications", description: "Raw material specifications." },
  "masters/quality/sku-specifications": { title: "SKU Specifications", description: "SKU specifications." },
  "masters/quality/jw-specifications": { title: "JW Specifications", description: "Job work specifications." },
  "masters/quality/production-item-specification": {
    title: "Production Material Specification",
    description: "Production material specifications.",
  },
  "masters/quality/jw-item-qcl": { title: "JW Material QCL", description: "Job work material QCL." },
  "masters/quality/item-qcl-master": { title: "Material QCL", description: "Material QCL master configuration." },
  "masters/quality/defect-list-configuration": {
    title: "Defect List Configuration",
    description: "Defect list configuration.",
  },
  "masters/quality/drawing-master": { title: "Drawing Master", description: "Drawing master data." },
  "masters/quality/sku-master": { title: "SKU Master", description: "SKU master data." },
  "masters/quality/item-master": { title: "Material Master", description: "Material master data." },
  "masters/quality/supplier-evaluation-master": {
    title: "Supplier Evaluation Master",
    description: "Supplier evaluation master.",
  },
  "masters/quality/product-category-specifications": {
    title: "Product Category Specifications",
    description: "Product category specifications.",
  },
  "masters/quality/item-category-specifications": {
    title: "Material Category Specifications",
    description: "Material category specifications.",
  },
  "masters/dispatch": { title: "Dispatch", description: "Dispatch master data under Masters." },
  "masters/dispatch/logistics": { title: "Logistics", description: "Logistics master data." },
  "masters/dispatch/packing-standard": { title: "Packing Standard", description: "Packing standard master." },
  "masters/dispatch/customer-transporter-interface": {
    title: "Customer - Transporter Interface",
    description: "Customer and transporter interface mapping.",
  },
  "masters/dispatch/invoice-file-name": { title: "Invoice File Name", description: "Invoice file name configuration." },
  "masters/dispatch/gta-master": { title: "GTA Master", description: "GTA master data." },
  "masters/stores": { title: "Stores", description: "Stores master data under Masters." },
  "masters/stores/item-master": { title: "Material Master", description: "Material master data." },
  "masters/stores/upload-item-master": { title: "Upload Material Master", description: "Upload material master data." },
  dispatch: {
    title: "Dispatch",
    description: "Shipment planning, invoicing, e-way bills, and dispatch workflows.",
  },
  "dispatch/cancel-drn": { title: "Cancel DRN", description: "Cancel debit return notes." },
  "dispatch/shipment-planning": { title: "Shipment Planning", description: "Plan shipments." },
  "dispatch/tax-invoice-generation": {
    title: "Tax Invoice Generation",
    description: "Generate tax invoices.",
  },
  "dispatch/generate-e-invoice": { title: "Generate E-Invoice", description: "Generate e-invoices." },
  "dispatch/generate-e-way-bill": { title: "Generate E-Way Bill", description: "Generate e-way bills." },
  "dispatch/jwp-tax-invoice": { title: "JWP Tax Invoice", description: "JWP tax invoices." },
  "dispatch/delivery-challan-ship-to-jwp": {
    title: "Delivery Challan (Ship to JWP)",
    description: "Delivery challan ship to JWP.",
  },
  "dispatch/delivery-challan-for-goods-return": {
    title: "Delivery Challan For Goods Return",
    description: "Delivery challan for goods return.",
  },
  "dispatch/delivery-challan-rewo": {
    title: "Delivery Challan (ReWo)",
    description: "Delivery challan for rework.",
  },
  "dispatch/goods-return-e-way-bill": {
    title: "Goods Return E-way Bill",
    description: "E-way bill for goods return.",
  },
  "dispatch/jwp-e-way-bill": { title: "JWP E-way Bill", description: "JWP e-way bill." },
  "dispatch/service-e-invoice": { title: "Service E-Invoice", description: "Service e-invoice." },
  "dispatch/asn": { title: "ASN", description: "Advance shipping notice." },
  "dispatch/dispatch-planning": { title: "Dispatch Planning", description: "Dispatch planning." },
  "dispatch/fg-inward-reco": { title: "FG Inward Reco", description: "Finished goods inward reconciliation." },
  configuration: {
    title: "Settings",
    description: "Company, application, locations, and access control.",
  },
  ...buildHubModuleCopy("reports", "Reports", {
    hubDescription: "Module-wise reports and analytics.",
    childDescription: (label) => `Reports and dashboards for ${label}.`,
  }),
  "reports/purchase/mfg-items-line-wise": {
    title: "Mfg. Items (Line Wise)",
    description: "Manufacturing items line-wise purchase report.",
  },
  "reports/purchase/supplier-details": {
    title: "Vendor Details",
    description: "Vendor master and transaction detail report.",
  },
  "reports/purchase/pr-to-po": {
    title: "PR to PO",
    description: "Purchase requisition to purchase order conversion report.",
  },
  "reports/purchase/purchase-order": {
    title: "Purchase Order Register",
    description: "Purchase order register with filters, totals, and print actions.",
  },
  "reports/purchase/item-wise-po": {
    title: "Material Wise Purchase Orders",
    description: "PO lines by item with export to Excel and PDF.",
  },
  "reports/purchase/outstanding-po-report": {
    title: "Outstanding PO Report",
    description: "Open and outstanding purchase order report.",
  },
  "reports/purchase/service-purchase-order": {
    title: "Service Purchase Order Register",
    description: "Service purchase order report.",
  },
  "reports/purchase/inventory-report": {
    title: "Inventory Report",
    description: "Purchase-related inventory movement report.",
  },
  "reports/purchase/job-work": {
    title: "Job Work",
    description: "Job work purchase report.",
  },
  "reports/purchase/debit-note": {
    title: "Debit Note",
    description: "Purchase debit note report.",
  },
  "reports/purchase/debit-note-summary": {
    title: "Debit Note Summary",
    description: "Summary of purchase debit notes.",
  },
  "reports/purchase/delivery-challan": {
    title: "Delivery Challan",
    description: "Delivery challan report for purchase.",
  },
  "reports/purchase/inventory": {
    title: "Inventory",
    description: "Inventory position and valuation report.",
  },
  "reports/purchase/ppv": {
    title: "PPV",
    description: "Purchase price variance report.",
  },
  "reports/purchase/item-consumption": {
    title: "Material Consumption",
    description: "Material consumption report.",
  },
  "reports/purchase/monthly-item-consumption": {
    title: "Monthly Material Consumption",
    description: "Monthly material consumption summary.",
  },
  "reports/purchase/purchase-summary": {
    title: "Purchase Summary",
    description: "Overall purchase summary report.",
  },
  "reports/purchase/item-master-summary": {
    title: "Material Master Summary",
    description: "Material master summary for procurement.",
  },
  "reports/purchase/supplier": {
    title: "Vendor Report",
    description: "Vendor-wise purchase report.",
  },
  "reports/purchase/reorder-level": {
    title: "Reorder Level Report",
    description: "Reorder level and stock replenishment report.",
  },
  ...buildHubModuleCopy("masters", "Masters", {
    hubDescription: "Framework master data hub.",
    childDescription: (label) => `Master data for ${label}.`,
  }),
};
