import { Calendar, Package, Plus, Search, Tag, TrendingUp } from "lucide-react";
import { hasLineQtyEntered } from "../../utils/purchaseOrderValidation.js";
import { computeLineBalance, lineAmount } from "../../utils/purchaseOrderFormState.js";
import styles from "./PoDomesticLineEditor.module.css";

function currencySymbol(code) {
  const c = String(code || "INR").toUpperCase();
  if (c === "INR") return "₹";
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return `${c} `;
}

function formatMoney(n, currency = "INR") {
  return `${currencySymbol(currency)}${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatEddDisplay(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export default function PoDomesticLineEditor({
  lines = [],
  lineQuery = "",
  onLineQueryChange,
  linesLoading = false,
  supplierSelected = false,
  linesPreviewOnly = false,
  onViewModeChange,
  isBlanketPo = false,
  validationErrors = {},
  onUpdateLine,
  onOpenTag,
  onOpenEdd,
  onOpenEqt,
  onOpenRateTrend,
  currency = "INR",
}) {
  const lineErrors = validationErrors.lineByKey || {};

  return (
    <section className={styles.wrap} aria-label="Order lines">
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search className={styles.searchIcon} size={18} aria-hidden />
          <input
            type="search"
            placeholder="Search material code, name, or description…"
            value={lineQuery}
            onChange={(e) => onLineQueryChange?.(e.target.value)}
            disabled={!supplierSelected}
          />
        </div>
        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.chip} ${!linesPreviewOnly ? styles.chipActive : ""}`}
            onClick={() => onViewModeChange?.(false)}
          >
            All items
          </button>
          <button
            type="button"
            className={`${styles.chip} ${linesPreviewOnly ? styles.chipActive : ""}`}
            onClick={() => onViewModeChange?.(true)}
          >
            With quantity only
          </button>
        </div>
        <span className={styles.count}>
          {lines.length} item{lines.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.list}>
        {linesLoading ? (
          <div className={styles.empty}>Loading items linked to supplier…</div>
        ) : !supplierSelected ? (
          <div className={styles.empty}>
            <Package size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.4 }} />
            Select a domestic supplier above to load their item catalogue.
          </div>
        ) : lines.length === 0 ? (
          <div className={styles.empty}>
            {linesPreviewOnly
              ? "No lines with quantity yet. Enter qty on items below (switch to “All items”)."
              : "No materials are linked to this supplier."}
          </div>
        ) : (
          lines.map((row) => {
            const hasQty = hasLineQtyEntered(row);
            const rowErr = lineErrors[row.key] || {};
            const amount = lineAmount(row);
            return (
              <article
                key={row.key}
                className={`${styles.card} ${hasQty ? styles.cardHasQty : ""} ${
                  Object.keys(rowErr).length ? styles.cardError : ""
                }`}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>
                    <span className={styles.itemCode}>{row.itemNo}</span>
                    <h3 className={styles.itemName}>{row.itemName}</h3>
                    {row.description ? (
                      <p className={styles.itemDesc}>{row.description}</p>
                    ) : null}
                  </div>
                  <div className={styles.lineValueBadge}>
                    <span className={styles.lineValueLabel}>Line value</span>
                    <span className={styles.lineValueAmount}>{formatMoney(amount, currency)}</span>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <span className={styles.metaPill}>UoM: {row.uom || "—"}</span>
                  {row.hsnCode ? <span className={styles.metaPill}>HSN: {row.hsnCode}</span> : null}
                  {row.gstRate != null && row.gstRate !== "" ? (
                    <span className={styles.metaPill}>GST: {row.gstRate}%</span>
                  ) : null}
                  {row.tag ? <span className={styles.metaPill}>Tag: {row.tag}</span> : null}
                  {row.vbp ? <span className={styles.metaPill}>VBP: {row.vbp}</span> : null}
                </div>

                <div className={styles.inputsGrid}>
                  <div className={styles.field}>
                    <label htmlFor={`qty-${row.key}`}>Order qty *</label>
                    <input
                      id={`qty-${row.key}`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={row.qty}
                      onChange={(e) => onUpdateLine?.(row.key, { qty: e.target.value })}
                    />
                    {rowErr.qty ? <div className={styles.fieldError}>{rowErr.qty}</div> : null}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor={`rate-${row.key}`}>Rate / unit *</label>
                    <input
                      id={`rate-${row.key}`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={row.rate}
                      onChange={(e) => onUpdateLine?.(row.key, { rate: e.target.value })}
                    />
                    {rowErr.rate ? <div className={styles.fieldError}>{rowErr.rate}</div> : null}
                  </div>
                  <div className={styles.field}>
                    <label>Balance (info)</label>
                    <input
                      type="text"
                      readOnly
                      value={computeLineBalance(row.qty, row.receivedQty, row.cancelledQty)}
                      style={{ background: "#f8fafc", fontWeight: 500 }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Delivery (EDD)</label>
                    <input
                      type="text"
                      readOnly
                      placeholder={isBlanketPo ? "N/A — Blanket PO" : "Not set"}
                      value={row.edd ? formatEddDisplay(row.edd) : ""}
                      style={{ background: "#f8fafc" }}
                    />
                    {rowErr.edd ? <div className={styles.fieldError}>{rowErr.edd}</div> : null}
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${row.tag ? styles.actionBtnActive : ""}`}
                    onClick={() => onOpenTag?.(row.key)}
                  >
                    <Tag size={14} /> Material tag
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${row.edd ? styles.actionBtnActive : ""}`}
                    disabled={isBlanketPo}
                    onClick={() => !isBlanketPo && onOpenEdd?.(row.key)}
                  >
                    <Calendar size={14} />
                    {row.edd ? formatEddDisplay(row.edd) : "Set delivery date"}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${row.eqt ? styles.actionBtnActive : ""}`}
                    onClick={() => onOpenEqt?.(row.key)}
                  >
                    <Plus size={14} /> Equipment tag
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onOpenRateTrend?.(row.key)}
                  >
                    <TrendingUp size={14} /> Rate history
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {validationErrors.linesGeneral ? (
        <div className={styles.tableError}>{validationErrors.linesGeneral}</div>
      ) : null}
    </section>
  );
}
