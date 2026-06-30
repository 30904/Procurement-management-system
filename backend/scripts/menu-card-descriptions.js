/**
 * One-line landing card descriptions (menu item `description` field).
 * Keyed by menu `code` — must not repeat the card label.
 */
export const CARD_DESCRIPTIONS = {
  reports_procurement: "PO status, supplier spend, and procurement KPIs",
  reports_inventory_hub: "Stock levels, movement, ageing, and valuation reports",
  reports_quality_hub: "Inspection, rejection, and compliance analytics",
  reports_finance_hub: "Invoice, payment, and procurement finance summaries",
  reports_vendor_hub: "Supplier performance, spend, and compliance analytics",
  reports_material_hub: "Material consumption, movement, and master analysis",
  reports_mis_hub: "Management information and operational dashboards",
  reports_executive_hub: "Executive analytics for procurement and inventory KPIs",

  // Masters hub — grouped entry points
  masters_purchase_group: "Vendors, materials, tax codes, and procurement reference data",
  masters_inventory_group: "Warehouses, locations, racks, and inventory structure",
  masters_quality_group: "Inspection parameters, plans, checklists, and quality configuration",
  masters_configuration_group: "Procurement categories, budgets, and tender configuration",
  reports_leads_npd: "Pipeline, NPD progress, and lead conversion metrics",
  reports_planning: "Demand, BOM, capacity, and planning performance",
  reports_sales: "Orders, revenue, margins, and customer trends",
  reports_purchase: "PO status, supplier spend, and procurement KPIs",
  reports_purchase_mfg_items_line_wise: "Line-wise manufacturing item purchase analysis",
  reports_purchase_supplier_details: "Supplier profile, GST, and contact details",
  reports_purchase_pr_to_po: "Requisition to PO conversion tracking",
  reports_purchase_purchase_order: "Approved PO register with status, value, and dates",
  reports_purchase_item_wise_po: "PO lines grouped by material",
  reports_purchase_outstanding_po_report: "Open PO quantities and pending receipts",
  reports_purchase_service_purchase_order: "Service PO register and spend",
  reports_purchase_inventory_report: "Stock movement tied to purchase",
  reports_purchase_job_work: "Job work orders and material issues",
  reports_purchase_debit_note: "Debit note register",
  reports_purchase_debit_note_summary: "Aggregated debit note totals",
  reports_purchase_delivery_challan: "Inbound delivery challan listing",
  reports_purchase_inventory: "Stock on hand and valuation",
  reports_purchase_ppv: "Purchase price variance analysis",
  reports_purchase_item_consumption: "Item-wise consumption trends",
  reports_purchase_monthly_item_consumption: "Month-wise consumption summary",
  reports_purchase_purchase_summary: "Spend and volume summary by period",
  reports_purchase_item_master_summary: "Procurement material master overview",
  reports_purchase_supplier: "Vendor-wise spend and activity",
  reports_purchase_reorder_level: "Materials below reorder threshold",
  reports_stores: "Stock levels, movement, ageing, and valuation",
  reports_production: "WIP, output, efficiency, and shop-floor KPIs",
  reports_maintenance: "Downtime, PM compliance, and maintenance costs",
  reports_quality: "Inspection, rejection, and compliance analytics",
  reports_dispatch: "Shipments, invoicing, and outbound logistics",
  reports_hrm: "Headcount, attendance, and HR workforce metrics",
  reports_accounts: "Ledgers, vouchers, and accounting summaries",
  reports_finance: "Cash flow, budgets, and financial statements",

  // Masters hub — per-module reference data
  masters_leads_npd: "NPD and lead reference masters for new products",
  masters_planning: "GST, customers, SKUs, items, BOM, stock, and planning reference data",
  masters_sales: "Customers, SKUs, logistics, and sales-side masters",
  masters_purchase: "Vendors, materials, tax codes, and procurement masters",
  masters_stores: "Item and inventory reference for stores",
  masters_production: "Production lines, moulds, and costing masters",
  masters_maintenance: "Assets, tools, lines, and maintenance masters",
  masters_quality: "Specs, QCL, drawings, and quality reference data",
  masters_dispatch: "Logistics, packing, and dispatch configuration",
  masters_hrm: "Employee and HR organizational reference data",
  masters_accounts: "Chart of accounts and accounting masters",
  masters_finance: "Financial periods, budgets, and finance setup",

  // Purchase transactions
  purchase_purchase_order: "Generate and manage supplier purchase orders",
  purchase_purchase_order_generate_po: "Create and manage purchase orders to vendors",
  purchase_purchase_order_amend_po: "Change quantities, dates, or terms on open purchase orders",
  purchase_purchase_order_cancel_po: "Cancel purchase orders that are no longer required",
  purchase_purchase_order_short_po_closing: "Close PO lines with partial receipt quantities",
  purchase_purchase_order_repeat_po: "Create a new PO from a previous order template",
  purchase_purchase_order_domestic: "Domestic purchase order workflow with local tax and compliance",
  purchase_purchase_order_import: "Import purchase order workflow with customs and landed cost",
  purchase_debit_note: "Issue debit notes against vendor invoices",
  purchase_material_purchase_planning: "Plan material procurement from demand and stock",
  purchase_delivery_challan_e_way_bill: "Generate e-way bills for purchase challans",
  purchase_service_po: "Generate, amend, and cancel service purchase orders",
  purchase_purchase_indent: "Create internal procurement requests",
  purchase_approved_purchase_indents: "View approved requisitions ready for procurement",
  purchase_rfq_management: "Manage request-for-quotation cycles with vendors",
  purchase_quotation_management: "Capture and track vendor quotations",
  purchase_comparative_statement: "Compare vendor quotes and prepare award recommendations",
  purchase_contract_management: "Manage procurement contracts and validity periods",
  purchase_purchase_returns: "Process returns of materials to suppliers",
  purchase_vendor_evaluation: "Vendor scorecards, performance trends, and comparative evaluation",
  purchase_source_list: "Maintain approved vendor sources for procurement",
  purchase_purchase_register: "Procurement registers, PO status, and spend reports",
  purchase_purchase_dashboard: "Purchase KPIs, pending actions, and operational overview",
  purchase_goods_receipt: "Receive materials against approved purchase orders",
  reports_purchase_purchase_requisition: "Register of purchase requisitions with status and approval",
  reports_purchase_rfq_register: "Register of RFQs with vendor count, closing dates, and status",
  reports_purchase_goods_receipt_register: "Register of goods receipts against purchase orders",
  purchase_service_po_generate_spo: "Create new service purchase orders",
  purchase_service_po_cancel_spo: "Cancel service purchase orders not yet received",
  purchase_service_po_amend_spo: "Amend open service purchase orders",
  purchase_mjw_delivery_challan: "Job-work delivery challan for subcontract movement",
  purchase_job_work: "Generate and manage job work orders to subcontractors",
  purchase_job_work_generate_jwo: "Create job work orders for outsourced processing",
  purchase_intra_delivery_challan: "Inter-location challans for internal transfers",
  purchase_pinv_authorisation: "Verify vendor invoices before payment processing",
  purchase_delivery_challan_generic: "Generic delivery challan for non-standard moves",

  // Finance — procurement finance placeholders
  finance_invoice_verification: "Verify supplier invoices before payment",
  finance_payment_processing: "Process approved vendor payments and settlements",
  finance_debit_notes: "Review and manage supplier debit note adjustments",
  finance_credit_notes: "Track vendor credit notes against procurement",
  finance_vendor_ledger: "View vendor-wise ledger balances and open items",
  finance_payment_register: "Register of payments made to suppliers",
  finance_budget_verification: "Verify procurement spend against budget heads",
  finance_finance_reports: "Procurement finance summaries and registers",
  finance_vendor_outstanding: "Open vendor balances and ageing summary",
  finance_finance_dashboard: "Finance KPIs, pending payments, and cash flow overview",

  // Stores / inventory
  stores_grn: "Receive materials against approved purchase orders",
  stores_goods_inward: "Log incoming materials into store locations",
  stores_goods_transfer: "Move stock between stores or locations",
  stores_goods_return_acceptance: "Accept returned goods back into inventory",
  stores_cancel_grn: "Reverse or cancel a posted goods receipt",
  stores_rework_authorisation: "Authorize rework material back to production",
  stores_purchase_requisition: "Request materials for purchase or replenishment",
  stores_inventory_inward_entry: "Manual stock adjustment and inward entries",
  stores_stores_inventory_reco: "Reconcile physical stock with system balances",
  // stores_gate_pass: "Issue gate passes for material movement in and out",
  stores_gte: "Goods transfer entry between internal locations",
  stores_finished_goods_inward_entry: "Receive finished goods into FG stores",
  stores_intra_delivery_challan: "Challan for stock moved between company units",
  stores_debit_note: "Supplier debit note linked to stores returns",
  stores_delivery_challan_e_way_bill: "E-way bill for stores-related challan movement",
  stores_goods_return_rm_quarantine: "Return RM to quarantine stores after rejection",
  stores_gin: "Goods issue note for material consumption or dispatch",
  stores_smart_gte_intra: "Guided intra-location transfer with validations",
  stores_drn_goods_return: "Debit/return note for customer or vendor returns",
  stores_goods_issue: "Issue materials from inventory to consumption or dispatch",
  stores_inventory_adjustment: "Adjust stock quantities for corrections and write-offs",
  stores_physical_verification: "Reconcile physical stock counts with system balances",
  stores_stock_inquiry: "Inquiry on stock on hand by material and location",
  stores_inventory_transactions: "Review inventory movement transaction history",
  // stores_bin_transfer: "Transfer stock between bins within a warehouse",
  stores_stock_ledger: "Stock ledger by material, location, and period",
  stores_inventory_reports: "Inventory status, ageing, and valuation reports",
  stores_inventory_dashboard: "Inventory KPIs and operational snapshot",

  // Production
  production_electronic_mfg_ems: "EMS production orders, routing, and output",
  production_engineering_service_request: "Request engineering changes or support",
  production_smart_gtr: "Guided goods transfer for production floor",
  production_jc_entry: "Job card entry for shop-floor operations",
  production_jw_delivery_challan: "Send material to job-worker via challan",
  production_product_sku: "Manage production SKUs and finished variants",
  production_production_inventory_reco: "Reconcile WIP and production store balances",
  production_goods_return_rm_quarantine: "Return rejected RM from production to quarantine",

  // Maintenance
  maintenance_breakdown_maintenance: "Log and close breakdown maintenance tickets",
  maintenance_preventive_maintenance: "Schedule and track preventive maintenance",
  maintenance_preventive_maintenance_pm_schedule_individual_assets:
    "Plan preventive maintenance schedules for individual assets",
  maintenance_preventive_maintenance_pm_log_entry_individual_assets:
    "Capture preventive maintenance log entries for individual assets",
  maintenance_preventive_maintenance_production_line_master:
    "Define production lines for line-level preventive maintenance planning",
  maintenance_preventive_maintenance_line_asset_mapping:
    "Map maintainable assets to production lines with sequence and validity",
  maintenance_preventive_maintenance_pm_line_policy:
    "Configure PM frequency, week rules, and tolerance for each production line",
  maintenance_preventive_maintenance_pm_line_schedule:
    "Generate and review yearly preventive maintenance schedules line-wise",
  maintenance_preventive_maintenance_pm_line_log_entry:
    "Capture PM execution logs against generated line schedule slots",
  maintenance_preventive_maintenance_pm_line_compliance_report:
    "Review planned vs completed PM compliance by production line",
  maintenance_purchase_requisition: "Request spares or services for maintenance",
  maintenance_goods_transfer_request_intra: "Request intra transfer for maintenance spares",

  // Quality
  quality_mrn: "Material receipt note with inspection hold/release",
  quality_wo_execution: "Execute work orders with quality checkpoints",
  quality_pdir_entry: "Pre-dispatch inspection report entry",
  quality_purchase_requisition: "Requisition for quality lab consumables or tools",
  quality_job_card_entry: "Quality-linked job card execution",
  quality_rejection_summary: "Summarize rejections by item, line, or period",
  quality_gtr: "Goods transfer with quality status control",
  quality_jc_entry: "Job card entry under quality supervision",
  quality_material_re_validation: "Re-test material after hold or expiry",
  quality_qc_batch_release_entry: "Release batches after QC approval",
  quality_batch_card_execution: "Run batch cards with step-wise QC",
  quality_quality_inspection: "Perform quality inspection on received or in-process materials",
  quality_incoming_inspection: "Inspect incoming materials against purchase and QC criteria",
  quality_rejected_materials: "Track and disposition rejected materials",
  quality_quality_decisions: "Record accept, reject, and rework quality decisions",
  quality_inspection_parameters: "Configure inspection parameters and test criteria",
  quality_inspection_plan: "Define inspection plans and sampling rules for materials",
  quality_inspection_checklist: "Quality standards and checklist templates for inspections",
  quality_inspection_schedule: "Schedule and track planned quality inspections",
  quality_inspection_results: "Review and analyse inspection result records",
  quality_quality_reports: "Quality inspection and rejection analytics",
  quality_quality_dashboard: "Quality KPIs and inspection workload snapshot",

  // Dispatch
  dispatch_cancel_drn: "Cancel a delivery return note before posting",
  dispatch_shipment_planning: "Plan loads, routes, and shipment batches",
  dispatch_tax_invoice_generation: "Generate tax invoices from dispatch data",
  dispatch_generate_e_invoice: "Create IRN and e-invoice on government portal",
  dispatch_generate_e_way_bill: "Generate e-way bill for outbound movement",
  dispatch_jwp_tax_invoice: "Tax invoice for job-work principal billing",
  dispatch_delivery_challan_ship_jwp: "Challan when shipping to job-work principal",
  dispatch_delivery_challan_goods_return: "Challan for customer or vendor returns",
  dispatch_delivery_challan_rewo: "Challan for rework outbound movement",
  dispatch_goods_return_e_way_bill: "E-way bill for return consignments",
  dispatch_jwp_e_way_bill: "E-way bill for job-work principal shipments",
  dispatch_service_e_invoice: "E-invoice for service billing lines",
  dispatch_asn: "Advance ship notice to customer systems",
  dispatch_dispatch_planning: "Plan dispatch slots and vehicle allocation",
  dispatch_fg_inward_reco: "Reconcile FG inward before dispatch release",

  // Sales hub — transactions
  sales_sales_forecast: "Plan and review period-wise sales forecasts by customer or SKU",
  sales_sales_order: "Create, amend, cancel, and short-close customer sales orders",
  sales_sales_order_sales_order: "Create and manage customer sales orders",
  sales_sales_order_amend_so: "Amend open sales orders — quantities, dates, or terms",
  sales_sales_order_cancel_so: "Cancel sales orders that are no longer required",
  sales_sales_order_short_close_so: "Short-close SO lines with partial dispatch quantities",
  sales_proforma_invoice: "Issue proforma invoices before tax invoice generation",
  sales_service_invoice: "Bill customers for services with SAC and tax lines",
  sales_debit_note: "Raise GST or financial debit notes for customer adjustments",
  sales_debit_note_gst_debit_note: "Issue GST debit notes linked to customer tax invoices",
  sales_debit_note_financial_debit_note: "Post financial debit notes without GST line impact",
  sales_credit_note: "Issue GST, financial, or value-based credit notes to customers",
  sales_credit_note_gst_credit_note: "Raise GST credit notes linked to customer tax invoices",
  sales_credit_note_financial_credit_note: "Post financial credit notes without GST line impact",
  sales_credit_note_gst_credit_note_value_based:
    "Issue GST credit notes calculated on value-based adjustments",
  sales_quotation: "Prepare and send customer quotations for goods or services",
  sales_sample_goods_order: "Process sample goods orders (SGO) for trials and approvals",
  sales_sample_goods_invoice: "Invoice sample shipments with sample pricing rules",
  sales_new_shipment_planning: "Plan outbound shipments and allocate stock to customer orders",

  // Masters → Sales sub-modules

  masters_sales_gst_s: "Sales-side GST setup: HSN/S and SAC/S masters",
  masters_sales_service_master: "Define billable services for sales and invoicing",
  masters_sales_b2b_customer: "Onboard and maintain B2B customer accounts",
  masters_sales_sku: "Configure sellable SKUs linked to items",
  masters_sales_sku_customer_interface: "Map SKUs to customer part numbers and prices",
  masters_sales_logistics: "Carriers, incoterms, and shipment preferences",
  masters_sales_customer_open_po: "Track customer open PO lines and balances",
  masters_sales_product_master: "Product hierarchy and attributes for sales",

  masters_sales_gst_s_hsn_s_master: "Harmonized codes for sales goods and invoicing",
  masters_sales_gst_s_sac_s_master: "Service codes for sales-side taxable services",

  // Masters → Purchase
  masters_purchase_gst_p: "Tax setup for purchases — HSN and SAC codes for goods and services",
  masters_purchase_service_master: "Catalogue of services procured for PO and goods receipt",
  masters_purchase_supplier: "Register approved vendors with GST, terms, and bank details",
  masters_purchase_item_master: "Maintain raw materials, parts, and bought-out items for procurement",
  masters_purchase_prospect_supplier: "Track potential vendors before they become approved vendors",
  masters_purchase_upload_item_master: "Download template and bulk-import materials into Material Master",
  masters_purchase_logistics: "Set up transporters, freight terms, and inbound delivery rules",
  masters_purchase_asset_master_capitalised: "Record capital equipment, machines, and fixed assets",
  masters_purchase_payment_terms: "Define how and when your organization pays vendors",
  masters_purchase_service_master_r1: "Full service master with revisions and approval history",
  masters_purchase_source_list: "Approved vendor source list for procurement categories",
  masters_purchase_vendor_evaluation: "Vendor performance evaluation and scorecards",

  masters_purchase_gst_p_hsn_p_master: "HSN codes for goods you purchase — tax and classification",
  masters_purchase_gst_p_sac_p_master: "SAC codes for services you purchase — tax and classification",

  // Masters → Planning
  masters_planning_gst_s_master: "HSN/S and SAC/S tax codes for sales and planning",
  masters_planning_customer_master: "B2B customers for forecasting and order planning",
  masters_planning_sku: "SKU definitions for planning and MRP",
  masters_planning_sku_attributes: "Configurable attributes per SKU variant",
  masters_planning_gst_p_master: "HSN/P and SAC/P tax codes for procurement",
  masters_planning_supplier_master: "Approved suppliers for purchase and material planning",
  masters_planning_item_master: "Items, UoM, and inventory references for planning",
  masters_planning_logistics_master: "Logistics service providers and shipping setup",
  masters_planning_production_master: "Production lines, costing, and manufacturing masters",
  masters_planning_bom: "Multi-level bill of materials for planning and MRP",
  masters_planning_stock_levels: "Stock on hand and reorder levels by location",
  masters_planning_stock_levels_item_inl: "Purchase item inventory levels and reorder points",
  masters_planning_stock_levels_production_item_inl: "Production item inventory levels and reorder setup",
  masters_planning_stock_levels_jwg_inl: "Job-work goods inventory levels (planning)",
  masters_planning_stock_levels_sku_inl: "Finished SKU stock levels for planning",
  masters_planning_jw_master: "Job-work items, routes, and subcontract planning",

  // Masters → Leads & NPD

  masters_leads_npd_prospect_master: "Sales prospects before customer conversion",
  masters_leads_npd_lead_source: "Reference sources like website, exhibition, and referral",
  masters_leads_npd_competitor_master: "Competitor profiles for win/loss tracking",
  masters_leads_npd_product_category: "Product families for leads and NPD mapping",
  masters_leads_npd_npd_stage: "NPD stages from request to commercialization",
  masters_leads_npd_lost_reason: "Standardized reasons for lost opportunities",

  // Masters → Maintenance
  masters_maintenance_production_line: "Production lines linked to assets and capacity",
  masters_maintenance_tool_master: "Tools, dies, and fixtures with life tracking",
  masters_maintenance_tool_customer_interface: "Customer-owned tools and custody rules",
  masters_maintenance_asset_master: "Maintainable assets, locations, and PM plans",
  masters_maintenance_quality_equipment_master: "Calibrated QC equipment and schedules",

  // Masters → Quality
  masters_quality_item_qcl: "Quality control limits per item or SKU",
  masters_quality_standard_specifications:
    "Configure measurable inspection characteristics used during quality inspection — thickness, weight, colour, density, hardness, moisture, and purity.",
  masters_quality_inspection_plan:
    "Define inspection plans for each material — sampling method, inspection frequency, acceptance criteria, AQL, and inspection sequence.",
  masters_quality_inspection_checklist:
    "Maintain reusable inspection checklists and templates for incoming material, packing material, chemical, consumables, and services.",
  masters_quality_rm_specifications:
    "Maintain material specifications such as grade, thickness, density, hardness, chemical composition, moisture, and purity.",
  masters_quality_sku_specifications:
    "Maintain finished product specifications as reusable configuration for future manufacturing integration.",
  masters_quality_jw_specifications: "Job-work material and process specs",
  masters_quality_production_item_specification: "In-production item quality rules",
  masters_quality_jw_item_qcl: "QCL for items processed at job-workers",
  masters_quality_item_qcl_master: "Central QCL templates with revisions",
  masters_quality_defect_list_configuration:
    "Maintain standardized rejection reasons — damaged, short supply, wrong specification, rust, expired, broken, and moisture.",
  masters_quality_quality_grades:
    "Maintain quality disposition grades — accepted, accepted with deviation, hold, rejected, rework, and scrap.",
  masters_quality_drawing_master: "Controlled drawings and revision levels",
  masters_quality_sku_master: "SKU quality profile for release rules",
  masters_quality_item_master: "Item-level quality attributes and sampling",
  masters_quality_supplier_evaluation_master: "Supplier quality scorecards and audits",
  masters_quality_product_category_specifications: "Specs by product category",
  masters_quality_item_category_specifications: "Specs by item category",

  masters_configuration_procurement_categories: "Procurement category hierarchy and rules",
  masters_configuration_purchase_types: "Purchase type codes for requisitions and orders",
  masters_configuration_priority_levels: "Priority levels for procurement requests",
  masters_configuration_tender_types: "Tender and RFQ type configuration",
  masters_configuration_budget_heads: "Budget heads for procurement spend control",
  masters_configuration_financial_years: "Financial year definitions for procurement",
  masters_configuration_gem_configuration: "Government e-Marketplace integration settings",

  governance_user_management: "Manage user accounts and access credentials",
  governance_role_management: "Define roles and assign menu permissions",
  governance_approval_matrix: "Configure stage-wise approvers for procurement documents",
  governance_workflow_configuration: "Configure document workflow stages and rules",
  governance_document_number_series: "Configure document prefixes and number series",
  governance_email_templates: "Manage email templates for system notifications",
  governance_notification_templates: "Configure in-app and SMS notification templates",
  governance_audit_logs: "Review system audit trail for configuration changes",
  governance_company_configuration: "Company profile and organization settings",
  governance_financial_year: "Configure active financial year for transactions",

  // Masters → Dispatch
  masters_dispatch_logistics: "Dispatch carriers, modes, and service levels",
  masters_dispatch_packing_standard: "Pack specs, dunnage, and label rules",
  masters_dispatch_customer_transporter_interface: "Customer-approved transporter mappings",
  masters_dispatch_invoice_file_name: "Naming rules for exported invoice files",
  masters_dispatch_gta_master: "Goods transport agency and GTA compliance",

  // Masters → Stores / Production
  masters_stores_item_master: "Items stocked in stores with UOM and bins",
  masters_stores_upload_item_master:
    "Bulk upload inventory materials using the standard Excel import template.",
  masters_stores_warehouse: "Define warehouses and storage facilities.",
  masters_stores_location: "Configure inventory locations and business units.",
  masters_stores_rack: "Define rack structures within warehouses.",
  masters_stores_bin: "Configure storage bins for precise inventory placement.",
  masters_stores_stock_levels_item_inl:
    "Configure inventory planning parameters for every material — minimum and maximum stock, safety stock, reorder level, ROQ, lead time, and procurement frequency. Used for low-stock alerts, automatic purchase requisitions, planning KPIs, and executive reports.",
  masters_production_electronic_mfg_ems: "EMS BOM, routing, and line setup",
  masters_production_mould_master: "Moulds with cavities, life, and maintenance",
  masters_production_product_lines: "Product lines, shifts, and capacity rates",
  masters_production_std_cost_sheet: "Standard costs for SKUs and operations",
  masters_production_demand_source: "Demand sources feeding production planning",

  // Leads & NPD transactions
  leads_npd_dashboard: "KPI dashboard for leads, opportunities, and NPD pipeline",
  leads_npd_lead_register: "Capture enquiries and progress through sales stages",
  leads_npd_opportunity: "Manage qualified opportunities and probability pipeline",
  leads_npd_quotation: "Create, revise, and track customer quotations",
  leads_npd_npd_request: "Create and track new product development requests",
  leads_npd_npd_feasibility: "Evaluate technical and commercial NPD feasibility",
  leads_npd_sample_development: "Track sample making and engineering handoff",
  leads_npd_customer_trial: "Capture customer trial feedback and outcomes",
  leads_npd_commercialization: "Track launch readiness and ERP handover",
  leads_npd_config_group: "Leads and NPD stage/workflow configuration group",
  leads_npd_sales_pipeline: "Configure sales stages from lead to closure",
  leads_npd_npd_workflow: "Configure NPD workflow stage sequence",
  leads_npd_approval_matrix: "Configure stage-wise approver roles",

  // Leads & NPD reports
  reports_leads_npd_lead_summary: "Lead register summary by stage and owner",
  reports_leads_npd_opportunity_pipeline: "Pipeline visibility by opportunity stage",
  reports_leads_npd_sales_funnel: "Lead-to-win conversion funnel with drop-offs",
  reports_leads_npd_quotation_report: "Quotation register with filter criteria and printable PDF",
  reports_leads_npd_lost_lead_analysis: "Lost leads grouped by reason and competitor",
  reports_leads_npd_npd_status: "NPD request status and stage progress",
  reports_leads_npd_npd_aging: "Stage aging and overdue NPD actions",
  reports_leads_npd_sample_tracking: "Samples awaiting trial or customer response",
  reports_leads_npd_commercialization: "Commercialized products and launch potential",
};

/** Module placeholder cards — keyed as `${hubCode}_module_${n}` */
const MODULE_SLOT_HINTS = {
  1: "Primary workflow — configure routes in Modules Setup",
  2: "Secondary workflow — configure routes in Modules Setup",
  3: "Supporting workflow — configure routes in Modules Setup",
  4: "Additional workflow — configure routes in Modules Setup",
};

/**
 * @param {string} code Menu item code
 * @returns {string} Description text (empty if unknown)
 */
export function cardDescription(code) {
  if (!code) return "";
  const direct = CARD_DESCRIPTIONS[code];
  if (direct) return direct;

  const moduleMatch = /^(.+)_module_(\d)$/.exec(code);
  if (moduleMatch) {
    const slot = Number(moduleMatch[2]);
    return MODULE_SLOT_HINTS[slot] || MODULE_SLOT_HINTS[1];
  }

  return "";
}
