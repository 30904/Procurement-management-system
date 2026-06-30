import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appPath } from "../config/navigation.js";

/** Menu parentCode → app route users should return to when leaving a shared master screen. */
const HUB_RETURN_BY_PARENT_CODE = {
  masters: "masters",
  masters_planning: "masters/planning",
  masters_purchase: "masters/purchase",
  masters_sales: "masters/sales",
  masters_stores: "masters/stores",
  masters_production: "masters/production",
  masters_maintenance: "masters/maintenance",
  masters_quality: "masters/quality",
  masters_dispatch: "masters/dispatch",
  masters_leads_npd: "masters/leads-npd",
  masters_sales_gst_s: "masters/sales/gst-s",
  masters_purchase_gst_p: "masters/purchase/gst-p",
  masters_planning_stock_levels: "masters/planning/stock-levels",
  purchase: "purchase",
  sales: "sales",
  stores: "stores",
  production: "production",
  quality: "quality",
  maintenance: "maintenance",
  dispatch: "dispatch",
  leads_npd: "leads-npd",
};

const HUB_RETURN_LABELS = {
  "masters/planning": "Planning",
  "masters/purchase": "Purchase",
  "masters/sales": "Sales",
  "masters/stores": "Stores",
  "masters/production": "Production",
  "masters/maintenance": "Maintenance",
  "masters/quality": "Quality",
  "masters/dispatch": "Dispatch",
  "masters/leads-npd": "NPD",
  "masters/sales/gst-s": "GST/S",
  "masters/purchase/gst-p": "GST/P",
  "masters/planning/stock-levels": "Stock Levels",
  masters: "Masters",
  purchase: "Purchase",
  sales: "Sales",
};

export function hubReturnForParentCode(parentCode) {
  return HUB_RETURN_BY_PARENT_CODE[parentCode] || null;
}

export function hubReturnLabel(hubReturnPath) {
  const key = String(hubReturnPath || "").replace(/^\/+/, "");
  if (HUB_RETURN_LABELS[key]) return HUB_RETURN_LABELS[key];
  const last = key.split("/").filter(Boolean).pop();
  if (!last) return "Back";
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveHubReturn({ parentCode, backSegment, locationState }) {
  const fromParent = hubReturnForParentCode(parentCode);
  if (fromParent) return fromParent;
  if (locationState?.hubReturn) return String(locationState.hubReturn);
  return backSegment || "dashboard";
}

/** Hub path to store when navigating from a hub tile into a child screen. */
export function hubReturnForChildNavigation(parentCode, backSegment, locationState) {
  return (
    hubReturnForParentCode(parentCode) ||
    resolveHubReturn({ parentCode, backSegment, locationState })
  );
}

/**
 * Prefer browser back when possible; otherwise navigate to fallback path.
 */
export function useHistoryBack(fallbackPath) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const hasStack =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      location.key !== "default";
    if (hasStack) {
      navigate(-1);
      return;
    }
    if (fallbackPath) {
      navigate(appPath(fallbackPath));
    }
  }, [navigate, location.key, fallbackPath]);
}

/**
 * @param {string} defaultHubReturn - fallback when navigation state has no hubReturn (e.g. "masters/purchase")
 */
function resolveEffectiveHubReturn(locationState, defaultHubReturn) {
  const fromState = String(locationState?.hubReturn ?? "").trim();
  const fallback = String(defaultHubReturn ?? "").trim() || "masters";
  if (!fromState) return fallback;
  if (fromState === "dashboard" && fallback.startsWith("masters/")) return fallback;
  return fromState;
}

export function useHubReturn(defaultHubReturn = "masters") {
  const location = useLocation();
  const navigate = useNavigate();
  const hubReturn = resolveEffectiveHubReturn(location.state, defaultHubReturn);
  const label = hubReturnLabel(hubReturn);

  const goBack = useCallback(() => {
    navigate(appPath(hubReturn));
  }, [hubReturn, navigate]);

  const navigateWithHubReturn = useCallback(
    (path, options = {}) => {
      navigate(appPath(path), {
        ...options,
        state: { ...(options.state || {}), hubReturn },
      });
    },
    [hubReturn, navigate]
  );

  return {
    hubReturn,
    hubReturnLabel: label,
    goBack,
    navigateWithHubReturn,
    locationState: location.state,
  };
}
