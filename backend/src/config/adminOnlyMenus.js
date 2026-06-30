/** Menu codes visible only to Admin and Super Admin (normal tiles, not hidden chrome). */
export const ADMIN_ONLY_MENU_CODES = new Set([
  "settings",
  "data_mgmt_group",
  "auto_increment",
  "master_data",
  "po_type",
  "incidental_expenses",
  "po_terms_and_conditions",
  "quotation_terms_and_conditions",
  "item_document_types",
  "item_attributes",
  "bulk_import",
]);

export function isAdminOnlyMenuCode(code) {
  return ADMIN_ONLY_MENU_CODES.has(String(code || "").trim());
}
