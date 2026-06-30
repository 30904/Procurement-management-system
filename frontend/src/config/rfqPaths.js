export const RFQ_PATHS = {
  hubPath: "purchase",
  listPath: "purchase/rfq-management",
  newPath: "purchase/rfq-management/new",
  editPath: (id) => `purchase/rfq-management/${id}/edit`,
  detailPath: (id) => `purchase/rfq-management/${id}`,
  printPath: (id) => `purchase/rfq-management/${id}/print`,
  reportPath: "reports/purchase/rfq-register",
  menuCode: "purchase_rfq_management",
  reportMenuCode: "reports_purchase_rfq_register",
  title: "RFQ Management",
  reportTitle: "RFQ Register",
};
