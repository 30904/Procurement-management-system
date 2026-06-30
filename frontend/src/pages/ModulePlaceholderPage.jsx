import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MODULE_COPY } from "../config/navigation.js";
import { useHubReturn } from "../utils/hubNavigation.js";
import styles from "./ModulePlaceholderPage.module.css";

function defaultHubReturnForPath(routeKey) {
  if (routeKey.startsWith("masters/planning/")) return "masters/planning";
  if (routeKey.startsWith("masters/purchase/")) return "masters/purchase";
  if (routeKey.startsWith("masters/sales/")) return "masters/sales";
  if (routeKey.startsWith("masters/stores/")) return "masters/stores";
  if (routeKey.startsWith("masters/production/")) return "masters/production";
  if (routeKey.startsWith("masters/")) return "masters";
  return "dashboard";
}

export default function ModulePlaceholderPage() {
  const { pathname } = useLocation();

  const { title, description, defaultHubReturn } = useMemo(() => {
    const key = pathname.replace(/^\/app\/?/, "").replace(/\/$/, "") || "dashboard";
    const genericMatch = key.match(/^menu-(\d+)\/module-(\d+)$/);
    if (genericMatch) {
      const menuNum = genericMatch[1];
      const moduleNum = genericMatch[2];
      return {
        title: `Module ${moduleNum}`,
        description: `Placeholder screen for Menu ${menuNum}, Module ${moduleNum}.`,
        defaultHubReturn: defaultHubReturnForPath(key),
      };
    }
    const copy = MODULE_COPY[key] || {
      title: "Module",
      description: "This section is ready for the next implementation phase.",
    };
    return { ...copy, defaultHubReturn: defaultHubReturnForPath(key) };
  }, [pathname]);

  const { goBack, hubReturnLabel } = useHubReturn(defaultHubReturn);

  return (
    <div className={`erp-page ${styles.wrap}`}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.back}
          onClick={goBack}
        >
          <span className={styles.backArrow} aria-hidden>
            ←
          </span>
          <span>Back to {hubReturnLabel}</span>
        </button>
      </div>

      <header className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.desc}>{description}</p>
      </header>

      <div className={styles.reportArea}>
        <div className={styles.card}>
          <p className={styles.hint}>
            Use the sidebar to explore other framework modules. Data and actions for
            this screen will be wired in upcoming releases.
          </p>
        </div>
      </div>
    </div>
  );
}
