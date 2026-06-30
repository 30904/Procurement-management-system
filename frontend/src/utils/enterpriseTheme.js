/** Enterprise manufacturing ERP palette (Smart ERP) */
export const ENTERPRISE_PRIMARY = "#0F7C94";
export const ENTERPRISE_PRIMARY_HOVER = "#0C6A7E";
export const ENTERPRISE_ACCENT = "#DC2626";

/** Legacy theme colors stored in DB before enterprise rebrand */
const LEGACY_PRIMARY_COLORS = new Set([
  "#197dfa",
  "#197DFA",
  "#006efa",
  "#006EFA",
  "#007dfa",
  "#007DFA",
  "#005afa",
  "#005AFA",
  "#0046d2",
  "#0046D2",
  "#506ed2",
  "#506ED2",
  "#2563eb",
  "#2563EB",
]);

const LEGACY_ACCENT_COLORS = new Set([
  "#ff0096",
  "#FF0096",
  "#ff3296",
  "#FF3296",
  "#ec4899",
  "#EC4899",
]);

export function normalizeThemePrimaryColor(hex) {
  if (!hex || typeof hex !== "string") return ENTERPRISE_PRIMARY;
  const trimmed = hex.trim();
  if (LEGACY_PRIMARY_COLORS.has(trimmed)) return ENTERPRISE_PRIMARY;
  return trimmed;
}

export function normalizeThemeAccentColor(hex) {
  if (!hex || typeof hex !== "string") return ENTERPRISE_ACCENT;
  const trimmed = hex.trim();
  if (LEGACY_ACCENT_COLORS.has(trimmed)) return ENTERPRISE_ACCENT;
  return trimmed;
}
