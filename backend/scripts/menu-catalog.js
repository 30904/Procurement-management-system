/**
 * Shared menu catalog for framework seed and generic-menu migration.
 */
import { cardDescription } from "./menu-card-descriptions.js";

export function buildMenuCatalog(companyId) {
  const c = companyId;
  const item = (row) => ({ company: c, ...row });

  /** Procurement sidebar — Purchase, Stores, Quality, Finance */
  const ERP_SIDEBAR_MENUS = [
    {
      code: "dashboard",
      label: "Dashboard",
      segment: "dashboard",
      sequence: 5,
      iconKey: "dashboard",
      isEssential: true,
    },
    { code: "purchase", label: "Purchase", segment: "purchase", sequence: 40, iconKey: "purchase" },
    { code: "stores", label: "Inventory", segment: "stores", sequence: 50, iconKey: "stores" },
    { code: "quality", label: "Quality", segment: "quality", sequence: 80, iconKey: "quality" },
    { code: "finance", label: "Finance", segment: "finance", sequence: 85, iconKey: "finance" },
    { code: "reports", label: "Reports", segment: "reports", sequence: 95, iconKey: "reports" },
  ];

  /** HR / Accounts / Finance removed from procurement build */
  const APPLICATIONS_FLYOUT_MENUS = [];

  const sidebarMain = ERP_SIDEBAR_MENUS.map((row) =>
    item({
      ...row,
      menuType: "sidebar_main",
      activeIconKey: `${row.iconKey}_active`,
    })
  );

  const sidebarBottom = [
    item({
      code: "applications",
      label: "Applications",
      segment: "",
      menuType: "sidebar_bottom",
      sequence: 10,
      iconKey: "applications",
      activeIconKey: "applications_active",
      isHidden: false,
    }),
    item({
      code: "masters",
      label: "Masters",
      segment: "masters",
      menuType: "sidebar_bottom",
      sequence: 20,
      iconKey: "masters",
      activeIconKey: "masters_active",
    }),
    item({
      code: "settings",
      label: "Settings",
      segment: "configuration",
      menuType: "sidebar_bottom",
      sequence: 30,
      iconKey: "settings",
      activeIconKey: "settings_active",
    }),
    item({
      code: "support",
      label: "Help",
      segment: "",
      menuType: "sidebar_bottom",
      sequence: 40,
      iconKey: "support",
      activeIconKey: "support_active",
      isEssential: true,
    }),
  ];

  const applicationsFlyout = APPLICATIONS_FLYOUT_MENUS.map((row) =>
    item({
      ...row,
      parentCode: "applications",
      menuType: "flyout_item",
      activeIconKey: `${row.iconKey}_active`,
      isHidden: false,
    })
  );

  /** Reports & Masters hub cards — procurement modules only */
  const PROCUREMENT_HUB_CODES = new Set(["purchase", "stores", "quality"]);
  const ERP_MODULE_SOURCES = ERP_SIDEBAR_MENUS.filter(
    (m) => m.code !== "reports" && PROCUREMENT_HUB_CODES.has(m.code)
  );

  /** Reports hub — procurement analytics groups (placeholder navigation where not built) */
  const landingReportsCards = [
    item({
      code: "reports_purchase",
      label: "Procurement Reports",
      description: cardDescription("reports_procurement"),
      segment: "reports/purchase",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 10,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    item({
      code: "reports_inventory",
      label: "Inventory Reports",
      description: cardDescription("reports_inventory_hub"),
      segment: "reports/inventory-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 20,
      iconKey: "stores",
      activeIconKey: "stores_active",
    }),
    item({
      code: "reports_quality",
      label: "Quality Reports",
      description: cardDescription("reports_quality_hub"),
      segment: "reports/quality-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 30,
      iconKey: "quality",
      activeIconKey: "quality_active",
    }),
    item({
      code: "reports_finance",
      label: "Finance Reports",
      description: cardDescription("reports_finance_hub"),
      segment: "reports/finance-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 40,
      iconKey: "finance",
      activeIconKey: "finance_active",
    }),
    item({
      code: "reports_vendor",
      label: "Supplier Performance Reports",
      description: cardDescription("reports_vendor_hub"),
      segment: "reports/vendor-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 50,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    item({
      code: "reports_material",
      label: "Material Analysis Reports",
      description: cardDescription("reports_material_hub"),
      segment: "reports/material-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 60,
      iconKey: "stores",
      activeIconKey: "stores_active",
    }),
    item({
      code: "reports_mis",
      label: "Management Reports",
      description: cardDescription("reports_mis_hub"),
      segment: "reports/mis-reports",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 70,
      iconKey: "reports",
      activeIconKey: "reports_active",
    }),
    item({
      code: "reports_executive",
      label: "Executive Analytics",
      description: cardDescription("reports_executive_hub"),
      segment: "reports/executive-dashboard",
      parentCode: "reports",
      menuType: "landing_card",
      sequence: 80,
      iconKey: "dashboard",
      activeIconKey: "dashboard_active",
    }),
  ];

  /** Masters hub — grouped master data entry points */
  const landingMastersCards = [
    item({
      code: "masters_purchase",
      label: "Purchase Masters",
      description: cardDescription("masters_purchase_group"),
      segment: "masters/purchase",
      parentCode: "masters",
      menuType: "card_group",
      sequence: 10,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    item({
      code: "masters_stores",
      label: "Inventory Masters",
      description: cardDescription("masters_inventory_group"),
      segment: "masters/stores",
      parentCode: "masters",
      menuType: "card_group",
      sequence: 20,
      iconKey: "stores",
      activeIconKey: "stores_active",
    }),
    item({
      code: "masters_quality",
      label: "Quality Masters",
      description: cardDescription("masters_quality_group"),
      segment: "masters/quality",
      parentCode: "masters",
      menuType: "card_group",
      sequence: 30,
      iconKey: "quality",
      activeIconKey: "quality_active",
    }),
    item({
      code: "masters_configuration",
      label: "Configuration Masters",
      description: cardDescription("masters_configuration_group"),
      segment: "masters/configuration",
      parentCode: "masters",
      menuType: "card_group",
      sequence: 40,
      iconKey: "data_management",
      activeIconKey: "data_management_active",
    }),
  ];

  const purchaseCard = (code, label, slug, sequence, options = false) => {
    const opts = typeof options === "boolean" ? { hidden: options } : options || {};
    return item({
      code: `purchase_${code}`,
      label,
      description: cardDescription(`purchase_${code}`),
      segment: opts.segment || `purchase/${slug}`,
      parentCode: "purchase",
      menuType: "landing_card",
      sequence,
      ...(opts.hidden ? { isHidden: true } : {}),
      ...(opts.admin ? { requiresSuperAdmin: true } : {}),
    });
  };

  /** Purchase → Purchase Order sub-actions (hub at purchase/purchase-order) */
  const PURCHASE_ORDER_ACTION_DEFS = [
    { code: "generate_po", label: "Purchase Orders", slug: "generate-po", sequence: 10 },
    { code: "amend_po", label: "Amend PO", slug: "amend-po", sequence: 20 },
    { code: "cancel_po", label: "Cancel PO", slug: "cancel-po", sequence: 30 },
    { code: "short_po_closing", label: "Short PO Closing", slug: "short-po-closing", sequence: 40 },
    { code: "repeat_po", label: "Repeat PO", slug: "repeat-po", sequence: 50 },
  ];

  const landingPurchaseOrderCards = PURCHASE_ORDER_ACTION_DEFS.map((def) =>
    item({
      code: `purchase_purchase_order_${def.code}`,
      label: def.label,
      description: cardDescription(`purchase_purchase_order_${def.code}`),
      segment: `purchase/purchase-order/${def.slug}`,
      parentCode: "purchase_purchase_order",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  /** Purchase → Service PO sub-actions (hub at purchase/service-po) */
  const SERVICE_PO_ACTION_DEFS = [
    { code: "generate_spo", label: "Generate SPO", slug: "generate-spo", sequence: 10 },
    { code: "cancel_spo", label: "Cancel SPO", slug: "cancel-spo", sequence: 20 },
    { code: "amend_spo", label: "Amend SPO", slug: "amend-spo", sequence: 30 },
  ];

  const landingServicePoCards = SERVICE_PO_ACTION_DEFS.map((def) =>
    item({
      code: `purchase_service_po_${def.code}`,
      label: def.label,
      description: cardDescription(`purchase_service_po_${def.code}`),
      segment: `purchase/service-po/${def.slug}`,
      parentCode: "purchase_service_po",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  const JOB_WORK_ACTION_DEFS = [
    { code: "generate_jwo", label: "Generate JWO", slug: "generate-jwo", sequence: 10 },
  ];

  const landingJobWorkCards = JOB_WORK_ACTION_DEFS.map((def) =>
    item({
      code: `purchase_job_work_${def.code}`,
      label: def.label,
      description: cardDescription(`purchase_job_work_${def.code}`),
      segment: `purchase/job-work/${def.slug}`,
      parentCode: "purchase_job_work",
      menuType: "landing_card",
      sequence: def.sequence,
      isHidden: false,
    })
  );

  const purchaseReportCard = (code, label, slug, sequence) =>
    item({
      code: `reports_purchase_${code}`,
      label,
      description: cardDescription(`reports_purchase_${code}`),
      segment: `reports/purchase/${slug}`,
      parentCode: "reports_purchase",
      menuType: "landing_card",
      sequence,
    });

  const PURCHASE_REPORT_DEFS = [
    { code: "purchase_order", label: "Purchase Order Register", slug: "purchase-order", sequence: 10 },
    { code: "purchase_requisition", label: "Purchase Requisition Register", slug: "purchase-requisition", sequence: 15 },
    { code: "rfq_register", label: "RFQ Register", slug: "rfq-register", sequence: 16 },
    { code: "goods_receipt_register", label: "Goods Receipt Register", slug: "goods-receipt-register", sequence: 18 },
    { code: "item_wise_po", label: "Material Wise Purchase Orders", slug: "item-wise-po", sequence: 20 },
    { code: "outstanding_po_report", label: "Outstanding PO Report", slug: "outstanding-po-report", sequence: 30 },
    { code: "service_purchase_order", label: "Service Purchase Order Register", slug: "service-purchase-order", sequence: 40 },
    { code: "inventory_report", label: "Inventory Report", slug: "inventory-report", sequence: 50 },
    { code: "job_work", label: "Job Work", slug: "job-work", sequence: 60 },
    { code: "debit_note", label: "Debit Note", slug: "debit-note", sequence: 70 },
    { code: "debit_note_summary", label: "Debit Note Summary", slug: "debit-note-summary", sequence: 80 },
    { code: "delivery_challan", label: "Delivery Challan", slug: "delivery-challan", sequence: 90 },
    { code: "inventory", label: "Inventory", slug: "inventory", sequence: 100 },
    { code: "ppv", label: "PPV", slug: "ppv", sequence: 110 },
    { code: "item_consumption", label: "Material Consumption", slug: "item-consumption", sequence: 120 },
    { code: "monthly_item_consumption", label: "Monthly Material Consumption", slug: "monthly-item-consumption", sequence: 130 },
    { code: "purchase_summary", label: "Purchase Summary", slug: "purchase-summary", sequence: 140 },
    { code: "item_master_summary", label: "Material Master Summary", slug: "item-master-summary", sequence: 150 },
    { code: "supplier", label: "Vendor Report", slug: "supplier", sequence: 160 },
    { code: "reorder_level", label: "Reorder Level Report", slug: "reorder-level", sequence: 170 },
  ];

  const landingPurchaseReportCards = PURCHASE_REPORT_DEFS.map((def) =>
    purchaseReportCard(def.code, def.label, def.slug, def.sequence)
  );

  /**
   * Purchase hub — procurement lifecycle (4 cards per row).
   * Transactions → Supporting → Reports → Dashboard
   */
  const landingPurchaseCards = [
    purchaseCard("purchase_indent", "Purchase Requisition", "purchase-indent", 10),
    purchaseCard("approved_purchase_indents", "Approved Requisitions", "purchase-indent/approved", 20),
    purchaseCard("material_purchase_planning", "Procurement Planning", "material-purchase-planning", 30),
    purchaseCard("rfq_management", "RFQ Management", "rfq-management", 40),
    purchaseCard("quotation_management", "Quotation Management", "quotation-management", 50),
    purchaseCard("comparative_statement", "Comparative Statement", "comparative-statement", 60),
    item({
      code: "purchase_vendor_evaluation",
      label: "Vendor Evaluation",
      description: cardDescription("purchase_vendor_evaluation"),
      segment: "purchase/vendor-evaluation",
      parentCode: "purchase",
      menuType: "landing_card",
      sequence: 65,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    purchaseCard("contract_management", "Contract Management", "contract-management", 70),
    purchaseCard("purchase_order", "Purchase Orders", "purchase-order", 75),
    purchaseCard("service_po", "Service Purchase Orders", "service-po", 80),
    purchaseCard("purchase_order_import", "Import Purchase Orders", "purchase-order-import", 90),
    item({
      code: "purchase_goods_receipt",
      label: "Goods Receipt",
      description: cardDescription("purchase_goods_receipt"),
      segment: "stores/grn",
      parentCode: "purchase",
      menuType: "landing_card",
      sequence: 100,
      iconKey: "stores",
      activeIconKey: "stores_active",
    }),
    item({
      code: "purchase_source_list",
      label: "Source List",
      description: cardDescription("purchase_source_list"),
      segment: "masters/purchase/source-list",
      parentCode: "purchase",
      menuType: "landing_card",
      sequence: 120,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    purchaseCard("purchase_returns", "Purchase Returns", "purchase-returns", 140),
    item({
      code: "purchase_purchase_register",
      label: "Purchase Reports",
      description: cardDescription("purchase_purchase_register"),
      segment: "reports/purchase/purchase-order",
      parentCode: "purchase",
      menuType: "landing_card",
      sequence: 150,
      iconKey: "reports",
      activeIconKey: "reports_active",
    }),
    item({
      code: "purchase_purchase_dashboard",
      label: "Purchase Dashboard",
      description: cardDescription("purchase_purchase_dashboard"),
      segment: "purchase/purchase-dashboard",
      parentCode: "purchase",
      menuType: "landing_card",
      sequence: 160,
      iconKey: "dashboard",
      activeIconKey: "dashboard_active",
    }),
    purchaseCard("purchase_order_domestic", "Domestic Purchase Orders", "purchase-order-domestic", 200, {
      hidden: true,
    }),
    purchaseCard("debit_note", "Debit Notes", "debit-note", 210, { hidden: true }),
    item({
      code: "purchase_job_work",
      label: "Job Work",
      description: cardDescription("purchase_job_work"),
      segment: "purchase/job-work",
      parentCode: "purchase",
      menuType: "card_group",
      sequence: 220,
      isHidden: true,
    }),
    purchaseCard("mjw_delivery_challan", "MJW DC", "mjw-delivery-challan", 230, { hidden: true }),
    purchaseCard("delivery_challan_generic", "Generic DC", "delivery-challan-generic", 240, { hidden: true }),
    purchaseCard("delivery_challan_e_way_bill", "DC E-Way Bill", "delivery-challan-e-way-bill", 250, { hidden: true }),
    purchaseCard("pinv_authorisation", "Invoice Verification", "pinv-authorisation", 260, { hidden: true }),
  ];

  const financeCard = (code, label, slug, sequence, options = {}) =>
    item({
      code: `finance_${code}`,
      label,
      description: cardDescription(`finance_${code}`),
      segment: options.segment || `finance/${slug}`,
      parentCode: "finance",
      menuType: "landing_card",
      sequence,
      iconKey: options.iconKey || "finance",
      activeIconKey: options.activeIconKey || "finance_active",
      ...(options.hidden ? { isHidden: true } : {}),
    });

  const landingFinanceCards = [
    financeCard("invoice_verification", "Invoice Verification", "invoice-verification", 10),
    financeCard("payment_processing", "Payment Processing", "payment-processing", 20),
    financeCard("debit_notes", "Debit Notes", "debit-notes", 30, {
      segment: "purchase/debit-note",
      iconKey: "purchase",
      activeIconKey: "purchase_active",
    }),
    financeCard("credit_notes", "Credit Notes", "credit-notes", 40),
    financeCard("vendor_ledger", "Vendor Ledger", "vendor-ledger", 50),
    financeCard("payment_register", "Payment Register", "payment-register", 60),
    financeCard("budget_verification", "Budget Verification", "budget-verification", 70),
    financeCard("vendor_outstanding", "Vendor Outstanding", "vendor-outstanding", 75),
    financeCard("finance_reports", "Finance Reports", "finance-reports", 80),
    financeCard("finance_dashboard", "Finance Dashboard", "finance-dashboard", 90),
  ];

  const storesCard = (code, label, slug, sequence, options = false) => {
    const opts = typeof options === "boolean" ? { hidden: options } : options || {};
    return item({
      code: `stores_${code}`,
      label,
      description: cardDescription(`stores_${code}`),
      segment: opts.segment || `stores/${slug}`,
      parentCode: "stores",
      menuType: "landing_card",
      sequence,
      iconKey: opts.iconKey || "stores",
      activeIconKey: opts.activeIconKey || "stores_active",
      ...(opts.hidden ? { isHidden: true } : {}),
      ...(opts.admin ? { requiresSuperAdmin: true } : {}),
    });
  };

  /** Inventory hub — stock operations (4 cards per row); manufacturing cards hidden */
  const landingStoresCards = [
    storesCard("grn", "Goods Receipt", "grn", 10),
    storesCard("goods_issue", "Internal Issue", "goods-issue", 20),
    storesCard("goods_transfer", "Material Transfer", "goods-transfer", 30),
    storesCard("inventory_adjustment", "Inventory Adjustment", "inventory-adjustment", 40),
    // storesCard("gate_pass", "Gate Pass", "gate-pass", 50),
    storesCard("physical_verification", "Physical Verification", "physical-verification", 60),
    storesCard("stock_inquiry", "Stock Inquiry", "stock-inquiry", 70),
    storesCard("inventory_transactions", "Inventory Transactions", "inventory-transactions", 80),
    // storesCard("bin_transfer", "Bin Transfer", "bin-transfer", 90),
    storesCard("stock_ledger", "Stock Ledger", "stock-ledger", 100),
    storesCard("inventory_reports", "Inventory Reports", "inventory-reports", 110),
    storesCard("inventory_dashboard", "Inventory Dashboard", "inventory-dashboard", 120),
    storesCard("goods_inward", "Material Receipt", "goods-inward", 200, { hidden: true }),
    storesCard("goods_return_acceptance", "Goods Return Acceptance", "goods-return-acceptance", 210, {
      hidden: true,
    }),
    storesCard("cancel_grn", "Cancel GRN", "cancel-grn", 220, { hidden: true }),
    storesCard("rework_authorisation", "ReWork Authorisation", "rework-authorisation", 230, { hidden: true }),
    storesCard("purchase_requisition", "Purchase Requisition", "purchase-requisition", 240, { hidden: true }),
    storesCard("inventory_inward_entry", "Inventory Adjustment (Legacy)", "inventory-inward-entry", 250, {
      hidden: true,
    }),
    storesCard("stores_inventory_reco", "Stores Inventory Reco", "stores-inventory-reco", 260, { hidden: true }),
    storesCard("gte", "GTE", "gte", 270, { hidden: true }),
    storesCard("finished_goods_inward_entry", "Finished Goods Inward Entry", "finished-goods-inward-entry", 280, {
      hidden: true,
      admin: true,
    }),
    storesCard("intra_delivery_challan", "Intra Delivery Challan", "intra-delivery-challan", 290, { hidden: true }),
    storesCard("debit_note", "Debit Note", "debit-note", 300, { hidden: true }),
    storesCard("delivery_challan_e_way_bill", "Delivery Challan E-Way Bill", "delivery-challan-e-way-bill", 310, {
      hidden: true,
    }),
    storesCard(
      "goods_return_rm_quarantine",
      "Goods Return to RM Quarantine Stores",
      "goods-return-rm-quarantine-stores",
      320,
      { hidden: true }
    ),
    storesCard("gin", "GIN", "gin", 330, { hidden: true }),
    storesCard("smart_gte_intra", "Smart GTE (Intra)", "smart-gte-intra", 340, { hidden: true }),
    storesCard("drn_goods_return", "DRN for Goods Return", "drn-for-goods-return", 350, { hidden: true }),
  ];

  const productionCard = (code, label, slug, sequence, admin = false) =>
    item({
      code: `production_${code}`,
      label,
      description: cardDescription(`production_${code}`),
      segment: `production/${slug}`,
      parentCode: "production",
      menuType: "landing_card",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  const landingProductionCards = [
    productionCard("electronic_mfg_ems", "Electronic Mfg. EMS", "electronic-mfg-ems", 10),
    productionCard(
      "engineering_service_request",
      "Engineering Service Request",
      "engineering-service-request",
      20
    ),
    productionCard("smart_gtr", "Smart GTR", "smart-gtr", 30, true),
    productionCard("jc_entry", "JC Entry", "jc-entry", 40, true),
    productionCard("jw_delivery_challan", "JW Delivery Challan", "jw-delivery-challan", 50, true),
    productionCard("product_sku", "Product (SKU)", "product-sku", 60),
    productionCard("production_inventory_reco", "Production Inventory Reco", "production-inventory-reco", 70, true),
    productionCard(
      "goods_return_rm_quarantine",
      "Goods Return to RM Quarantine Stores",
      "goods-return-rm-quarantine-stores",
      80,
      true
    ),
  ];

  const maintenanceCard = (code, label, slug, sequence, admin = false) =>
    item({
      code: `maintenance_${code}`,
      label,
      description: cardDescription(`maintenance_${code}`),
      segment: `maintenance/${slug}`,
      parentCode: "maintenance",
      menuType: "landing_card",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  const maintenanceGroup = (code, label, slug, sequence, admin = false) =>
    item({
      code: `maintenance_${code}`,
      label,
      description: cardDescription(`maintenance_${code}`),
      segment: `maintenance/${slug}`,
      parentCode: "maintenance",
      menuType: "card_group",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  const preventiveMaintenanceCard = (code, label, slug, sequence, admin = false) =>
    item({
      code: `maintenance_preventive_maintenance_${code}`,
      label,
      description: cardDescription(`maintenance_preventive_maintenance_${code}`),
      segment: `maintenance/preventive-maintenance/${slug}`,
      parentCode: "maintenance_preventive_maintenance",
      menuType: "landing_card",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  const landingMaintenanceCards = [
    maintenanceCard("breakdown_maintenance", "Breakdown Maintenance", "breakdown-maintenance", 10),
    maintenanceGroup("preventive_maintenance", "Preventive Maintenance", "preventive-maintenance", 20),
    maintenanceCard("purchase_requisition", "Purchase Requisition", "purchase-requisition", 30, true),
    maintenanceCard(
      "goods_transfer_request_intra",
      "Goods Transfer Request (Intra)",
      "goods-transfer-request-intra",
      40,
      true
    ),
  ];

  const landingPreventiveMaintenanceCards = [
    preventiveMaintenanceCard(
      "production_line_master",
      "Production Line Master",
      "production-line-master",
      5
    ),
    preventiveMaintenanceCard(
      "line_asset_mapping",
      "Line Asset Mapping",
      "line-asset-mapping",
      8
    ),
    preventiveMaintenanceCard(
      "pm_schedule_individual_assets",
      "PM Schedule (Assets)",
      "pm-schedule-individual-assets",
      10
    ),
    preventiveMaintenanceCard(
      "pm_log_entry_individual_assets",
      "PM Log Entry (Assets)",
      "pm-log-entry-individual-assets",
      20
    ),
    preventiveMaintenanceCard(
      "pm_line_policy",
      "PM Line Policy",
      "pm-line-policy",
      30
    ),
    preventiveMaintenanceCard(
      "pm_line_schedule",
      "PM Line Schedule",
      "pm-line-schedule",
      40
    ),
    preventiveMaintenanceCard(
      "pm_line_log_entry",
      "PM Line Log Entry",
      "pm-line-log-entry",
      50
    ),
    preventiveMaintenanceCard(
      "pm_line_compliance_report",
      "PM Line Compliance Report",
      "pm-line-compliance-report",
      60
    ),
  ];

  const qualityCard = (code, label, slug, sequence, options = false) => {
    const opts = typeof options === "boolean" ? { hidden: options } : options || {};
    return item({
      code: `quality_${code}`,
      label,
      description: cardDescription(`quality_${code}`),
      segment: opts.segment || `quality/${slug}`,
      parentCode: "quality",
      menuType: "landing_card",
      sequence,
      iconKey: opts.iconKey || "quality",
      activeIconKey: opts.activeIconKey || "quality_active",
      ...(opts.hidden ? { isHidden: true } : {}),
      ...(opts.admin ? { requiresSuperAdmin: true } : {}),
    });
  };

  /** Quality hub — setup → execution → outcomes (11 visible cards) */
  const landingQualityCards = [
    item({
      code: "quality_inspection_parameters",
      label: "Inspection Parameters",
      description: cardDescription("quality_inspection_parameters"),
      segment: "masters/quality/standard-specifications",
      parentCode: "quality",
      menuType: "landing_card",
      sequence: 10,
      iconKey: "quality",
      activeIconKey: "quality_active",
    }),
    qualityCard("inspection_plan", "Inspection Plan", "inspection-plan", 20),
    item({
      code: "quality_inspection_checklist",
      label: "Inspection Checklist",
      description: cardDescription("quality_inspection_checklist"),
      segment: "masters/quality/inspection-checklist",
      parentCode: "quality",
      menuType: "landing_card",
      sequence: 30,
      iconKey: "quality",
      activeIconKey: "quality_active",
    }),
    qualityCard("inspection_schedule", "Inspection Schedule", "inspection-schedule", 40),
    qualityCard("incoming_inspection", "Incoming Inspection", "incoming-inspection", 50),
    qualityCard("quality_inspection", "Quality Inspection", "quality-inspection", 60),
    qualityCard("inspection_results", "Inspection Results", "inspection-results", 70),
    qualityCard("quality_decisions", "Quality Decisions", "quality-decisions", 80),
    qualityCard("rejected_materials", "Rejected Materials", "rejected-materials", 90),
    qualityCard("quality_reports", "Quality Reports", "quality-reports", 100),
    qualityCard("quality_dashboard", "Quality Dashboard", "quality-dashboard", 110),
    qualityCard("mrn", "MRN", "mrn", 200, { hidden: true }),
    qualityCard("wo_execution", "WO Execution", "wo-execution", 210, { hidden: true }),
    qualityCard("pdir_entry", "PDIR Entry", "pdir-entry", 220, { hidden: true }),
    qualityCard("purchase_requisition", "Purchase Requisition", "purchase-requisition", 230, { hidden: true }),
    qualityCard("job_card_entry", "Job Card Entry", "job-card-entry", 240, { hidden: true }),
    qualityCard("rejection_summary", "Rejection Summary", "rejection-summary", 250, { hidden: true }),
    qualityCard("gtr", "GTR", "gtr", 260, { hidden: true }),
    qualityCard("jc_entry", "JC Entry", "jc-entry", 270, { hidden: true }),
    qualityCard("material_re_validation", "Material Re-Validation", "material-re-validation", 280, { hidden: true }),
    qualityCard("qc_batch_release_entry", "QC Batch Release Entry", "qc-batch-release-entry", 290, { hidden: true }),
    qualityCard("batch_card_execution", "Batch Card Execution", "batch-card-execution", 300, { hidden: true }),
  ];

  const dispatchCard = (code, label, slug, sequence, admin = false) =>
    item({
      code: `dispatch_${code}`,
      label,
      description: cardDescription(`dispatch_${code}`),
      segment: `dispatch/${slug}`,
      parentCode: "dispatch",
      menuType: "landing_card",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  const landingDispatchCards = [
    dispatchCard("cancel_drn", "Cancel DRN", "cancel-drn", 10),
    dispatchCard("shipment_planning", "Shipment Planning", "shipment-planning", 20),
    dispatchCard("tax_invoice_generation", "Tax Invoice Generation", "tax-invoice-generation", 30),
    dispatchCard("generate_e_invoice", "Generate E-Invoice", "generate-e-invoice", 40),
    dispatchCard("generate_e_way_bill", "Generate E-Way Bill", "generate-e-way-bill", 50),
    dispatchCard("jwp_tax_invoice", "JWP Tax Invoice", "jwp-tax-invoice", 60),
    dispatchCard("delivery_challan_ship_jwp", "Delivery Challan (Ship to JWP)", "delivery-challan-ship-to-jwp", 70),
    dispatchCard(
      "delivery_challan_goods_return",
      "Delivery Challan For Goods Return",
      "delivery-challan-for-goods-return",
      80
    ),
    dispatchCard("delivery_challan_rewo", "Delivery Challan (ReWo)", "delivery-challan-rewo", 90),
    dispatchCard("goods_return_e_way_bill", "Goods Return E-way Bill", "goods-return-e-way-bill", 100),
    dispatchCard("jwp_e_way_bill", "JWP E-way Bill", "jwp-e-way-bill", 110),
    dispatchCard("service_e_invoice", "Service E-Invoice", "service-e-invoice", 120),
    dispatchCard("asn", "ASN", "asn", 130),
    dispatchCard("dispatch_planning", "Dispatch Planning", "dispatch-planning", 140, true),
    dispatchCard("fg_inward_reco", "FG Inward Reco", "fg-inward-reco", 150, true),
  ];

  /** Masters → Sales sub-modules (reference data) */
  const SALES_SUBMODULE_DEFS = [
    { code: "gst_s", label: "GST/S", slug: "gst-s", sequence: 10 },
    { code: "service_master", label: "Service Master", slug: "service-master", sequence: 20 },
    { code: "b2b_customer", label: "B2B Customer", slug: "b2b-customer", sequence: 30 },
    { code: "sku", label: "SKU", slug: "sku", sequence: 40 },
    { code: "sku_customer_interface", label: "SKU-Customer Interface", slug: "sku-customer-interface", sequence: 50 },
    { code: "logistics", label: "Logistics", slug: "logistics", sequence: 60 },
    { code: "customer_open_po", label: "Customer Open PO", slug: "customer-open-po", sequence: 70 },
    { code: "product_master", label: "Product Master", slug: "product-master", sequence: 80, admin: true },
  ];

  const buildSalesSubmoduleCards = (parentCode, segmentPrefix) =>
    SALES_SUBMODULE_DEFS.map((def) =>
      item({
        code: `${parentCode}_${def.code}`,
        label: def.label,
        description: cardDescription(`${parentCode}_${def.code}`),
        segment: `${segmentPrefix}/${def.slug}`,
        parentCode,
        menuType: "landing_card",
        sequence: def.sequence,
        ...(def.admin ? { requiresSuperAdmin: true } : {}),
      })
    );

  const salesCard = (code, label, slug, sequence, admin = false) =>
    item({
      code: `sales_${code}`,
      label,
      description: cardDescription(`sales_${code}`),
      segment: `sales/${slug}`,
      parentCode: "sales",
      menuType: "landing_card",
      sequence,
      ...(admin ? { requiresSuperAdmin: true } : {}),
    });

  /** Sales → Sales Order sub-actions (hub at sales/sales-order) */
  const SALES_ORDER_ACTION_DEFS = [
    { code: "sales_order", label: "Sales Order", slug: "sales-order", sequence: 10 },
    { code: "amend_so", label: "Amend SO", slug: "amend-so", sequence: 20 },
    { code: "cancel_so", label: "Cancel SO", slug: "cancel-so", sequence: 30 },
    { code: "short_close_so", label: "Short Close SO", slug: "short-close-so", sequence: 40 },
  ];

  const landingSalesOrderCards = SALES_ORDER_ACTION_DEFS.map((def) =>
    item({
      code: `sales_sales_order_${def.code}`,
      label: def.label,
      description: cardDescription(`sales_sales_order_${def.code}`),
      segment: `sales/sales-order/${def.slug}`,
      parentCode: "sales_sales_order",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  /** Sales → Credit Note sub-actions (hub at sales/credit-note) */
  const CREDIT_NOTE_ACTION_DEFS = [
    { code: "gst_credit_note", label: "GST Credit Note", slug: "gst-credit-note", sequence: 10 },
    { code: "financial_credit_note", label: "Financial Credit Note", slug: "financial-credit-note", sequence: 20 },
    {
      code: "gst_credit_note_value_based",
      label: "GST Credit Note Value Based",
      slug: "gst-credit-note-value-based",
      sequence: 30,
    },
  ];

  const landingSalesCreditNoteCards = CREDIT_NOTE_ACTION_DEFS.map((def) =>
    item({
      code: `sales_credit_note_${def.code}`,
      label: def.label,
      description: cardDescription(`sales_credit_note_${def.code}`),
      segment: `sales/credit-note/${def.slug}`,
      parentCode: "sales_credit_note",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  /** Sales → Debit Note sub-actions (hub at sales/debit-note) */
  const DEBIT_NOTE_ACTION_DEFS = [
    { code: "gst_debit_note", label: "GST Debit Note", slug: "gst-debit-note", sequence: 10 },
    { code: "financial_debit_note", label: "Financial Debit Note", slug: "financial-debit-note", sequence: 20 },
  ];

  const landingSalesDebitNoteCards = DEBIT_NOTE_ACTION_DEFS.map((def) =>
    item({
      code: `sales_debit_note_${def.code}`,
      label: def.label,
      description: cardDescription(`sales_debit_note_${def.code}`),
      segment: `sales/debit-note/${def.slug}`,
      parentCode: "sales_debit_note",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  /** Sales hub — order-to-cash transactions (left-to-right, top-to-bottom) */
  const landingSalesCards = [
    salesCard("sales_forecast", "Sales Forecast", "sales-forecast", 10),
    salesCard("sales_order", "Sales Order", "sales-order", 20),
    salesCard("proforma_invoice", "Proforma Invoice", "proforma-invoice", 30),
    salesCard("service_invoice", "Service Invoice", "service-invoice", 40),
    salesCard("debit_note", "Debit Note", "debit-note", 50),
    salesCard("credit_note", "Credit Note", "credit-note", 60),
    salesCard("quotation", "Quotation", "quotation", 70),
    salesCard("sample_goods_order", "Sample Goods Order - SGO", "sample-goods-order", 80),
    salesCard("sample_goods_invoice", "Sample Goods Invoice", "sample-goods-invoice", 90),
    salesCard("new_shipment_planning", "New Shipment Planning", "new-shipment-planning", 100, true),
  ];

  const landingMastersSalesCards = buildSalesSubmoduleCards("masters_sales", "masters/sales");

  /** Masters → Purchase — procurement reference data (11 visible, duplicates hidden) */
  const MASTERS_PURCHASE_DEFS = [
    { code: "item_master", label: "Material Master", slug: "item-master", sequence: 10 },
    { code: "service_master", label: "Service Master", slug: "service-master", sequence: 20 },
    { code: "supplier", label: "Vendor Master", slug: "supplier", sequence: 30 },
    { code: "source_list", label: "Source List", slug: "source-list", sequence: 40 },
    {
      code: "asset_master_capitalised",
      label: "Asset Master",
      slug: "asset-master-capitalised",
      sequence: 50,
    },
    { code: "payment_terms", label: "Payment Terms", slug: "payment-terms", sequence: 60 },
    { code: "logistics", label: "Logistics", slug: "logistics", sequence: 70 },
    {
      code: "gst_p",
      label: "Tax Masters",
      slug: "gst-p",
      sequence: 80,
      menuType: "card_group",
      menuCode: "masters_purchase_gst_p",
    },
    {
      code: "upload_item_master",
      label: "Bulk Material Import",
      slug: "upload-item-master",
      sequence: 90,
    },
    {
      code: "vendor_evaluation",
      label: "Vendor Evaluation",
      slug: "vendor-evaluation",
      sequence: 200,
      hidden: true,
    },
    {
      code: "prospect_supplier",
      label: "Prospect Vendor",
      slug: "prospect-supplier",
      sequence: 210,
      hidden: true,
    },
    {
      code: "service_master_r1",
      label: "Service Master R1",
      slug: "service-master-r1",
      sequence: 220,
      hidden: true,
    },
    {
      code: "gst_p_hsn_p_master",
      label: "HSN Master",
      slug: "gst-p/hsn-p-master",
      sequence: 230,
      menuCode: "masters_purchase_gst_p_hsn_p_master",
      hidden: true,
    },
    {
      code: "gst_p_sac_p_master",
      label: "SAC Master",
      slug: "gst-p/sac-p-master",
      sequence: 240,
      menuCode: "masters_purchase_gst_p_sac_p_master",
      hidden: true,
    },
  ];

  const landingMastersPurchaseCards = MASTERS_PURCHASE_DEFS.map((def) =>
    item({
      code: def.menuCode || `masters_purchase_${def.code}`,
      label: def.label,
      description: cardDescription(def.menuCode || `masters_purchase_${def.code}`),
      segment: `masters/purchase/${def.slug}`,
      parentCode: "masters_purchase",
      menuType: def.menuType || "landing_card",
      sequence: def.sequence,
      iconKey: "purchase",
      activeIconKey: "purchase_active",
      ...(def.hidden ? { isHidden: true } : {}),
    })
  );

  /** Masters → Purchase → GST/P */
  const landingMastersPurchaseGstPCards = [
    item({
      code: "masters_purchase_gst_p_hsn_p_master",
      label: "HSN Master",
      description: cardDescription("masters_purchase_gst_p_hsn_p_master"),
      segment: "masters/purchase/gst-p/hsn-p-master",
      parentCode: "masters_purchase_gst_p",
      menuType: "landing_card",
      sequence: 10,
    }),
    item({
      code: "masters_purchase_gst_p_sac_p_master",
      label: "SAC Master",
      description: cardDescription("masters_purchase_gst_p_sac_p_master"),
      segment: "masters/purchase/gst-p/sac-p-master",
      parentCode: "masters_purchase_gst_p",
      menuType: "landing_card",
      sequence: 20,
    }),
  ];

  /** Masters → Sales → GST/S */
  const landingMastersSalesGstSCards = [
    item({
      code: "masters_sales_gst_s_hsn_s_master",
      label: "HSN/S Master",
      description: cardDescription("masters_sales_gst_s_hsn_s_master"),
      segment: "masters/sales/gst-s/hsn-s-master",
      parentCode: "masters_sales_gst_s",
      menuType: "landing_card",
      sequence: 10,
    }),
    item({
      code: "masters_sales_gst_s_sac_s_master",
      label: "SAC/S Master",
      description: cardDescription("masters_sales_gst_s_sac_s_master"),
      segment: "masters/sales/gst-s/sac-s-master",
      parentCode: "masters_sales_gst_s",
      menuType: "landing_card",
      sequence: 20,
    }),
  ];

  /** Masters → Planning sub-modules (shortcuts to sales/purchase/production masters + planning-only screens) */
  const MASTERS_PLANNING_DEFS = [
    { code: "gst_s_master", label: "GST/S Master", segment: "masters/sales/gst-s", sequence: 10 },
    { code: "customer_master", label: "Customer Master", segment: "masters/sales/b2b-customer", sequence: 20 },
    { code: "sku", label: "SKU", segment: "masters/sales/sku", sequence: 30 },
    { code: "sku_attributes", label: "SKU Attributes", segment: "masters/planning/sku-attributes", sequence: 40 },
    { code: "gst_p_master", label: "GST/P Master", segment: "masters/purchase/gst-p", sequence: 50 },
    { code: "supplier_master", label: "Supplier Master", segment: "masters/purchase/supplier", sequence: 60 },
    { code: "item_master", label: "Material Master", segment: "masters/purchase/item-master", sequence: 70 },
    { code: "logistics_master", label: "Logistics Master", segment: "masters/purchase/logistics", sequence: 80 },
    { code: "production_master", label: "Production Master", segment: "masters/production", sequence: 90 },
    { code: "bom", label: "BOM", segment: "masters/planning/bom", sequence: 100 },
    { code: "stock_levels", label: "Stock Levels", segment: "masters/planning/stock-levels", sequence: 110 },
    { code: "jw_master", label: "JW Master", segment: "masters/planning/jw-master", sequence: 120, admin: true },
  ];

  const landingMastersPlanningCards = MASTERS_PLANNING_DEFS.map((def) =>
    item({
      code: `masters_planning_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_planning_${def.code}`),
      segment: def.segment || `masters/planning/${def.slug}`,
      parentCode: "masters_planning",
      menuType: "landing_card",
      sequence: def.sequence,
      ...(def.admin ? { requiresSuperAdmin: true } : {}),
    })
  );

  /** Masters → Planning → Stock Levels (INL shortcuts; JWG stays planning-only) */
  const MASTERS_PLANNING_STOCK_LEVELS_DEFS = [
    {
      code: "item_inl",
      label: "Material INL",
      segment: "masters/planning/stock-levels/item-inl",
      sequence: 10,
    },
    {
      code: "production_item_inl",
      label: "Production Material INL",
      segment: "masters/production",
      sequence: 20,
    },
    {
      code: "sku_inl",
      label: "SKU INL",
      segment: "masters/planning/stock-levels/sku-inl",
      sequence: 30,
    },
  ];

  const landingMastersPlanningStockLevelsCards = MASTERS_PLANNING_STOCK_LEVELS_DEFS.map((def) =>
    item({
      code: `masters_planning_stock_levels_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_planning_stock_levels_${def.code}`),
      segment: def.segment,
      parentCode: "masters_planning_stock_levels",
      menuType: "landing_card",
      sequence: def.sequence,
    })
  );

  /** Masters → Leads & NPD */
  const MASTERS_LEADS_NPD_DEFS = [
    { code: "prospect_master", label: "Prospect Master", slug: "prospect-master", sequence: 10 },
    { code: "lead_source", label: "Lead Source Master", slug: "lead-source", sequence: 20 },
    { code: "competitor_master", label: "Competitor Master", slug: "competitor-master", sequence: 30 },
    { code: "product_category", label: "Product Category Master", slug: "product-category", sequence: 40 },
    { code: "npd_stage", label: "NPD Stage Master", slug: "npd-stage", sequence: 50 },
    { code: "lost_reason", label: "Lost Reason Master", slug: "lost-reason", sequence: 60 },
  ];

  const landingMastersNpdCards = MASTERS_LEADS_NPD_DEFS.map((def) =>
    item({
      code: `masters_leads_npd_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_leads_npd_${def.code}`),
      segment: `masters/leads-npd/${def.slug}`,
      parentCode: "masters_leads_npd",
      menuType: "landing_card",
      sequence: def.sequence,
      ...(def.admin ? { requiresSuperAdmin: true } : {}),
    })
  );

  /** Masters → Maintenance sub-modules */
  const MASTERS_MAINTENANCE_DEFS = [
    { code: "production_line", label: "Production Line", slug: "production-line", sequence: 10 },
    { code: "tool_master", label: "Tool Master", slug: "tool-master", sequence: 20 },
    { code: "tool_customer_interface", label: "Tool - Customer Interface", slug: "tool-customer-interface", sequence: 30 },
    { code: "asset_master", label: "Asset Master", slug: "asset-master", sequence: 40, admin: true },
    {
      code: "quality_equipment_master",
      label: "Quality Equipment Master",
      slug: "quality-equipment-master",
      sequence: 50,
      admin: true,
    },
  ];

  const landingMastersMaintenanceCards = MASTERS_MAINTENANCE_DEFS.map((def) =>
    item({
      code: `masters_maintenance_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_maintenance_${def.code}`),
      segment: `masters/maintenance/${def.slug}`,
      parentCode: "masters_maintenance",
      menuType: "landing_card",
      sequence: def.sequence,
      ...(def.admin ? { requiresSuperAdmin: true } : {}),
    })
  );

  /** Masters → Quality sub-modules (procurement QC configuration only) */
  const MASTERS_QUALITY_DEFS = [
    {
      code: "standard_specifications",
      label: "Inspection Parameters",
      slug: "standard-specifications",
      sequence: 10,
    },
    {
      code: "inspection_plan",
      label: "Inspection Plans",
      slug: "inspection-plan",
      sequence: 20,
    },
    {
      code: "inspection_checklist",
      label: "Inspection Checklist",
      slug: "inspection-checklist",
      sequence: 30,
    },
    {
      code: "defect_list_configuration",
      label: "Rejection Reasons",
      slug: "defect-list-configuration",
      sequence: 40,
    },
    {
      code: "quality_grades",
      label: "Quality Grades",
      slug: "quality-grades",
      sequence: 50,
    },
    {
      code: "sku_specifications",
      label: "Product Specifications",
      slug: "sku-specifications",
      sequence: 60,
    },
    {
      code: "rm_specifications",
      label: "Material Specifications",
      slug: "rm-specifications",
      sequence: 70,
    },
    { code: "item_qcl", label: "Material QCL", slug: "item-qcl", sequence: 200, hidden: true },
    { code: "jw_specifications", label: "JW Specifications", slug: "jw-specifications", sequence: 210, hidden: true },
    {
      code: "production_item_specification",
      label: "Production Material Specification",
      slug: "production-item-specification",
      sequence: 220,
      hidden: true,
    },
    { code: "jw_item_qcl", label: "JW Material QCL", slug: "jw-item-qcl", sequence: 230, hidden: true },
    { code: "item_qcl_master", label: "Material QCL", slug: "item-qcl-master", sequence: 240, hidden: true },
    { code: "drawing_master", label: "Drawing Master", slug: "drawing-master", sequence: 250, hidden: true },
    { code: "sku_master", label: "SKU Master", slug: "sku-master", sequence: 260, hidden: true },
    { code: "item_master", label: "Material Master", slug: "item-master", sequence: 270, hidden: true },
    {
      code: "supplier_evaluation_master",
      label: "Supplier Evaluation Master",
      slug: "supplier-evaluation-master",
      sequence: 280,
      hidden: true,
    },
    {
      code: "product_category_specifications",
      label: "Product Category Specifications",
      slug: "product-category-specifications",
      sequence: 290,
      hidden: true,
    },
    {
      code: "item_category_specifications",
      label: "Material Category Specifications",
      slug: "item-category-specifications",
      sequence: 300,
      hidden: true,
    },
  ];

  const landingMastersQualityCards = MASTERS_QUALITY_DEFS.map((def) =>
    item({
      code: `masters_quality_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_quality_${def.code}`),
      segment: def.segment || `masters/quality/${def.slug}`,
      parentCode: "masters_quality",
      menuType: "landing_card",
      sequence: def.sequence,
      iconKey: "quality",
      activeIconKey: "quality_active",
      ...(def.hidden ? { isHidden: true } : {}),
    })
  );

  /** Masters → Dispatch sub-modules */
  const MASTERS_DISPATCH_DEFS = [
    { code: "logistics", label: "Logistics", slug: "logistics", sequence: 10 },
    { code: "packing_standard", label: "Packing Standard", slug: "packing-standard", sequence: 20 },
    {
      code: "customer_transporter_interface",
      label: "Customer - Transporter Interface",
      slug: "customer-transporter-interface",
      sequence: 30,
      admin: true,
    },
    { code: "invoice_file_name", label: "Invoice File Name", slug: "invoice-file-name", sequence: 40, admin: true },
    { code: "gta_master", label: "GTA Master", slug: "gta-master", sequence: 50, admin: true },
  ];

  const landingMastersDispatchCards = MASTERS_DISPATCH_DEFS.map((def) =>
    item({
      code: `masters_dispatch_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_dispatch_${def.code}`),
      segment: `masters/dispatch/${def.slug}`,
      parentCode: "masters_dispatch",
      menuType: "landing_card",
      sequence: def.sequence,
      ...(def.admin ? { requiresSuperAdmin: true } : {}),
    })
  );

  /** Masters → Inventory sub-modules (configuration only; Material Master lives under Purchase Masters) */
  const MASTERS_STORES_DEFS = [
    { code: "warehouse", label: "Warehouse", slug: "warehouse", sequence: 10 },
    {
      code: "location",
      label: "Location",
      slug: "location-master",
      sequence: 20,
      segment: "configuration/location-master",
    },
    { code: "rack", label: "Rack", slug: "rack", sequence: 30 },
    { code: "bin", label: "Bin", slug: "bin", sequence: 40 },
    { code: "item_master", label: "Material Master", slug: "item-master", sequence: 200, hidden: true },
    { code: "upload_item_master", label: "Bulk Material Import", slug: "upload-item-master", sequence: 60 },
  ];

  const landingMastersStoresCards = MASTERS_STORES_DEFS.map((def) =>
    item({
      code: `masters_stores_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_stores_${def.code}`),
      segment: def.segment || `masters/stores/${def.slug}`,
      parentCode: "masters_stores",
      menuType: "landing_card",
      sequence: def.sequence,
      iconKey: "stores",
      activeIconKey: "stores_active",
      ...(def.hidden ? { isHidden: true } : {}),
    })
  );

  /** Masters → Inventory → Material Inventory Levels (existing Item INL route) */
  const MASTERS_STORES_STOCK_LEVELS_DEFS = [
    {
      code: "item_inl",
      label: "Material Inventory Levels",
      segment: "masters/stores/item-inl",
      sequence: 50,
    },
  ];

  const landingMastersStoresStockLevelsCards = MASTERS_STORES_STOCK_LEVELS_DEFS.map((def) =>
    item({
      code: `masters_stores_stock_levels_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_stores_stock_levels_${def.code}`),
      segment: def.segment,
      parentCode: "masters_stores",
      menuType: "landing_card",
      sequence: def.sequence,
      iconKey: "stores",
      activeIconKey: "stores_active",
      isHidden: false,
    })
  );

  /** Masters → Configuration sub-modules (procurement setup placeholders) */
  const MASTERS_CONFIGURATION_DEFS = [
    { code: "procurement_categories", label: "Procurement Categories", slug: "procurement-categories", sequence: 10 },
    { code: "purchase_types", label: "Purchase Types", slug: "purchase-types", sequence: 20 },
    { code: "priority_levels", label: "Priority Levels", slug: "priority-levels", sequence: 30 },
    { code: "tender_types", label: "Tender Types", slug: "tender-types", sequence: 40 },
    { code: "budget_heads", label: "Budget Heads", slug: "budget-heads", sequence: 50 },
    { code: "financial_years", label: "Financial Years", slug: "financial-years", sequence: 60 },
    { code: "gem_configuration", label: "GeM Configuration", slug: "gem-configuration", sequence: 70 },
  ];

  const landingMastersConfigurationCards = MASTERS_CONFIGURATION_DEFS.map((def) =>
    item({
      code: `masters_configuration_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_configuration_${def.code}`),
      segment: `masters/configuration/${def.slug}`,
      parentCode: "masters_configuration",
      menuType: "landing_card",
      sequence: def.sequence,
      iconKey: "data_management",
      activeIconKey: "data_management_active",
    })
  );

  /** Masters → Production sub-modules */
  const MASTERS_PRODUCTION_DEFS = [
    { code: "electronic_mfg_ems", label: "Electronic Mfg. EMS", slug: "electronic-mfg-ems", sequence: 10 },
    { code: "mould_master", label: "Mould Master", slug: "mould-master", sequence: 20, admin: true },
    { code: "product_lines", label: "Product Lines", slug: "product-lines", sequence: 30, admin: true },
    { code: "std_cost_sheet", label: "STD Cost Sheet", slug: "std-cost-sheet", sequence: 40, admin: true },
    { code: "demand_source", label: "Demand Source", slug: "demand-source", sequence: 50, admin: true },
  ];

  const landingMastersProductionCards = MASTERS_PRODUCTION_DEFS.map((def) =>
    item({
      code: `masters_production_${def.code}`,
      label: def.label,
      description: cardDescription(`masters_production_${def.code}`),
      segment: `masters/production/${def.slug}`,
      parentCode: "masters_production",
      menuType: "landing_card",
      sequence: def.sequence,
      ...(def.admin ? { requiresSuperAdmin: true } : {}),
    })
  );

  const leadsNpdTxnCard = (code, label, slug, sequence) =>
    item({
      code: `leads_npd_${code}`,
      label,
      description: cardDescription(`leads_npd_${code}`),
      segment: `leads-npd/${slug}`,
      parentCode: "leads_npd",
      menuType: "landing_card",
      sequence,
    });

  const LEADS_NPD_TXN_DEFS = [
    { code: "dashboard", label: "Dashboard", slug: "dashboard", sequence: 5 },
    { code: "lead_register", label: "Lead Register", slug: "lead-register", sequence: 10 },
    { code: "opportunity", label: "Opportunity Management", slug: "opportunity", sequence: 20 },
    { code: "quotation", label: "Quotation Management", slug: "quotation", sequence: 30 },
    { code: "npd_request", label: "NPD Request", slug: "npd-request", sequence: 40 },
    { code: "npd_feasibility", label: "NPD Feasibility", slug: "npd-feasibility", sequence: 50 },
    { code: "sample_development", label: "Sample Development", slug: "sample-development", sequence: 60 },
    { code: "customer_trial", label: "Customer Trial", slug: "customer-trial", sequence: 70 },
    { code: "commercialization", label: "Product Commercialization", slug: "commercialization", sequence: 80 },
  ];

  const LEADS_NPD_CONFIG_DEFS = [
    { code: "sales_pipeline", label: "Sales Pipeline Configuration", slug: "sales-pipeline", sequence: 10 },
    { code: "npd_workflow", label: "NPD Workflow Configuration", slug: "npd-workflow", sequence: 20 },
    { code: "approval_matrix", label: "Approval Matrix", slug: "approval-matrix", sequence: 30 },
  ];

  const landingLeadsNpdCards = [
    ...LEADS_NPD_TXN_DEFS.map((d) => leadsNpdTxnCard(d.code, d.label, d.slug, d.sequence)),
    item({
      code: "leads_npd_config_group",
      label: "Configuration",
      description: cardDescription("leads_npd_config_group"),
      segment: "leads-npd/configuration",
      parentCode: "leads_npd",
      menuType: "card_group",
      sequence: 90,
    }),
    ...LEADS_NPD_CONFIG_DEFS.map((d) =>
      item({
        code: `leads_npd_${d.code}`,
        label: d.label,
        description: cardDescription(`leads_npd_${d.code}`),
        segment: `leads-npd/configuration/${d.slug}`,
        parentCode: "leads_npd_config_group",
        menuType: "landing_card",
        sequence: d.sequence,
      })
    ),
  ];

  const leadsNpdReportCard = (code, label, slug, sequence) =>
    item({
      code: `reports_leads_npd_${code}`,
      label,
      description: cardDescription(`reports_leads_npd_${code}`),
      segment: `reports/leads-npd/${slug}`,
      parentCode: "reports_leads_npd",
      menuType: "landing_card",
      sequence,
    });

  const LEADS_NPD_REPORT_DEFS = [
    { code: "lead_summary", label: "Lead Summary Report", slug: "lead-summary", sequence: 10 },
    { code: "opportunity_pipeline", label: "Opportunity Pipeline Report", slug: "opportunity-pipeline", sequence: 20 },
    { code: "sales_funnel", label: "Sales Funnel Report", slug: "sales-funnel", sequence: 30 },
    { code: "quotation_report", label: "Quotation Report", slug: "quotation-report", sequence: 35 },
    { code: "lost_lead_analysis", label: "Lost Lead Analysis", slug: "lost-lead-analysis", sequence: 40 },
    { code: "npd_status", label: "NPD Status Report", slug: "npd-status", sequence: 50 },
    { code: "npd_aging", label: "NPD Aging Report", slug: "npd-aging", sequence: 60 },
    { code: "sample_tracking", label: "Sample Tracking Report", slug: "sample-tracking", sequence: 70 },
    { code: "commercialization", label: "Commercialization Report", slug: "commercialization", sequence: 80 },
  ];

  const landingLeadsNpdReportCards = LEADS_NPD_REPORT_DEFS.map((d) =>
    leadsNpdReportCard(d.code, d.label, d.slug, d.sequence)
  );

  const landingMenuModules = [];
  const moduleHubs = [
    ...ERP_SIDEBAR_MENUS.filter(
      (m) =>
        m.code !== "dashboard" &&
        m.code !== "finance" &&
        m.code !== "reports" &&
        m.code !== "leads_npd" &&
        m.code !== "purchase" &&
        m.code !== "stores" &&
        m.code !== "production" &&
        m.code !== "maintenance" &&
        m.code !== "quality" &&
        m.code !== "dispatch" &&
        m.code !== "sales"
    ),
    ...APPLICATIONS_FLYOUT_MENUS,
  ];
  for (const hub of moduleHubs) {
    for (let m = 1; m <= 4; m += 1) {
      landingMenuModules.push(
        item({
          code: `${hub.code}_module_${m}`,
          label: `Module ${m}`,
          description: cardDescription(`${hub.code}_module_${m}`),
          segment: `${hub.segment}/module-${m}`,
          parentCode: hub.code,
          menuType: "landing_card",
          sequence: m * 10,
        })
      );
    }
  }

  // Top-level group cards shown on the Settings landing page
  // card_group type — acts as a navigational container for child landing_cards
  const landingConfigurationGroups = [
    item({ code: "company_setup_group", label: "Company Setup", description: "Company profile, locations, sub-locations, and inventory stores", segment: "configuration/company-setup", parentCode: "settings", menuType: "card_group", sequence: 10, iconKey: "company_setup", activeIconKey: "company_setup_active" }),
    item({ code: "app_setup_group", label: "Application Setup", description: "App branding, menus, modules, and icons", segment: "configuration/app-setup", parentCode: "settings", menuType: "card_group", sequence: 20, iconKey: "app_setup", activeIconKey: "app_setup_active" }),
    item({ code: "roles_access", label: "Roles & Access", description: "User and role management", segment: "configuration/roles-access", parentCode: "settings", menuType: "card_group", sequence: 30, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "governance_group", label: "Governance & Workflow", description: "Approval matrix, workflow rules, and document governance", segment: "configuration/governance", parentCode: "settings", menuType: "card_group", sequence: 35, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "data_mgmt_group", label: "Data Management", description: "Master data and bulk CSV import", segment: "configuration/data-management", parentCode: "settings", menuType: "card_group", sequence: 40, iconKey: "data_management", activeIconKey: "data_management_active", requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "communication_group", label: "Communication", description: "Email configuration and file management", segment: "configuration/communication", parentCode: "settings", menuType: "card_group", sequence: 50, iconKey: "communication", activeIconKey: "communication_active" }),
    item({ code: "system_group", label: "System", description: "Audit logs and system monitoring", segment: "configuration/system", parentCode: "settings", menuType: "card_group", sequence: 60, iconKey: "system", activeIconKey: "system_active" }),
  ];

  // Individual cards nested under their group parents
  const landingConfiguration = [
    // Company Setup group children
    item({ code: "company_setup", label: "Company", description: "Company profile and organization settings", segment: "configuration/company", parentCode: "company_setup_group", menuType: "landing_card", sequence: 10 }),
    item({ code: "location_master", label: "Location Master", description: "Manage business locations and GSTIN", segment: "configuration/location-master", parentCode: "company_setup_group", menuType: "landing_card", sequence: 20 }),
    item({ code: "sub_locations", label: "Sub Location Master", description: "Manage sub-locations under parent locations", segment: "configuration/sub-locations", parentCode: "company_setup_group", menuType: "landing_card", sequence: 30 }),
    item({ code: "inventory_stores", label: "Inventory Stores", description: "Manage stock-holding stores per location", segment: "configuration/inventory-stores", parentCode: "company_setup_group", menuType: "landing_card", sequence: 40 }),
    // Application Setup group children
    item({ code: "application_setup", label: "Application Set-up", description: "Application name, version, branding and logos", segment: "configuration/application-setup", parentCode: "app_setup_group", menuType: "landing_card", sequence: 10, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "menu_setup", label: "Menu Setup", description: "Sidebar navigation items, order, and visibility", segment: "configuration/menu-setup", parentCode: "app_setup_group", menuType: "landing_card", sequence: 20, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "modules_setup", label: "Modules Setup", description: "Landing page module cards for each sidebar menu", segment: "configuration/modules-setup", parentCode: "app_setup_group", menuType: "landing_card", sequence: 30, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "groups_setup", label: "Groups Setup", description: "Create and manage card groups under any sidebar menu", segment: "configuration/groups-setup", parentCode: "app_setup_group", menuType: "landing_card", sequence: 35, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "icons_setup", label: "Menu Icons", description: "Upload custom sidebar icons without code changes", segment: "configuration/icons-setup", parentCode: "app_setup_group", menuType: "landing_card", sequence: 40, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "dashboard_role_mapping", label: "Role Dashboard Mapping", description: "Assign dashboard views to user roles", segment: "configuration/dashboard-role-mapping", parentCode: "app_setup_group", menuType: "landing_card", sequence: 45, requiresSuperAdmin: true, isHidden: false }),
    // Data Management group children — Admin and Super Admin only
    item({ code: "auto_increment", label: "Auto Increment", description: "Configure module prefixes and sequential number generation", segment: "configuration/auto-increment", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 5, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "master_data", label: "Master Data", description: "Manage generic key-value lookup data (trades, skills, departments, etc.)", segment: "configuration/master-data", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 10, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "po_type", label: "PO Type", description: "Configure purchase order types and display order for Generate PO", segment: "configuration/po-type", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 12, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "incidental_expenses", label: "Incidental Expenses", description: "Configure incidental expense types and display order for purchase orders", segment: "configuration/incidental-expenses", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 13, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "po_terms_and_conditions", label: "PO Terms & Conditions", description: "Configure opening line and terms appended to supplier purchase order copies", segment: "configuration/po-terms-and-conditions", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 14, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "quotation_terms_and_conditions", label: "Quotation Terms & Conditions", description: "Configure opening line and terms appended to customer quotation print copies", segment: "configuration/quotation-terms-and-conditions", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 16, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "item_document_types", label: "Material Document Types", description: "Configure drawing and document types for Material Master", segment: "configuration/item-document-types", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 15, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "item_attributes", label: "Material Attributes", description: "Configure industry-specific attribute definitions for Material Master", segment: "configuration/item-attributes", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 17, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    item({ code: "bulk_import", label: "Bulk CSV Import", description: "Upload CSV files to bulk-import data into any registered model", segment: "configuration/bulk-import", parentCode: "data_mgmt_group", menuType: "landing_card", sequence: 20, requiresAdmin: true, requiresSuperAdmin: false, isHidden: false }),
    // Communication group children
    item({ code: "email_setup", label: "Email Configuration", description: "SMTP settings, transactional email templates, and test email", segment: "configuration/email-setup", parentCode: "communication_group", menuType: "landing_card", sequence: 10, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "file_manager", label: "File Manager", description: "Upload, preview, and manage files and documents", segment: "configuration/file-manager", parentCode: "communication_group", menuType: "landing_card", sequence: 20, requiresSuperAdmin: true, isHidden: false }),
    // System group children
    item({ code: "audit_logs", label: "Audit Logs", description: "View and manage system audit trail for all operations", segment: "configuration/audit-logs", parentCode: "system_group", menuType: "landing_card", sequence: 10, requiresSuperAdmin: true, isHidden: false }),
    item({ code: "active_users", label: "Active Users", description: "View logged-in user sessions and login history", segment: "configuration/active-users", parentCode: "system_group", menuType: "landing_card", sequence: 20, requiresSuperAdmin: true, isHidden: false }),
    // Governance & Workflow group children (placeholders + shortcuts)
    item({ code: "governance_user_management", label: "User Management", description: cardDescription("governance_user_management"), segment: "configuration/roles-access/user-management", parentCode: "governance_group", menuType: "landing_card", sequence: 10, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "governance_role_management", label: "Role Management", description: cardDescription("governance_role_management"), segment: "configuration/roles-access/access-management", parentCode: "governance_group", menuType: "landing_card", sequence: 20, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "governance_approval_matrix", label: "Approval Matrix", description: cardDescription("governance_approval_matrix"), segment: "configuration/governance/approval-matrix", parentCode: "governance_group", menuType: "landing_card", sequence: 30, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "governance_workflow_configuration", label: "Workflow Configuration", description: cardDescription("governance_workflow_configuration"), segment: "configuration/governance/workflow-configuration", parentCode: "governance_group", menuType: "landing_card", sequence: 40, iconKey: "roles_access", activeIconKey: "roles_access_active" }),
    item({ code: "governance_document_number_series", label: "Document Number Series", description: cardDescription("governance_document_number_series"), segment: "configuration/auto-increment", parentCode: "governance_group", menuType: "landing_card", sequence: 50, iconKey: "auto_increment", activeIconKey: "auto_increment" }),
    item({ code: "governance_email_templates", label: "Email Templates", description: cardDescription("governance_email_templates"), segment: "configuration/email-setup", parentCode: "governance_group", menuType: "landing_card", sequence: 60, iconKey: "communication", activeIconKey: "communication_active" }),
    item({ code: "governance_notification_templates", label: "Notification Templates", description: cardDescription("governance_notification_templates"), segment: "configuration/governance/notification-templates", parentCode: "governance_group", menuType: "landing_card", sequence: 70, iconKey: "communication", activeIconKey: "communication_active" }),
    item({ code: "governance_audit_logs", label: "Audit Logs", description: cardDescription("governance_audit_logs"), segment: "configuration/audit-logs", parentCode: "governance_group", menuType: "landing_card", sequence: 80, iconKey: "system", activeIconKey: "system_active" }),
    item({ code: "governance_company_configuration", label: "Company Configuration", description: cardDescription("governance_company_configuration"), segment: "configuration/company", parentCode: "governance_group", menuType: "landing_card", sequence: 90, iconKey: "company_setup", activeIconKey: "company_setup_active" }),
    item({ code: "governance_financial_year", label: "Financial Year", description: cardDescription("governance_financial_year"), segment: "configuration/governance/financial-year", parentCode: "governance_group", menuType: "landing_card", sequence: 100, iconKey: "company_setup", activeIconKey: "company_setup_active" }),
  ];

  return [
    ...sidebarMain,
    ...sidebarBottom,
    ...applicationsFlyout,
    ...landingReportsCards,
    ...landingPurchaseReportCards,
    ...landingMastersCards,
    ...landingPurchaseCards,
    ...landingPurchaseOrderCards,
    ...landingServicePoCards,
    ...landingJobWorkCards,
    ...landingFinanceCards,
    ...landingStoresCards,
    ...landingQualityCards,
    ...landingMastersPurchaseCards,
    ...landingMastersPurchaseGstPCards,
    ...landingMastersQualityCards,
    ...landingMastersStoresCards,
    ...landingMastersStoresStockLevelsCards,
    ...landingMastersConfigurationCards,
    ...landingMenuModules,
    ...landingConfigurationGroups,
    ...landingConfiguration,
  ];
}

/** Previous framework / accounts sidebar codes removed on sync */
export const LEGACY_MAIN_MENU_CODES = [
  "menu_1",
  "menu_2",
  "menu_3",
  "menu_4",
  "menu_5",
  "menu_6",
  "menu_7",
  "menu_8",
  "expense",
  "payment",
  "receipt",
  "contra",
  "journal",
  "reports",
];

/** All legacy module / sidebar codes removed during menu sync */
export const LEGACY_ACCOUNTS_MENU_CODES = [
  ...LEGACY_MAIN_MENU_CODES,
  "masters_module_1",
  "masters_module_2",
  "masters_module_3",
  "masters_module_4",
  "sales_register",
  "purchase_register",
  "expense_register",
  "payment_register",
  "receipt_register",
  "coa",
  "coa_equity",
  "coa_liability",
  "coa_asset",
  "coa_income",
  "coa_expense",
  "coa_supplier_master",
  "coa_customer_master",
  "coa_bank_accounts",
  "coa_tax_master",
  "coa_asset_master",
  "settings_coa",
  "coa_upload",
  "dropdown_settings",
  "trial_balance",
  "profit_loss",
  "balance_sheet",
  "gst_reports",
];

export function buildRolePermissions(menuDocs, mode) {
  const allFlags = () => ({
    create: true,
    edit: true,
    view: true,
    approve: true,
    cancel: true,
    delete: true,
    reportGenerated: true,
    acknowledgment: true,
    download: true,
  });
  const viewEditFlags = () => ({
    create: true,
    edit: true,
    view: true,
    approve: false,
    cancel: false,
    delete: false,
    reportGenerated: true,
    acknowledgment: true,
    download: true,
  });
  const viewOnlyFlags = () => ({
    create: false,
    edit: false,
    view: true,
    approve: false,
    cancel: false,
    delete: false,
    reportGenerated: true,
    acknowledgment: false,
    download: true,
  });

  const flagsFn = mode === "super" ? allFlags : mode === "admin" ? viewEditFlags : viewOnlyFlags;

  return menuDocs.map((m) => {
    const base = {
      menuItemId: m._id,
      businessFunction: m.code,
      ...flagsFn(),
    };
    if (mode === "admin" && m.requiresSuperAdmin) {
      return { ...base, ...viewOnlyFlags(), view: false, edit: false };
    }
    if (m.requiresAdmin && mode !== "super" && mode !== "admin") {
      return { ...base, ...viewOnlyFlags(), view: false, edit: false, create: false };
    }
    if (m.code === "settings" && mode !== "super" && mode !== "admin") {
      return { ...base, ...viewOnlyFlags(), view: false, edit: false, create: false };
    }
    return base;
  });
}
