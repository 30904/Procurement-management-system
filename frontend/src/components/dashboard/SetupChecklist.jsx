import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { getDashboardStatsRequest } from "../../services/api.js";
import { appPath } from "../../config/navigation.js";
import styles from "./SetupChecklist.module.css";

function buildChecklist(stats, isSuperAdmin) {
  if (!stats) return [];

  const items = [
    {
      id: "company",
      label: "Company profile configured",
      done: true,
      path: "configuration/company-setup",
      superOnly: true,
    },
    {
      id: "menus",
      label: "Sidebar menus configured",
      done: (stats.sidebarMenus || 0) > 2,
      detail: `${stats.sidebarMenus || 0} menus`,
      path: "configuration/menu-setup",
      superOnly: true,
    },
    {
      id: "modules",
      label: "Module cards added",
      done: (stats.moduleCards || 0) > 0,
      detail: `${stats.moduleCards || 0} cards`,
      path: "configuration/menu-setup",
      superOnly: true,
    },
    {
      id: "roles",
      label: "Roles created",
      done: (stats.totalRoles || 0) > 1,
      detail: `${stats.totalRoles || 0} roles`,
      path: "configuration/roles-access",
      superOnly: true,
    },
    {
      id: "users",
      label: "Users added",
      done: (stats.totalUsers || 0) > 1,
      detail: `${stats.totalUsers || 0} users`,
      path: "configuration/roles-access/user-management",
      superOnly: true,
    },
  ];

  return isSuperAdmin ? items : items.filter((i) => !i.superOnly);
}

export default function SetupChecklist() {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStatsRequest()
      .then((res) => setStats(res?.data || null))
      .catch(() => {});
  }, []);

  const items = buildChecklist(stats, isSuperAdmin);
  if (!items.length) return null;

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;
  const progress = Math.round((doneCount / items.length) * 100);

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>
            {allDone ? "Setup Complete" : "Setup Checklist"}
          </h3>
          <p className={styles.sub}>
            {allDone
              ? "Your framework is fully configured and ready to use."
              : "Complete these steps to get your framework up and running."}
          </p>
        </div>
        <div className={styles.progressWrap}>
          <span className={styles.progressLabel}>{progress}%</span>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <ul className={styles.list}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${item.done ? styles.done : ""}`}
            onClick={() => !item.done && navigate(appPath(item.path))}
            role={item.done ? undefined : "button"}
            tabIndex={item.done ? undefined : 0}
          >
            <span className={styles.check}>
              {item.done ? (
                <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
                  <circle cx="12" cy="12" r="10" fill="#00aaaa" />
                  <path
                    d="M8 12l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className={styles.checkIcon}>
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </span>
            <div className={styles.itemBody}>
              <span className={styles.itemLabel}>{item.label}</span>
              {item.detail && (
                <span className={styles.itemDetail}>{item.detail}</span>
              )}
            </div>
            {!item.done && (
              <svg
                viewBox="0 0 24 24"
                className={styles.goArrow}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
