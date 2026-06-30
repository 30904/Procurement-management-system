import styles from "./DashboardShell.module.css";

export function DashboardPageWrap({ children }) {
  return <div className={`erp-page ${styles.page}`}>{children}</div>;
}

export function DashboardStack({ children }) {
  return <div className={styles.stack}>{children}</div>;
}

export function DashboardHero({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  pills = [],
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        {eyebrow ? <p className={styles.heroEyebrow}>{eyebrow}</p> : null}
        <h1 className={styles.heroTitle}>
          {title}
          {titleAccent ? <span> {titleAccent}</span> : null}
        </h1>
        {subtitle ? <p className={styles.heroSub}>{subtitle}</p> : null}
      </div>
      {pills.length > 0 ? (
        <div className={styles.heroRight}>
          {pills.map((pill) => (
            <div key={pill.label} className={styles.pill}>
              <span className={styles.pillLabel}>{pill.label}</span>
              <span className={styles.pillValue}>{pill.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function KpiGrid({ children }) {
  return <div className={styles.kpiGrid}>{children}</div>;
}

export function KpiCard({ icon, iconBg, iconColor, value, label, delta, deltaUp }) {
  return (
    <article className={styles.kpiCard}>
      <div
        className={styles.kpiIcon}
        style={{
          backgroundColor: iconBg || "var(--brand-primary-10)",
          color: iconColor || "var(--brand-primary)",
        }}
      >
        {icon}
      </div>
      <div className={styles.kpiBody}>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiLabel}>{label}</p>
        {delta ? (
          <p className={`${styles.kpiDelta} ${deltaUp ? styles.kpiDeltaUp : styles.kpiDeltaDown}`}>
            {delta}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ChartPanel({ title, hint, children, className = "" }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
        {hint ? <p className={styles.panelHint}>{hint}</p> : null}
      </div>
      <div className={styles.chartBox}>{children}</div>
    </section>
  );
}

export function ChartRow({ children }) {
  return <div className={styles.chartRow}>{children}</div>;
}

export function BottomRow({ children }) {
  return <div className={styles.bottomRow}>{children}</div>;
}

export function ActivityPanel({ title, items }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h3 className={styles.panelTitle}>{title}</h3>
      </div>
      <ul className={styles.activityList}>
        {items.map((item) => (
          <li key={item.id} className={styles.activityItem}>
            <span className={styles.activityDot} style={item.dotColor ? { background: item.dotColor } : undefined} />
            <div>
              <p className={styles.activityText}>{item.text}</p>
              {item.meta ? <p className={styles.activityMeta}>{item.meta}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
