/**
 * Registered dashboard views — keys are stored on Role.dashboardKey.
 */
export const DASHBOARD_CATALOG = [
  {
    key: "executive",
    label: "Executive Overview",
    description: "Company-wide KPIs, revenue trends, and strategic snapshots.",
  },
  {
    key: "operations",
    label: "Operations Command",
    description: "Production, quality, dispatch, and supply-chain performance.",
  },
  {
    key: "finance",
    label: "Finance Pulse",
    description: "Cash flow, receivables, payables, and compliance indicators.",
  },
  {
    key: "purchase",
    label: "Procurement Dashboard",
    description:
      "Purchase spend, PO pipeline, supplier concentration, and procurement KPIs for your active location.",
  },
  {
    key: "default",
    label: "Workspace Home",
    description: "General framework overview with setup checklist and quick navigation.",
  },
];

export const DASHBOARD_KEYS = new Set(DASHBOARD_CATALOG.map((d) => d.key));

export const DEFAULT_DASHBOARD_KEY = "purchase";

export function isValidDashboardKey(key) {
  return DASHBOARD_KEYS.has(String(key || "").trim());
}

export function getDashboardMeta(key) {
  return DASHBOARD_CATALOG.find((d) => d.key === key) || DASHBOARD_CATALOG.find((d) => d.key === DEFAULT_DASHBOARD_KEY);
}
