/** Dashboard variant registry (mirrors backend config). */
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

export const DASHBOARD_BY_KEY = Object.fromEntries(
  DASHBOARD_CATALOG.map((d) => [d.key, d])
);

export const DEFAULT_DASHBOARD_KEY = "purchase";
