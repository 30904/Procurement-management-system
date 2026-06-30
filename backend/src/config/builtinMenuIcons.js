/** Built-in sidebar icon keys (SVG bundled in frontend/src/assets/erp). */
export const BUILTIN_MENU_ICONS = [
  { code: "dashboard", label: "Dashboard" },
  { code: "leads_npd", label: "Leads & NPD" },
  { code: "planning", label: "Planning" },
  { code: "sales", label: "Sales" },
  { code: "purchase", label: "Purchase" },
  { code: "stores", label: "Stores" },
  { code: "production", label: "Production" },
  { code: "maintenance", label: "Maintenance" },
  { code: "quality", label: "Quality" },
  { code: "dispatch", label: "Dispatch" },
  { code: "hrm", label: "HRM" },
  { code: "accounts", label: "Accounts" },
  { code: "finance", label: "Finance" },
  { code: "reports", label: "Reports" },
  { code: "applications", label: "Applications (grid)" },
  { code: "masters", label: "Masters" },
  { code: "settings", label: "Settings (footer)" },
  { code: "support", label: "Support" },
  { code: "menu", label: "Applications (legacy)" },
  { code: "menu", label: "Generic menu" },
];

export const BUILTIN_ICON_KEY_SET = new Set(BUILTIN_MENU_ICONS.map((i) => i.code));
