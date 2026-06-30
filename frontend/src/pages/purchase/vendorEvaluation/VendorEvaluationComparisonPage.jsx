import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ErpBackButton from "../../../components/common/ErpBackButton.jsx";
import { ChartPanel } from "../../../components/dashboard/DashboardShell.jsx";
import { tooltipStyle } from "../../../components/dashboard/chartTheme.js";
import VendorEvaluationRatingBadge from "../../../components/vendorEvaluation/VendorEvaluationRatingBadge.jsx";
import { vendorEvaluationPaths } from "../../../config/vendorEvaluationPaths.js";
import {
  compareVendorEvaluationShowcaseRequest,
  listVendorEvaluationShowcaseRequest,
} from "../../../services/api.js";
import pageStyles from "../../../styles/page-toolbar.module.css";
import navStyles from "../../../components/vendorEvaluation/VendorEvaluation.module.css";

const RADAR_KEYS = ["commercial", "quality", "delivery", "compliance", "cost", "service"];

export default function VendorEvaluationComparisonPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(["", "", "", ""]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listVendorEvaluationShowcaseRequest().then((res) => setVendors(res?.data || [])).catch(() => setVendors([]));
  }, []);

  const selectedCodes = useMemo(() => selected.filter(Boolean), [selected]);

  const runCompare = async () => {
    if (selectedCodes.length < 2) return;
    setLoading(true);
    try {
      const res = await compareVendorEvaluationShowcaseRequest(selectedCodes);
      setResult(res?.data ?? null);
    } finally {
      setLoading(false);
    }
  };

  const radarData = useMemo(() => {
    if (!result?.vendors?.length) return [];
    return RADAR_KEYS.map((key) => {
      const row = { subject: key.charAt(0).toUpperCase() + key.slice(1) };
      result.vendors.forEach((v) => {
        row[v.vendorCode] = v.radar?.[key] ?? 0;
      });
      return row;
    });
  }, [result]);

  return (
    <div className={`erp-page ${pageStyles.page} ${navStyles.page}`}>
      <header className={pageStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(vendorEvaluationPaths.dashboard)} ariaLabel="Back" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">Vendor Comparison</span>
        </h1>
      </header>

      <section className={navStyles.panel}>
        <h3 className={navStyles.panelTitle}>Select 2 to 4 vendors</h3>
        <div className={navStyles.comparePick}>
          {selected.map((code, idx) => (
            <div key={idx} className={navStyles.filterField}>
              <label>Vendor {idx + 1}</label>
              <select
                value={code}
                onChange={(e) => {
                  const next = [...selected];
                  next[idx] = e.target.value;
                  setSelected(next);
                }}
              >
                <option value="">— Select —</option>
                {vendors.map((v) => (
                  <option key={v.vendorCode} value={v.vendorCode}>
                    {v.vendorCode} — {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button type="button" className="erp-btn erp-btn--primary" style={{ marginTop: "0.75rem" }} disabled={selectedCodes.length < 2 || loading} onClick={runCompare}>
          Compare Vendors
        </button>
      </section>

      {result?.winner ? (
        <>
          <div className={navStyles.compareWinner}>
            Recommended vendor: {result.winner.vendorName} ({result.winner.vendorCode}) — Score {result.winner.currentScore}
          </div>

          <section className={navStyles.panel}>
            <h3 className={navStyles.panelTitle}>Comparison Table</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {result.vendors.map((v) => (
                      <th key={v.vendorCode}>{v.vendorName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["currentScore", "qualityScore", "deliveryScore", "commercialScore", "complianceScore", "overallRating", "status"].map((key) => (
                    <tr key={key}>
                      <td>{key}</td>
                      {result.vendors.map((v) => (
                        <td key={`${v.vendorCode}-${key}`}>
                          {key === "overallRating" ? <VendorEvaluationRatingBadge rating={v.overallRating} /> : v[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ChartPanel title="Radar Comparison" hint="Multi-vendor dimensional comparison">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                {result.vendors.map((v, i) => (
                  <Radar
                    key={v.vendorCode}
                    name={v.vendorName}
                    dataKey={v.vendorCode}
                    stroke={["#197dfa", "#059669", "#d97706", "#7c3aed"][i]}
                    fill={["#197dfa", "#059669", "#d97706", "#7c3aed"][i]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <section className={navStyles.panel}>
            <h3 className={navStyles.panelTitle}>Ranking</h3>
            <div className={navStyles.grid4}>
              {(result.ranking || []).map((row) => (
                <div key={row.vendorCode} className={navStyles.statItem}>
                  <span className={navStyles.statLabel}>Rank {row.rank}</span>
                  <span className={navStyles.statValue}>{row.vendorName}</span>
                  <span className={navStyles.execMeta}>{row.score} · {row.rating}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
