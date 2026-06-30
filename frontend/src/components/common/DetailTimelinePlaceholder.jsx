import detailStyles from "../../pages/purchase/PurchaseOrderDetailPage.module.css";

/** Placeholder until workflow timeline is implemented. */
export default function DetailTimelinePlaceholder() {
  return (
    <section className={detailStyles.card}>
      <h2 className={detailStyles.sectionTitle}>Timeline</h2>
      <p className={detailStyles.remarks} style={{ margin: 0 }}>
        Document workflow timeline will appear here when approval workflow is configured.
      </p>
    </section>
  );
}
