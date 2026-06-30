import { NavLink } from "react-router-dom";
import styles from "./VendorEvaluation.module.css";

export default function VendorEvaluationSubNav({ vendorCode, active }) {
  if (!vendorCode) return null;
  const base = `/app/purchase/vendor-evaluation/${encodeURIComponent(vendorCode)}`;
  const items = [
    { key: "detail", label: "Overview", to: base },
    { key: "trend", label: "Performance Trend", to: `${base}/trend` },
    { key: "history", label: "Evaluation History", to: `${base}/history` },
    { key: "scorecard", label: "Scorecard", to: `${base}/scorecard` },
  ];
  return (
    <nav className={styles.subNav} aria-label="Vendor evaluation sections">
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          className={({ isActive }) =>
            `${styles.subNavLink} ${isActive || active === item.key ? styles.subNavLinkActive : ""}`
          }
          end={item.key === "detail"}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
