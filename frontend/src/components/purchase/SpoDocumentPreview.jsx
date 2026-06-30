import styles from "./SpoDocumentPreview.module.css";

function formatMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "0.00";
  return x.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export default function SpoDocumentPreview({ spo }) {
  if (!spo) return null;
  const spoValue = spo.spoValue && typeof spo.spoValue === "object" ? spo.spoValue : {};
  const total = Number(spoValue.totalSpoValue ?? spo.totalAmount ?? 0);
  const lines = Array.isArray(spo.lines) ? spo.lines : [];

  return (
    <div className={styles.wrap}>
      <div className={styles.headerGrid}>
        <div>
          <span className={styles.label}>SPO No.</span>
          <strong>{spo.spoNo}</strong>
        </div>
        <div>
          <span className={styles.label}>SPO Date</span>
          <strong>{formatDate(spo.spoDate)}</strong>
        </div>
        <div>
          <span className={styles.label}>Category</span>
          <strong>{spo.serviceCategory || "—"}</strong>
        </div>
        <div>
          <span className={styles.label}>Service Provider</span>
          <strong>{spo.serviceProviderName || "—"}</strong>
        </div>
        <div>
          <span className={styles.label}>Currency</span>
          <strong>{spo.currency || "INR"}</strong>
        </div>
        <div>
          <span className={styles.label}>Validity</span>
          <strong>{formatDate(spo.spoValidity)}</strong>
        </div>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SN</th>
              <th>Service No.</th>
              <th>SAC</th>
              <th>Description</th>
              <th>GST%</th>
              <th>Qty</th>
              <th>Net Rate</th>
              <th>Line Value</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  No lines
                </td>
              </tr>
            ) : (
              lines.map((row, i) => (
                <tr key={row.lineNo ?? i}>
                  <td>{i + 1}</td>
                  <td>{row.serviceNo || "—"}</td>
                  <td>{row.sacCode}</td>
                  <td>{row.description}</td>
                  <td>{Number(row.gstRate || 0).toFixed(2)}</td>
                  <td>{row.qty}</td>
                  <td className={styles.num}>{formatMoney(row.netRate)}</td>
                  <td className={styles.num}>{formatMoney(row.lineValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div>
          <span className={styles.label}>Payment Terms</span> {spo.paymentTerms || "—"}
        </div>
        <div>
          <span className={styles.label}>Remarks</span> {spo.spoRemarks || "—"}
        </div>
        <div className={styles.total}>
          Total SPO Value: {spo.currency || "INR"} {formatMoney(total)}
        </div>
      </div>
    </div>
  );
}
