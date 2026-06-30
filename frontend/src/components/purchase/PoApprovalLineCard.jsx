import { Calendar } from "lucide-react";
import {
  formatEqtSummary,
  formatPoLineDate,
  getEddSchedulesForDisplay,
  hasMultipleEddSchedules,
} from "../../utils/poLineDisplay.js";
import styles from "./PoApprovalReview.module.css";

function currencySymbol(code) {
  const c = String(code || "INR").toUpperCase();
  if (c === "INR") return "₹";
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return `${c} `;
}

function formatMoney(value, currency = "INR") {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${currencySymbol(currency)}${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PoApprovalLineCard({ line, currency = "INR" }) {
  const schedules = getEddSchedulesForDisplay(line.edd, line);
  const multiEdd = hasMultipleEddSchedules(line.edd, line);
  const eqtLabel = formatEqtSummary(line.eqt);
  const qty = line.qty != null && line.qty !== "" ? line.qty : "—";
  const rate = line.rate != null && line.rate !== "" ? formatMoney(line.rate, currency) : "—";

  return (
    <article className={styles.lineCard}>
      <div className={styles.lineCardTop}>
        <div className={styles.lineCardTitle}>
          <span className={styles.lineCode}>{line.itemNo || `Line ${line.lineNo}`}</span>
          <h4 className={styles.lineName}>{line.itemName || "—"}</h4>
          {line.description ? <p className={styles.lineDesc}>{line.description}</p> : null}
        </div>
        <div className={styles.lineAmtBlock}>
          <span className={styles.lineAmtLabel}>Line amount</span>
          <span className={styles.lineAmt}>{formatMoney(line.amount, currency)}</span>
        </div>
      </div>

      <div className={styles.lineMetaRow}>
        <span className={styles.lineMetaPill}>UoM: {line.uom || "—"}</span>
        {line.hsnCode ? <span className={styles.lineMetaPill}>HSN: {line.hsnCode}</span> : null}
        {line.gstRate != null && line.gstRate !== "" ? (
          <span className={styles.lineMetaPill}>GST: {line.gstRate}%</span>
        ) : null}
        {line.tag ? <span className={styles.lineMetaPill}>Tag: {line.tag}</span> : null}
        {line.vbp ? <span className={styles.lineMetaPill}>VBP: {line.vbp}</span> : null}
      </div>

      <div className={styles.lineMetrics}>
        <div className={styles.lineMetric}>
          <span className={styles.lineMetricLabel}>Quantity</span>
          <span className={styles.lineMetricValue}>
            {qty} {line.uom || ""}
          </span>
        </div>
        <div className={styles.lineMetric}>
          <span className={styles.lineMetricLabel}>Rate / unit</span>
          <span className={styles.lineMetricValue}>{rate}</span>
        </div>
        <div className={styles.lineMetric}>
          <span className={styles.lineMetricLabel}>Received</span>
          <span className={styles.lineMetricValue}>{line.receivedQty ?? 0}</span>
        </div>
        <div className={styles.lineMetric}>
          <span className={styles.lineMetricLabel}>Balance</span>
          <span className={styles.lineMetricValue}>{line.balanceQty ?? "—"}</span>
        </div>
      </div>

      {schedules.length > 0 ? (
        <div className={styles.lineEddSection}>
          <div className={styles.lineEddHeader}>
            <Calendar size={15} aria-hidden />
            <span>
              {multiEdd
                ? `Delivery schedule (${schedules.length})`
                : "Expected delivery"}
            </span>
          </div>
          {multiEdd ? (
            <div className={styles.lineEddTableWrap}>
              <table className={styles.lineEddTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Qty</th>
                    <th>UoM</th>
                    <th>Delivery date</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((row) => (
                    <tr key={row.scheduleNo}>
                      <td>{row.scheduleNo}</td>
                      <td className={styles.num}>{row.qty}</td>
                      <td>{row.uom}</td>
                      <td>{formatPoLineDate(row.deliveryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.lineEddSingle}>
              {formatPoLineDate(schedules[0].deliveryDate)}
              {schedules[0].qty !== "—" ? (
                <span className={styles.lineEddQtyHint}>
                  {" "}
                  · {schedules[0].qty} {schedules[0].uom}
                </span>
              ) : null}
            </p>
          )}
        </div>
      ) : null}

      {eqtLabel ? (
        <p className={styles.lineEqt}>
          <span className={styles.lineEqtLabel}>Equipment tag</span>
          {eqtLabel}
        </p>
      ) : null}
    </article>
  );
}
