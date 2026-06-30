/**
 * Browser tab title: "{Page} · {Application Name}"
 */
const DASHBOARD = "Dashboard";

const SEGMENT_LABEL_OVERRIDES = {
  pnl: "Profit & Loss",
  gst: "GST",
  mis: "Finance MIS",
};

function labelForSegment(segment) {
  const menuMatch = segment.match(/^menu-(\d+)$/i);
  if (menuMatch) return `Menu ${menuMatch[1]}`;
  const moduleMatch = segment.match(/^module-(\d+)$/i);
  if (moduleMatch) return `Module ${moduleMatch[1]}`;
  return segmentToLabel(segment);
}

import { APP_BRANDING_DEFAULTS } from "../config/appBrandingDefaults.js";

let titleBase = APP_BRANDING_DEFAULTS.applicationName;

export function setDocumentTitleBase(name) {
  if (name && String(name).trim()) {
    titleBase = String(name).trim();
  }
}

export function getDocumentTitleBase() {
  return titleBase;
}

function segmentToLabel(segment) {
  if (!segment) return DASHBOARD;
  const lower = segment.toLowerCase();
  if (SEGMENT_LABEL_OVERRIDES[lower]) return SEGMENT_LABEL_OVERRIDES[lower];
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getTitleForPathname(pathname, base = titleBase) {
  const appName = base || titleBase;
  if (!pathname.startsWith("/app")) {
    if (pathname === "/login") return `Sign in · ${appName}`;
    return `${appName}`;
  }

  const rest = pathname.replace(/^\/app\/?/, "").replace(/\/$/, "");
  if (!rest || rest === "dashboard") {
    return `${DASHBOARD} · ${appName}`;
  }

  const parts = rest.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (parts[0]?.startsWith("menu-") && parts.length >= 2) {
    return `${labelForSegment(last)} · ${labelForSegment(parts[0])} · ${appName}`;
  }
  return `${labelForSegment(last)} · ${appName}`;
}

export function applyDocumentTitle(pathname, base) {
  if (typeof document === "undefined") return;
  document.title = getTitleForPathname(pathname, base);
}
