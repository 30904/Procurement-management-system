import { FileText, Receipt, Truck } from "lucide-react";
import styles from "./PoDomesticOrderSidebar.module.css";

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PoDomesticOrderSidebar({
  poNo,
  poDate,
  currency = "INR",
  lineCount = 0,
  linesWithQty = 0,
  poValue = {},
  shipToLabel = "",
  paymentTerms = "",
  validationErrors = {},
  saving = false,
  editLoading = false,
  hasClickedPreview = false,
  linesPreviewOnly = false,
  isEditMode = false,
  onIncidental,
  onTerms,
  onOrderRef,
  onPreviewToggle,
  onReset,
  onSave,
}) {
  const netGoods = Number(poValue.netGoodsValue ?? 0);
  const incidental = Number(poValue.totalIncidental ?? 0);
  const total = Number(poValue.totalPoValue ?? 0);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Order summary</h2>
        <div className={styles.statusPills}>
          <span className={styles.pill}>Draft</span>
          <span className={styles.pill} style={{ background: "#e0f2fe", color: "#0369a1" }}>
            GRN: Not started
          </span>
        </div>
        <div className={styles.statGrid}>
          <div className={styles.statRow}>
            <span>PO number</span>
            <strong>{poNo || "—"}</strong>
          </div>
          <div className={styles.statRow}>
            <span>PO date</span>
            <strong>{poDate || "—"}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Catalogue items</span>
            <strong>{lineCount}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Lines with qty</span>
            <strong>{linesWithQty}</strong>
          </div>
          <div className={styles.statRow}>
            <span>Goods value</span>
            <strong>
              {currency === "INR" ? "₹" : ""} {formatMoney(netGoods)}
            </strong>
          </div>
          {incidental > 0 ? (
            <div className={styles.statRow}>
              <span>Incidental</span>
              <strong>
                {currency === "INR" ? "₹" : ""} {formatMoney(incidental)}
              </strong>
            </div>
          ) : null}
          <div className={`${styles.statRow} ${styles.statRowTotal}`}>
            <span>Est. PO total</span>
            <strong>
              {currency === "INR" ? "₹" : ""} {formatMoney(total)}
            </strong>
          </div>
        </div>
        <p className={styles.hint}>GST breakdown appears on the printed PO (domestic compliance).</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Delivery & terms</h2>
        <div className={styles.quickActions}>
          <button type="button" className={styles.quickBtn} onClick={onOrderRef}>
            <span>Order reference</span>
            <Receipt size={16} />
          </button>
          <button
            type="button"
            className={`${styles.quickBtn} ${validationErrors.shipToLocation ? styles.quickBtnWarn : ""}`}
            onClick={onTerms}
          >
            <span>
              Ship-to & payment
              {shipToLabel ? ` · ${shipToLabel}` : ""}
            </span>
            <Truck size={16} />
          </button>
          <button type="button" className={styles.quickBtn} onClick={onIncidental}>
            <span>Incidental expenses</span>
            <FileText size={16} />
          </button>
        </div>
        {paymentTerms ? (
          <p className={styles.hint} style={{ marginTop: "0.65rem" }}>
            Payment: {paymentTerms}
          </p>
        ) : null}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Actions</h2>
        <div className={styles.ctaStack}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onPreviewToggle}
            disabled={saving || (!linesPreviewOnly && linesWithQty === 0)}
          >
            {linesPreviewOnly ? "Show all catalogue items" : "Review lines with qty"}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={onReset} disabled={saving}>
            Reset form
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={saving || editLoading || !hasClickedPreview}
            title={
              !hasClickedPreview
                ? 'Use "Review lines with qty" before saving'
                : undefined
            }
            onClick={onSave}
          >
            {saving ? "Saving…" : isEditMode ? "Update domestic PO" : "Save domestic PO"}
          </button>
        </div>
      </div>
    </aside>
  );
}
