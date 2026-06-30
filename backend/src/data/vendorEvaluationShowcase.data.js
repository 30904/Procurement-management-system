/** Showcase-only dummy vendor performance data — replaceable by real scoring engine. */

const VENDOR_NAMES = [
  "Bharat Industrial Supplies Pvt Ltd",
  "Maharashtra Tech Components Ltd",
  "Western Logistics Partners",
  "Pune Precision Engineering",
  "National Office Solutions",
  "Konkan Medical Distributors",
  "Deccan Construction Materials",
  "Vidarbha Agro Inputs Co",
  "Mumbai Electrical Traders",
  "Sahyadri Packaging Industries",
  "Central IT Procurement Services",
  "Marathwada Safety Equipment",
  "Nashik Auto Parts LLP",
  "Goa Marine Services",
  "Solapur Textile Suppliers",
  "Aurangabad Chemicals Ltd",
  "Kolhapur Forge & Fabrication",
  "Thane Facility Management Co",
  "Nagpur Gem Registered Vendor",
  "Ratnagiri Fisheries Export",
  "Amravati Stationery Mart",
  "Latur Irrigation Systems",
  "Satara Renewable Energy Parts",
  "Dhule Uniform Suppliers",
  "Yavatmal Farm Equipment",
];

const CATEGORIES = [
  "IT Equipment",
  "Office Supplies",
  "Construction",
  "Engineering",
  "Medical",
  "Logistics",
  "Electrical",
  "Packaging",
  "Services",
  "Safety",
  "Automotive",
  "Chemicals",
  "Agro Inputs",
  "Facility Management",
  "Energy",
];

const MATERIAL_GROUPS = [
  "Hardware",
  "Consumables",
  "Civil",
  "MRO",
  "Pharma",
  "Freight",
  "Cables",
  "Corrugated",
  "AMC",
  "PPE",
  "Spares",
  "Industrial",
  "Seeds",
  "Housekeeping",
  "Solar",
];

const DEPARTMENTS = ["Procurement", "IT", "Stores", "Projects", "Admin", "Quality", "Finance"];

const STATUSES = ["Approved", "Approved", "Approved", "Under Review", "Approved", "Blacklisted"];

function ratingFromScore(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Average";
  if (score >= 65) return "Needs Improvement";
  return "Needs Improvement";
}

function padCode(n) {
  return `VND-${String(n).padStart(3, "0")}`;
}

function monthTrend(baseScore, i) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = 2025;
  return months.map((m, idx) => ({
    month: `${m} ${year}`,
    score: Math.min(98, Math.max(65, Math.round(baseScore - 4 + idx * 0.6 + (i % 3) - 1))),
  }));
}

function buildVendor(index) {
  const n = index + 1;
  const code = padCode(n);
  const currentScore = 65 + ((n * 17 + n * n) % 34);
  const qualityScore = Math.min(98, currentScore + ((n % 5) - 2));
  const deliveryScore = Math.min(98, currentScore + ((n % 4) - 1));
  const commercialScore = Math.min(98, currentScore - (n % 3));
  const complianceScore = Math.min(98, currentScore + (n % 2));
  const status = n === 24 ? "Blacklisted" : STATUSES[n % STATUSES.length];
  const overallRating = status === "Blacklisted" ? "Blacklisted" : ratingFromScore(currentScore);
  const category = CATEGORIES[n % CATEGORIES.length];
  const materialGroup = MATERIAL_GROUPS[n % MATERIAL_GROUPS.length];

  const breakdown = [
    { key: "commercial", label: "Commercial", score: commercialScore, weight: 15 },
    { key: "quality", label: "Quality", score: qualityScore, weight: 20 },
    { key: "delivery", label: "Delivery", score: deliveryScore, weight: 20 },
    { key: "compliance", label: "Compliance", score: complianceScore, weight: 15 },
    { key: "documentation", label: "Documentation", score: Math.min(98, complianceScore - 2), weight: 8 },
    { key: "responsiveness", label: "Responsiveness", score: Math.min(98, deliveryScore + 1), weight: 7 },
    { key: "gemCompliance", label: "GeM Compliance", score: Math.min(98, complianceScore + (n % 3)), weight: 8 },
    { key: "priceCompetitiveness", label: "Price Competitiveness", score: commercialScore, weight: 7 },
  ];

  return {
    id: code,
    vendorCode: code,
    vendorName: VENDOR_NAMES[index].trim(),
    category,
    materialGroup,
    department: DEPARTMENTS[n % DEPARTMENTS.length],
    currentScore,
    qualityScore,
    deliveryScore,
    commercialScore,
    complianceScore,
    overallRating,
    status,
    lastEvaluationDate: `2025-${String(10 - (n % 6)).padStart(2, "0")}-${String(5 + (n % 20)).padStart(2, "0")}`,
    nextReview: `2026-${String(4 + (n % 6)).padStart(2, "0")}-${String(1 + (n % 28)).padStart(2, "0")}`,
    reviewedBy: n % 3 === 0 ? "Chief Procurement Officer" : "Vendor Evaluation Committee",
    scoreBreakdown: breakdown,
    radar: {
      commercial: commercialScore,
      quality: qualityScore,
      delivery: deliveryScore,
      compliance: complianceScore,
      cost: Math.min(98, commercialScore + 2),
      service: Math.min(98, deliveryScore + 3),
    },
    trend: monthTrend(currentScore, n),
    purchaseSummary: {
      purchaseOrders: 12 + (n % 40),
      orderValue: 850000 + n * 125000,
      deliveries: 10 + (n % 35),
      delayedDeliveries: n % 7,
      rejectedDeliveries: n % 3,
      averageLeadTimeDays: 8 + (n % 12),
      paymentDays: 30 + (n % 15),
    },
    qualitySummary: {
      acceptedPct: Math.min(99, 88 + (n % 10)),
      rejectedPct: Math.max(1, 12 - (n % 10)),
      reworkPct: n % 5,
      inspectionScore: qualityScore,
    },
    risks: [
      { key: "financial", label: "Financial Risk", level: n % 5 === 0 ? "High" : n % 3 === 0 ? "Medium" : "Low" },
      { key: "compliance", label: "Compliance Risk", level: complianceScore < 75 ? "Medium" : "Low" },
      { key: "performance", label: "Performance Risk", level: deliveryScore < 78 ? "Medium" : "Low" },
      { key: "supply", label: "Supply Risk", level: n % 4 === 0 ? "Medium" : "Low" },
    ],
    strengths: [
      n % 2 === 0 ? "Consistent on-time delivery for critical materials" : "Competitive pricing on bulk orders",
      "Maintains complete GST and MSME documentation",
      qualityScore >= 88 ? "Low rejection rate on incoming inspection" : "Responsive to PO amendments",
    ],
    improvements: [
      deliveryScore < 85 ? "Reduce delayed deliveries on project POs" : "Improve quotation turnaround time",
      n % 3 === 0 ? "Update expired ISO certificates" : "Standardize delivery challan format",
    ],
    recommendations: [
      currentScore >= 90 ? "Increase business allocation for preferred categories" : "Continue monitoring for next evaluation cycle",
      complianceScore >= 85 ? "Continue as preferred vendor for GeM purchases" : "Request updated compliance documents within 30 days",
      deliveryScore < 82 ? "Review delivery commitments and SLA adherence" : "Maintain current quality standards for next 3 months",
      qualityScore >= 88 ? "Eligible for long-term rate contract consideration" : "Monitor quality metrics for next 3 months",
    ],
    history: [
      {
        id: `${code}-H3`,
        date: `2025-10-${String(5 + (n % 10)).padStart(2, "0")}`,
        score: currentScore,
        rating: overallRating,
        reviewer: "Vendor Evaluation Committee",
        note: "Periodic performance review completed",
      },
      {
        id: `${code}-H2`,
        date: `2025-04-${String(10 + (n % 15)).padStart(2, "0")}`,
        score: Math.max(65, currentScore - 3),
        rating: ratingFromScore(Math.max(65, currentScore - 3)),
        reviewer: "Procurement Head",
        note: "Mid-year score adjustment after delivery review",
      },
      {
        id: `${code}-H1`,
        date: `2024-10-${String(8 + (n % 12)).padStart(2, "0")}`,
        score: Math.max(65, currentScore - 6),
        rating: ratingFromScore(Math.max(65, currentScore - 6)),
        reviewer: "Vendor Evaluation Committee",
        note: "Annual vendor evaluation",
      },
    ],
  };
}

export const VENDOR_EVALUATION_SHOWCASE_VENDORS = VENDOR_NAMES.map((_, i) => buildVendor(i));

export function getShowcaseDashboardStats() {
  const vendors = VENDOR_EVALUATION_SHOWCASE_VENDORS;
  const approved = vendors.filter((v) => v.status === "Approved").length;
  const excellent = vendors.filter((v) => v.overallRating === "Excellent").length;
  const average = vendors.filter((v) => v.overallRating === "Average" || v.overallRating === "Needs Improvement").length;
  const poor = vendors.filter((v) => v.overallRating === "Needs Improvement" || v.status === "Blacklisted").length;
  const underReview = vendors.filter((v) => v.status === "Under Review").length;
  const avgScore = Math.round(vendors.reduce((s, v) => s + v.currentScore, 0) / vendors.length);
  const top = [...vendors].sort((a, b) => b.currentScore - a.currentScore)[0];
  return {
    totalVendors: vendors.length,
    approvedVendors: approved,
    excellentVendors: excellent,
    averageVendors: average,
    poorVendors: poor,
    underReview,
    averageScore: avgScore,
    highestRatedVendor: top ? { code: top.vendorCode, name: top.vendorName, score: top.currentScore } : null,
    ratingDistribution: [
      { name: "Excellent", value: vendors.filter((v) => v.overallRating === "Excellent").length },
      { name: "Good", value: vendors.filter((v) => v.overallRating === "Good").length },
      { name: "Average", value: vendors.filter((v) => v.overallRating === "Average").length },
      { name: "Needs Improvement", value: vendors.filter((v) => v.overallRating === "Needs Improvement").length },
      { name: "Blacklisted", value: vendors.filter((v) => v.status === "Blacklisted").length },
    ],
    topVendors: [...vendors].sort((a, b) => b.currentScore - a.currentScore).slice(0, 5),
  };
}

export function findShowcaseVendor(code) {
  return VENDOR_EVALUATION_SHOWCASE_VENDORS.find(
    (v) => v.vendorCode === code || v.id === code
  );
}

export function filterShowcaseVendors(query = {}) {
  let rows = [...VENDOR_EVALUATION_SHOWCASE_VENDORS];
  const q = String(query.q || query.vendor || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(q) ||
        v.vendorCode.toLowerCase().includes(q)
    );
  }
  if (query.category) rows = rows.filter((v) => v.category === query.category);
  if (query.rating) rows = rows.filter((v) => v.overallRating === query.rating);
  if (query.status) rows = rows.filter((v) => v.status === query.status);
  if (query.materialGroup) rows = rows.filter((v) => v.materialGroup === query.materialGroup);
  if (query.department) rows = rows.filter((v) => v.department === query.department);
  return rows;
}
