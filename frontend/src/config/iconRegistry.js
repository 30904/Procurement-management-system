import MenuLucideIcon, {
  LUCIDE_ICON_MAP,
  createMenuIconComponent,
} from "../components/common/MenuLucideIcon.jsx";

export { LUCIDE_ICON_MAP, MenuLucideIcon };

/** Base icon keys (inactive). Active state uses slightly heavier stroke on Lucide icons. */
export const MENU_ICON_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads_npd", label: "Leads & NPD" },
  { key: "planning", label: "Planning" },
  { key: "sales", label: "Sales" },
  { key: "purchase", label: "Purchase" },
  { key: "stores", label: "Stores" },
  { key: "production", label: "Production" },
  { key: "maintenance", label: "Maintenance" },
  { key: "quality", label: "Quality" },
  { key: "dispatch", label: "Dispatch" },
  { key: "hrm", label: "HR" },
  { key: "accounts", label: "Accounts" },
  { key: "finance", label: "Finance" },
  { key: "reports", label: "Reports" },
  { key: "applications", label: "Applications" },
  { key: "masters", label: "Masters" },
  { key: "settings", label: "Settings" },
  { key: "support", label: "Support" },
  { key: "menu", label: "Applications (legacy)" },
];

export const ALLOWED_MENU_ICON_KEYS = new Set(MENU_ICON_OPTIONS.map((o) => o.key));

export function resolveMenuIcon(key, active = false) {
  if (!key) return null;
  const base = String(key).replace(/_active$/, "");
  if (!LUCIDE_ICON_MAP[base] && base !== "menu") return null;
  return createMenuIconComponent(base, active);
}

export function menuIconToActiveKey(iconKey) {
  const base = String(iconKey || "menu").trim();
  return ALLOWED_MENU_ICON_KEYS.has(base) ? `${base}_active` : "menu_active";
}

export function resolveMenuIconPair(iconKey) {
  const base = ALLOWED_MENU_ICON_KEYS.has(iconKey) ? iconKey : "menu";
  return { iconKey: base, activeIconKey: `${base}_active` };
}
