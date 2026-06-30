import { FileText, Receipt, Truck } from "lucide-react";
import { computeImportLandedCost, formatFc } from "../../utils/importLandedCost.js";
import domesticStyles from "./PoDomesticOrderSidebar.module.css";
import styles from "./PoImportOrderSidebar.module.css";

const LANDED_FIELDS = [
  { key: "exchangeRate", label: "Exchange rate (→ INR)", foreignOnly: true },
  { key: "freight", label: "Freight (FC)" },
  { key: "insurance", label: "Insurance (FC)" },
  { key: "customsDuty", label: "Customs / duty (FC)" },
  { key: "clearingCharges", label: "Clearing (FC)" },
  { key: "portCharges", label: "Port charges (FC)" },
  { key: "otherCharges", label: "Other (FC)" },
];

export default function PoImportOrderSidebar({
  poNo,
  poDate,
  currency = "USD",
  lineCount = 0,
  linesWithQty = 0,
  lines = [],
  landedCost = {},
  onLandedCostChange,
  incidentalExpenses = [],
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
  const incidentalTotal = (incidentalExpenses || []).reduce(
    (s, r) => s + (Number(r.amount) || 0),
    0
  );
  const summary = computeImportLandedCost({
    lines,
    landedCost,
    currency,
    incidentalTotal,
  });

  return (
    <aside className={domesticStyles.sidebar}>
      <div className={domesticStyles.card}>
        <h2 className={domesticStyles.cardTitle}>Landed cost</h2>
        <p className={styles.hint}>
          Charges in {summary.currency}. Stored on this PO for GRN/invoice matching. Configure
          similar types under Data Management → Incidental Expenses.
        </p>
        <div className={styles.landedGrid}>
          {LANDED_FIELDS.map((f) => {
            if (f.foreignOnly && summary.currency === "INR") return null;
            return (
              <div key={f.key} className={styles.landedField}>
                <label htmlFor={`lc-${f.key}`}>{f.label}</label>
                <input
                  id={`lc-${f.key}`}
                  type="number"
                  min={0}
                  step="any"
                  value={landedCost[f.key] ?? ""}
                  onChange={(e) => onLandedCostChange?.(f.key, e.target.value)}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.landedTotal}>
          <span>Goods ({summary.currency})</span>
          <div>{formatFc(summary.goodsValueFc, summary.currency)}</div>
        </div>
        <div className={styles.landedTotal} style={{ marginTop: "0.45rem" }}>
          <span>Total landed (INR)</span>
          <strong>
            ₹{" "}
            {summary.totalLandedCostInr.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
      </div>

      <div className={domesticStyles.card}>
        <h2 className={domesticStyles.cardTitle}>Order summary</h2>
        <div className={domesticStyles.statGrid}>
          <div className={domesticStyles.statRow}>
            <span>PO number</span>
            <strong>{poNo || "—"}</strong>
          </div>
          <div className={domesticStyles.statRow}>
            <span>Lines with qty</span>
            <strong>
              {linesWithQty} / {lineCount}
            </strong>
          </div>
          <div className={`${domesticStyles.statRow} ${domesticStyles.statRowTotal}`}>
            <span>Est. total (INR)</span>
            <strong>
              ₹{" "}
              {summary.totalLandedCostInr.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
        <p className={domesticStyles.hint}>Import GST/customs on print as per company policy.</p>
      </div>

      <div className={domesticStyles.card}>
        <h2 className={domesticStyles.cardTitle}>Delivery & terms</h2>
        <div className={domesticStyles.quickActions}>
          <button type="button" className={domesticStyles.quickBtn} onClick={onOrderRef}>
            <span>Order reference</span>
            <Receipt size={16} />
          </button>
          <button
            type="button"
            className={`${domesticStyles.quickBtn} ${validationErrors.shipToLocation ? domesticStyles.quickBtnWarn : ""}`}
            onClick={onTerms}
          >
            <span>Ship-to & freight terms</span>
            <Truck size={16} />
          </button>
          <button type="button" className={domesticStyles.quickBtn} onClick={onIncidental}>
            <span>Incidental / other charges</span>
            <FileText size={16} />
          </button>
        </div>
      </div>

      <div className={domesticStyles.card}>
        <h2 className={domesticStyles.cardTitle}>Actions</h2>
        <div className={domesticStyles.ctaStack}>
          <button
            type="button"
            className={domesticStyles.btnSecondary}
            onClick={onPreviewToggle}
            disabled={saving || (!linesPreviewOnly && linesWithQty === 0)}
          >
            {linesPreviewOnly ? "Show all items" : "Review lines with qty"}
          </button>
          <button type="button" className={domesticStyles.btnSecondary} onClick={onReset} disabled={saving}>
            Reset
          </button>
          <button
            type="button"
            className={domesticStyles.btnPrimary}
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)" }}
            disabled={saving || editLoading || !hasClickedPreview}
            onClick={onSave}
          >
            {saving ? "Saving…" : isEditMode ? "Update import PO" : "Save import PO"}
          </button>
        </div>
      </div>
    </aside>
  );
}
