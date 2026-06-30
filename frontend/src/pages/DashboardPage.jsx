import { useEffect, useState } from "react";
import { resolveDashboardRequest } from "../services/api.js";
import { DEFAULT_DASHBOARD_KEY, DASHBOARD_BY_KEY } from "../config/dashboardCatalog.js";
import { TEMPORARY_FORCE_PURCHASE_DASHBOARD } from "../config/dashboardTemporary.js";
import PurchaseDashboard from "../components/dashboard/variants/PurchaseDashboard.jsx";
import DefaultWorkspaceDashboard from "../components/dashboard/variants/DefaultWorkspaceDashboard.jsx";
import styles from "../components/dashboard/DashboardShell.module.css";

const VARIANTS = {
  purchase: PurchaseDashboard,
  default: DefaultWorkspaceDashboard,
};

export default function DashboardPage() {
  const [dashboardKey, setDashboardKey] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await resolveDashboardRequest();
        if (cancelled) return;
        let key = res?.data?.dashboardKey || DEFAULT_DASHBOARD_KEY;
        if (TEMPORARY_FORCE_PURCHASE_DASHBOARD) {
          key = "purchase";
        } else if (key !== "purchase" && key !== "default") {
          key = DEFAULT_DASHBOARD_KEY;
        }
        setDashboardKey(key);
        setMeta(
          TEMPORARY_FORCE_PURCHASE_DASHBOARD
            ? DASHBOARD_BY_KEY.purchase || { key: "purchase", label: "Purchase Dashboard" }
            : res?.data?.dashboard || null
        );
      } catch {
        if (!cancelled) {
          setDashboardKey(DEFAULT_DASHBOARD_KEY);
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={`erp-page ${styles.page}`}>
        <div className={styles.loadingWrap}>Loading your dashboard...</div>
      </div>
    );
  }

  const key = dashboardKey || DEFAULT_DASHBOARD_KEY;
  const View = VARIANTS[key] || DefaultWorkspaceDashboard;
  return <View meta={meta} />;
}
