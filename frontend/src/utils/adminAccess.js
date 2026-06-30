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

export function isAdminRole(roles) {
  return (roles || []).some((role) => {
    const name = String(role?.roleName || role?.displayRoleName || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    return name === "admin";
  });
}

export function isAdminOrSuperAdmin({ isSuperAdmin, roles }) {
  if (isSuperAdmin) return true;
  return isAdminRole(roles);
}

export function canAccessAdminOnlyMenu(menuCode, { isSuperAdmin, roles }) {
  if (!isAdminOnlyMenuCode(menuCode)) return true;
  return isAdminOrSuperAdmin({ isSuperAdmin, roles });
}

export function canAccessSettingsHub({ isSuperAdmin, roles, checkPermission }) {
  if (!isAdminOrSuperAdmin({ isSuperAdmin, roles })) return false;
  if (isSuperAdmin) return true;
  return checkPermission("settings").enabled;
}

export function canAccessRolesHub({ isSuperAdmin, roles, checkPermission }) {
  if (isSuperAdmin) return true;
  if (isAdminRole(roles)) return true;
  return checkPermission("roles_access").enabled;
}
