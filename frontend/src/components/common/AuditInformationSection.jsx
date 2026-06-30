import { buildAuditInformationRows } from "../../utils/auditInfoHelpers.js";
import detailStyles from "../../pages/purchase/PurchaseOrderDetailPage.module.css";

/**
 * Read-only audit trail for procurement documents.
 * @param {{ document: Record<string, unknown>, documentType?: "indent" | "po" | "grn" | "rfq" }} props
 */
export default function AuditInformationSection({ document, documentType = "po" }) {
  const rows = buildAuditInformationRows(document, { documentType });
  if (!document) return null;

  return (
    <section className={detailStyles.card}>
      <h2 className={detailStyles.sectionTitle}>Audit Information</h2>
      <div className={detailStyles.fieldGrid}>
        {rows.map((row) => (
          <div key={row.label} className={detailStyles.field}>
            <span className={detailStyles.fieldLabel}>{row.label}</span>
            <span className={detailStyles.fieldValue}>{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
