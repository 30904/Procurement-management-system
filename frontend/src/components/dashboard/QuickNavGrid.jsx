import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import MenuLucideIcon from "../common/MenuLucideIcon.jsx";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";
import { appPath } from "../../config/navigation.js";
import styles from "./QuickNavGrid.module.css";

function resolveNavPath(item) {
  if (item.route) return item.route;
  if (item.segment) return appPath(item.segment);
  const match = String(item.code || "").match(/^menu_(\d+)$/);
  if (match) return appPath(`menu-${match[1]}`);
  return appPath("dashboard");
}

export default function QuickNavGrid() {
  const navigate = useNavigate();
  const { navigation } = usePermissions();

  const allNav = [...(navigation?.main || []), ...(navigation?.bottom || [])];
  const items = allNav.filter(
    (n) => n.code !== "dashboard" && n.permission?.enabled !== false
  );

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h3 className={styles.title}>Quick Navigation</h3>
        <span className={styles.badge}>{items.length} modules</span>
      </div>
      <div className={styles.grid}>
        {items.map((item) => {
          return (
            <button
              key={item.code}
              type="button"
              className={styles.card}
              onClick={() => navigate(resolveNavPath(item))}
            >
              <div className={styles.cardIcon}>
                {item.iconUrl ? (
                  <img src={resolveMenuIconUrl(item.iconUrl)} alt="" className={styles.img} />
                ) : (
                  <MenuLucideIcon iconKey={item.iconKey} className={styles.img} />
                )}
              </div>
              <span className={styles.cardLabel}>{item.label}</span>
              <svg
                viewBox="0 0 24 24"
                className={styles.arrow}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>
    </section>
  );
}
