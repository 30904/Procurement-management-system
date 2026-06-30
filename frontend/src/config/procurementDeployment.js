/** MPBCDC procurement deployment profile — configuration only. */
export const PROCUREMENT_DEPLOYMENT = {
  profile: "mpbcdc",
  /** Show all hub cards including manufacturing and legacy entries. */
  hideManufacturingHubCards: false,
};

/** Menu codes treated as manufacturing-only for MPBCDC deployment. */
export const MANUFACTURING_HUB_CARD_CODES = new Set([
  "purchase_job_work",
  "purchase_job_work_generate_jwo",
  "purchase_mjw_delivery_challan",
  "purchase_delivery_challan_generic",
  "purchase_intra_delivery_challan",
  "stores_goods_inward",
  "stores_gte",
  "stores_gin",
  "stores_finished_goods_inward_entry",
  "stores_intra_delivery_challan",
  "stores_rework_authorisation",
  "stores_smart_gte_intra",
  "stores_goods_return_rm_quarantine",
  "quality_mrn",
  "quality_wo_execution",
  "quality_job_card_entry",
  "quality_jc_entry",
  "quality_batch_card_execution",
  "quality_gtr",
  "quality_pdir_entry",
  "quality_material_re_validation",
  "quality_qc_batch_release_entry",
  "quality_rejection_summary",
  "reports_purchase_job_work",
]);
