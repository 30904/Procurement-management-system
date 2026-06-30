import styles from "./VendorEvaluation.module.css";

export default function VendorEvaluationRatingBadge({ rating, status }) {
  const label = rating || status || "—";
  const tone = String(label).toLowerCase().replace(/\s+/g, "-");
  return <span className={`${styles.badge} ${styles[`badge--${tone}`] || ""}`}>{label}</span>;
}

export function VendorEvaluationGauge({ score, size = "lg" }) {
  const n = Math.max(0, Math.min(100, Number(score) || 0));
  const tone =
    n >= 90 ? "excellent" : n >= 80 ? "good" : n >= 70 ? "average" : "poor";
  return (
    <div
      className={`${styles.gauge} ${styles[`gauge--${size}`]}`}
      style={{ "--gauge-score": n }}
      data-tone={tone}
      aria-label={`Overall score ${n} out of 100`}
    >
      <div className={styles.gaugeInner}>
        <strong>{n}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

export function VendorEvaluationRiskBadge({ level }) {
  const tone = String(level || "low").toLowerCase();
  return <span className={`${styles.riskBadge} ${styles[`risk--${tone}`]}`}>{level}</span>;
}
