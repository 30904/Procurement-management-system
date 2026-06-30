import { supplyTypeLabel } from "../../utils/poGstCalculation.js";
import styles from "./PoGstSummary.module.css";

function fmt(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0.00";
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return "";
  return `${v}%`;
}

export default function PoGstSummary({ poValue, currency = "INR" }) {
  const summary = Array.isArray(poValue?.gstSummary) ? poValue.gstSummary : [];
  if (!summary.length && !poValue?.totalTaxable) return null;

  const supplyType = poValue?.supplyType || "intrastate";
  const isInterstate = supplyType === "interstate";

  const totals = summary.reduce(
    (acc, row) => ({
      taxable: acc.taxable + (Number(row.taxableAmt) || 0),
      igst: acc.igst + (Number(row.igstAmt) || 0),
      cgst: acc.cgst + (Number(row.cgstAmt) || 0),
      sgst: acc.sgst + (Number(row.sgstAmt) || 0),
      tax: acc.tax + (Number(row.totalTax) || 0),
    }),
    { taxable: 0, igst: 0, cgst: 0, sgst: 0, tax: 0 }
  );

  return (
    <section className={styles.wrap} aria-label="GST summary">
      <div className={styles.headerRow}>
        <h3 className={styles.title}>GST Summary</h3>
        <span className={styles.badge}>{supplyTypeLabel(supplyType)}</span>
      </div>
      {(poValue?.buyerGstin || poValue?.supplierGstin) && (
        <p className={styles.gstinNote}>
          {poValue.buyerGstin ? <>Buyer GSTIN: {poValue.buyerGstin}</> : null}
          {poValue.buyerGstin && poValue.supplierGstin ? " · " : null}
          {poValue.supplierGstin ? <>Supplier GSTIN: {poValue.supplierGstin}</> : null}
        </p>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>HSN/SAC</th>
              <th className={styles.num}>Taxable Amt.</th>
              {!isInterstate ? (
                <>
                  <th className={styles.num}>CGST %</th>
                  <th className={styles.num}>CGST Amt.</th>
                  <th className={styles.num}>SGST %</th>
                  <th className={styles.num}>SGST Amt.</th>
                </>
              ) : (
                <>
                  <th className={styles.num}>IGST %</th>
                  <th className={styles.num}>IGST Amt.</th>
                </>
              )}
              <th className={styles.num}>Total Tax</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={`${row.hsnCode}-${row.gstRate}`}>
                <td>{row.hsnCode}</td>
                <td className={styles.num}>{fmt(row.taxableAmt)}</td>
                {!isInterstate ? (
                  <>
                    <td className={styles.num}>{pct(row.cgstRate)}</td>
                    <td className={styles.num}>{fmt(row.cgstAmt)}</td>
                    <td className={styles.num}>{pct(row.sgstRate)}</td>
                    <td className={styles.num}>{fmt(row.sgstAmt)}</td>
                  </>
                ) : (
                  <>
                    <td className={styles.num}>{pct(row.igstRate)}</td>
                    <td className={styles.num}>{fmt(row.igstAmt)}</td>
                  </>
                )}
                <td className={styles.num}>{fmt(row.totalTax)}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td>
                <strong>Total &gt;&gt;</strong>
              </td>
              <td className={styles.num}>
                <strong>{fmt(poValue?.totalTaxable ?? totals.taxable)}</strong>
              </td>
              {!isInterstate ? (
                <>
                  <td />
                  <td className={styles.num}>
                    <strong>{fmt(poValue?.totalCgst ?? totals.cgst)}</strong>
                  </td>
                  <td />
                  <td className={styles.num}>
                    <strong>{fmt(poValue?.totalSgst ?? totals.sgst)}</strong>
                  </td>
                </>
              ) : (
                <>
                  <td />
                  <td className={styles.num}>
                    <strong>{fmt(poValue?.totalIgst ?? totals.igst)}</strong>
                  </td>
                </>
              )}
              <td className={styles.num}>
                <strong>{fmt(poValue?.totalTax ?? totals.tax)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.poSummary}>
        <h4 className={styles.subTitle}>PO Summary</h4>
        <dl className={styles.summaryGrid}>
          <div>
            <dt>Total Taxable Amt.</dt>
            <dd>
              {currency} {fmt(poValue?.totalTaxable)}
            </dd>
          </div>
          {isInterstate ? (
            <div>
              <dt>Total Input IGST</dt>
              <dd>
                {currency} {fmt(poValue?.totalIgst)}
              </dd>
            </div>
          ) : (
            <>
              <div>
                <dt>Total Input CGST</dt>
                <dd>
                  {currency} {fmt(poValue?.totalCgst)}
                </dd>
              </div>
              <div>
                <dt>Total Input SGST</dt>
                <dd>
                  {currency} {fmt(poValue?.totalSgst)}
                </dd>
              </div>
            </>
          )}
          <div>
            <dt>Round Off (+/-)</dt>
            <dd>{fmt(poValue?.roundOff)}</dd>
          </div>
          <div className={styles.grandTotal}>
            <dt>Total PO Amount</dt>
            <dd>
              {currency} {fmt(poValue?.totalPoValue)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
