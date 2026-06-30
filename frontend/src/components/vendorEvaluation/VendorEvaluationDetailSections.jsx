import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPanel } from "../dashboard/DashboardShell.jsx";
import { tooltipStyle } from "../dashboard/chartTheme.js";
import VendorEvaluationRatingBadge, {
  VendorEvaluationGauge,
  VendorEvaluationRiskBadge,
} from "./VendorEvaluationRatingBadge.jsx";
import { formatInr } from "../../utils/vendorEvaluationRating.js";
import styles from "./VendorEvaluation.module.css";

function ScoreBreakdown({ items = [] }) {
  return (
    <div className={styles.scoreRow}>
      {items.map((item) => (
        <div key={item.key}>
          <div className={styles.scoreItemHead}>
            <span>{item.label}</span>
            <span>
              {item.score} · Wt {item.weight}%
            </span>
          </div>
          <div className={styles.scoreBar}>
            <div className={styles.scoreBarFill} style={{ width: `${item.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VendorEvaluationDetailSections({ vendor, showTrendChart = true }) {
  if (!vendor) return null;
  const radarData = Object.entries(vendor.radar || {}).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    score: value,
  }));

  return (
    <>
      <section className={styles.grid4}>
        <article className={styles.panel} style={{ gridColumn: "span 1" }}>
          <h3 className={styles.panelTitle}>Overall Score</h3>
          <VendorEvaluationGauge score={vendor.currentScore} />
          <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <VendorEvaluationRatingBadge rating={vendor.overallRating} />
          </p>
        </article>
        <article className={styles.panel} style={{ gridColumn: "span 3" }}>
          <h3 className={styles.panelTitle}>Score Breakdown</h3>
          <ScoreBreakdown items={vendor.scoreBreakdown} />
        </article>
      </section>

      <section className={styles.grid2}>
        <ChartPanel title="Performance Radar" hint="Multi-dimensional vendor score profile">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar dataKey="score" stroke="#197dfa" fill="#197dfa" fillOpacity={0.35} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
        {showTrendChart ? (
          <ChartPanel title="Performance Trend" hint="Monthly evaluation scores (12 months)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={vendor.trend || []}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} angle={-25} textAnchor="end" height={50} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="score" stroke="#197dfa" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}
      </section>

      <section className={styles.grid2}>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Purchase Summary</h3>
          <div className={styles.statGrid}>
            <div className={styles.statItem}><span className={styles.statLabel}>Purchase Orders</span><span className={styles.statValue}>{vendor.purchaseSummary?.purchaseOrders}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Order Value</span><span className={styles.statValue}>{formatInr(vendor.purchaseSummary?.orderValue)}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Deliveries</span><span className={styles.statValue}>{vendor.purchaseSummary?.deliveries}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Delayed Deliveries</span><span className={styles.statValue}>{vendor.purchaseSummary?.delayedDeliveries}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Rejected Deliveries</span><span className={styles.statValue}>{vendor.purchaseSummary?.rejectedDeliveries}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Avg Lead Time (days)</span><span className={styles.statValue}>{vendor.purchaseSummary?.averageLeadTimeDays}</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Payment Days</span><span className={styles.statValue}>{vendor.purchaseSummary?.paymentDays}</span></div>
          </div>
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Quality Summary</h3>
          <div className={styles.statGrid}>
            <div className={styles.statItem}><span className={styles.statLabel}>Accepted %</span><span className={styles.statValue}>{vendor.qualitySummary?.acceptedPct}%</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Rejected %</span><span className={styles.statValue}>{vendor.qualitySummary?.rejectedPct}%</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Rework %</span><span className={styles.statValue}>{vendor.qualitySummary?.reworkPct}%</span></div>
            <div className={styles.statItem}><span className={styles.statLabel}>Inspection Score</span><span className={styles.statValue}>{vendor.qualitySummary?.inspectionScore}</span></div>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Risk Indicators</h3>
        <div className={styles.navRow}>
          {(vendor.risks || []).map((risk) => (
            <span key={risk.key} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              {risk.label}: <VendorEvaluationRiskBadge level={risk.level} />
            </span>
          ))}
        </div>
      </section>

      <section className={styles.grid3}>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Strengths</h3>
          <ul className={styles.bulletList}>
            {(vendor.strengths || []).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Improvement Areas</h3>
          <ul className={styles.bulletList}>
            {(vendor.improvements || []).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Recommendations</h3>
          <ul className={styles.bulletList}>
            {(vendor.recommendations || []).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

export function VendorEvaluationExecutiveHeader({ vendor }) {
  if (!vendor) return null;
  return (
    <header className={styles.execHeader}>
      <div>
        <h2 className={styles.execTitle}>{vendor.vendorName}</h2>
        <p className={styles.execMeta}>
          {vendor.vendorCode} · {vendor.category} · {vendor.materialGroup} · Reviewed by {vendor.reviewedBy} on{" "}
          {vendor.lastEvaluationDate}
        </p>
      </div>
      <div className={styles.execRight}>
        <VendorEvaluationRatingBadge rating={vendor.overallRating} status={vendor.status} />
        <strong style={{ fontSize: "1.5rem", color: "#0f172a" }}>{vendor.currentScore} / 100</strong>
      </div>
    </header>
  );
}
