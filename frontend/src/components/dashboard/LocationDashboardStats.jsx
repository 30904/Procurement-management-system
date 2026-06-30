import { useEffect, useState } from "react";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { getDashboardLocationStatsRequest } from "../../services/api.js";
import styles from "./LocationDashboardStats.module.css";

export default function LocationDashboardStats() {
  const { activeLocation, activeLocationId } = useLocationScope();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeLocationId) {
      setStats(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDashboardLocationStatsRequest(activeLocationId)
      .then((res) => {
        if (!cancelled) setStats(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeLocationId]);

  const label = activeLocation?.name || activeLocation?.locationId || "—";

  return (
    <section className={styles.wrap} aria-label="Location dashboard">
      <header className={styles.header}>
        <span className={styles.label}>Current location</span>
        <strong className={styles.locationName}>{label}</strong>
      </header>
      {loading ? (
        <p className={styles.muted}>Loading location metrics…</p>
      ) : stats ? (
        <div className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.value}>{stats.purchaseOrders ?? 0}</p>
            <p className={styles.caption}>Purchase orders</p>
          </article>
          <article className={styles.card}>
            <p className={styles.value}>{stats.goodsReceipts ?? 0}</p>
            <p className={styles.caption}>Goods receipts</p>
          </article>
          <article className={styles.card}>
            <p className={styles.value}>{stats.inventoryQtyOnHand ?? 0}</p>
            <p className={styles.caption}>Qty on hand (sum)</p>
          </article>
          <article className={styles.card}>
            <p className={styles.value}>{stats.inventoryLineCount ?? 0}</p>
            <p className={styles.caption}>Stock balance lines</p>
          </article>
        </div>
      ) : (
        <p className={styles.muted}>Select a working location to see purchase and inventory totals.</p>
      )}
    </section>
  );
}
