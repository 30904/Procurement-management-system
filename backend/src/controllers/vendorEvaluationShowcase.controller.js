import {
  filterShowcaseVendors,
  findShowcaseVendor,
  getShowcaseDashboardStats,
  VENDOR_EVALUATION_SHOWCASE_VENDORS,
} from "../data/vendorEvaluationShowcase.data.js";

export function dashboard(_req, res) {
  res.json({ success: true, data: getShowcaseDashboardStats() });
}

export function listVendors(req, res) {
  const rows = filterShowcaseVendors(req.query);
  res.json({ success: true, data: rows, total: rows.length });
}

export function getVendor(req, res) {
  const row = findShowcaseVendor(req.params.code);
  if (!row) {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }
  res.json({ success: true, data: row });
}

export function getVendorHistory(req, res) {
  const row = findShowcaseVendor(req.params.code);
  if (!row) {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }
  res.json({ success: true, data: row.history || [] });
}

export function getVendorTrend(req, res) {
  const row = findShowcaseVendor(req.params.code);
  if (!row) {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }
  res.json({ success: true, data: row.trend || [] });
}

export function compareVendors(req, res) {
  const codes = Array.isArray(req.body?.vendorCodes) ? req.body.vendorCodes : [];
  if (codes.length < 2 || codes.length > 4) {
    return res.status(400).json({
      success: false,
      message: "Select between 2 and 4 vendors to compare",
    });
  }
  const vendors = codes.map((c) => findShowcaseVendor(c)).filter(Boolean);
  if (vendors.length !== codes.length) {
    return res.status(404).json({ success: false, message: "One or more vendors not found" });
  }
  const ranked = [...vendors].sort((a, b) => b.currentScore - a.currentScore);
  res.json({
    success: true,
    data: {
      vendors: ranked,
      winner: ranked[0],
      ranking: ranked.map((v, i) => ({
        rank: i + 1,
        vendorCode: v.vendorCode,
        vendorName: v.vendorName,
        score: v.currentScore,
        rating: v.overallRating,
      })),
    },
  });
}

export function listOptions(_req, res) {
  const categories = [...new Set(VENDOR_EVALUATION_SHOWCASE_VENDORS.map((v) => v.category))].sort();
  const materialGroups = [...new Set(VENDOR_EVALUATION_SHOWCASE_VENDORS.map((v) => v.materialGroup))].sort();
  const departments = [...new Set(VENDOR_EVALUATION_SHOWCASE_VENDORS.map((v) => v.department))].sort();
  res.json({
    success: true,
    data: {
      categories,
      materialGroups,
      departments,
      ratings: ["Excellent", "Good", "Average", "Needs Improvement", "Blacklisted"],
      statuses: ["Approved", "Under Review", "Blacklisted"],
    },
  });
}
