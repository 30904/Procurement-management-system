import { useEffect, useState } from "react";
import { getDashboardStatsRequest } from "../../services/api.js";
import styles from "./QuickStats.module.css";

const STAT_CONFIG = [
  {
    key: "activeUsers",
    label: "Active Users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: "var(--brand-primary)",
  },
  {
    key: "totalRoles",
    label: "Roles",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    color: "#00aaaa",
  },
  {
    key: "sidebarMenus",
    label: "Sidebar Menus",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    color: "#7c3aed",
  },
  {
    key: "moduleCards",
    label: "Module Cards",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    color: "#e07b00",
  },
];

export default function QuickStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStatsRequest()
      .then((res) => setStats(res?.data || null))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className={styles.grid}>
      {STAT_CONFIG.map((cfg) => {
        const value = stats?.[cfg.key] ?? "—";
        return (
          <article key={cfg.key} className={styles.card}>
            <div
              className={styles.iconCircle}
              style={{ backgroundColor: `${cfg.color}14`, color: cfg.color }}
            >
              {cfg.icon}
            </div>
            <div className={styles.content}>
              <p className={styles.value}>{value}</p>
              <p className={styles.label}>{cfg.label}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
