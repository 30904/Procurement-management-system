import styles from "./PoDocumentPreview.module.css";

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function PoDocumentPreview({ po }) {
  if (!po) return null;
  const poTerms = po.poTerms || {};
  const lines = (po.lines || []).filter((l) => Number(l.qty) > 0);

  return (
    <div className={styles.preview}>
      <div className={styles.docHeader}>
        <h2 className={styles.docTitle}>Purchase Order</h2>
        <div className={styles.docMeta}>
          <span>
            <strong>PO No:</strong> {po.poNo}
          </span>
          <span>
            <strong>Date:</strong> {formatDate(po.poDate)}
          </span>
          <span>
            <strong>Supplier:</strong> {po.supplierName}
          </span>
        </div>
      </div>

      {poTerms.openingLineHtml ? (
        <div
          className={styles.termsHtml}
          dangerouslySetInnerHTML={{ __html: poTerms.openingLineHtml }}
        />
      ) : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>HSN</th>
            <th>UoM</th>
            <th className={styles.num}>Qty</th>
            <th className={styles.num}>Rate</th>
            <th className={styles.num}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.lineNo}>
              <td>{line.lineNo}</td>
              <td>
                {line.itemNo} — {line.itemName}
              </td>
              <td>{line.hsnCode || "—"}</td>
              <td>{line.uom}</td>
              <td className={styles.num}>{line.qty}</td>
              <td className={styles.num}>{formatMoney(line.rate)}</td>
              <td className={styles.num}>{formatMoney(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {poTerms.termsBodyHtml ? (
        <div
          className={styles.termsHtml}
          dangerouslySetInnerHTML={{ __html: poTerms.termsBodyHtml }}
        />
      ) : null}
    </div>
  );
}
