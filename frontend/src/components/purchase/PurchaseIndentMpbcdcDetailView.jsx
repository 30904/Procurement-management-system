import styles from "../../pages/purchase/PurchaseIndentForm.module.css";
import detailStyles from "../../pages/purchase/PurchaseOrderDetailPage.module.css";

function Field({ label, value }) {
  return (
    <div className={detailStyles.field}>
      <span className={detailStyles.fieldLabel}>{label}</span>
      <span className={detailStyles.fieldValue}>{value ?? "—"}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Section({ title, subtitle, children }) {
  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {subtitle ? <p className={styles.sectionSubtitle}>{subtitle}</p> : null}
        </div>
      </div>
      <div className={styles.sectionBody}>
        <div className={detailStyles.fieldGrid}>{children}</div>
      </div>
    </section>
  );
}

export default function PurchaseIndentMpbcdcDetailView({ indent }) {
  if (!indent) return null;

  const proc = indent.procurementInfo || {};
  const budget = indent.budgetInfo || {};
  const gov = indent.governanceInfo || {};
  const tracking = indent.approvalTracking || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Section title="Requisition Information" subtitle="Government procurement classification">
        <Field label="Requisition Type" value={proc.requisitionType} />
        <Field label="Procurement Category" value={proc.procurementCategory} />
        <Field label="Department" value={indent.department} />
        <Field label="Cost Center" value={proc.costCenter} />
      </Section>

      <Section title="Budget Information" subtitle="Funding and budget verification">
        <Field label="Budget Head" value={budget.budgetHead} />
        <Field label="Estimated Procurement Value" value={formatMoney(budget.estimatedProcurementValue)} />
        <Field label="Budget Available" value={budget.budgetAvailable} />
        <Field label="Funding Source" value={budget.fundingSource} />
        <Field label="Financial Year" value={budget.financialYear} />
        <Field label="Budget Reference" value={budget.budgetReference} />
        <Field label="Budget Remarks" value={budget.budgetRemarks} />
        <Field label="Budget Verification Status" value={budget.budgetVerificationStatus} />
      </Section>

      <Section title="Procurement Governance" subtitle="GeM, tender, and approval requirements">
        <Field label="GeM Applicable" value={gov.gemApplicable} />
        <Field label="Tender Required" value={gov.tenderRequired} />
        <Field label="Emergency Procurement" value={gov.emergencyProcurement} />
        <Field label="Board Approval Required" value={gov.boardApprovalRequired} />
        <Field label="Procurement Justification" value={gov.procurementJustification} />
        <Field label="Special Approval Notes" value={gov.specialApprovalNotes} />
      </Section>

      <Section title="Approval Tracking" subtitle="Internal review status">
        <Field label="Approval Status" value={tracking.approvalStatus} />
        <Field label="Approved By" value={tracking.approvedBy} />
        <Field label="Approval Date" value={formatDate(tracking.approvalDate)} />
        <Field label="Approval Remarks" value={tracking.approvalRemarks} />
      </Section>
    </div>
  );
}
