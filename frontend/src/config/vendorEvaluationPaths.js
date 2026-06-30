import { appPath } from "./navigation.js";

const BASE = "purchase/vendor-evaluation";

export const vendorEvaluationPaths = {
  hub: appPath(BASE),
  dashboard: appPath(BASE),
  list: appPath(`${BASE}/list`),
  compare: appPath(`${BASE}/compare`),
  detail: (code) => appPath(`${BASE}/${encodeURIComponent(code)}`),
  scorecard: (code) => appPath(`${BASE}/${encodeURIComponent(code)}/scorecard`),
  trend: (code) => appPath(`${BASE}/${encodeURIComponent(code)}/trend`),
  history: (code) => appPath(`${BASE}/${encodeURIComponent(code)}/history`),
};

export const VENDOR_EVALUATION_HUB_RETURN = appPath("purchase");
