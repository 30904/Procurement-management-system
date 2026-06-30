export const PURCHASE_INDENT_PATHS = {
  hubPath: "purchase",
  listPath: "purchase/purchase-indent",
  approvedListPath: "purchase/purchase-indent/approved",
  newPath: "purchase/purchase-indent/new",
  editPath: (id) => `purchase/purchase-indent/${id}/edit`,
  detailPath: (id) => `purchase/purchase-indent/${id}`,
  printPath: (id) => `purchase/purchase-indent/${id}/print`,
  approvedDetailPath: (id) => `purchase/purchase-indent/${id}?from=approved`,
  menuCode: "purchase_purchase_indent",
  approvedMenuCode: "purchase_approved_purchase_indents",
  title: "Purchase Requisition",
  approvedTitle: "Approved Requisitions",
};
