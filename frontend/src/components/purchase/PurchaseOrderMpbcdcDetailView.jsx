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

function hasValue(val) {
  return val !== null && val !== undefined && String(val).trim() !== "";
}

export default function PurchaseOrderMpbcdcDetailView({ po }) {
  if (!po) return null;

  const proc = po.procurementReference || {};
  const gov = po.governmentProcurement || {};
  const cap = po.capitalProcurement || {};
  const tracking = po.approvalTracking || {};
  const indentNos = (po.sourceIndentNos || []).filter(Boolean).join(", ");

  const hasProc =
    indentNos ||
    hasValue(proc.procurementCategory) ||
    hasValue(proc.purchaseType) ||
    hasValue(proc.sourceListLabel) ||
    hasValue(proc.sourceListCode) ||
    hasValue(proc.vendorEvaluationLabel) ||
    hasValue(proc.vendorEvaluationCode) ||
    hasValue(proc.rateContractReference) ||
    hasValue(proc.contractReference) ||
    hasValue(proc.budgetReference);

  const hasGov =
    hasValue(gov.gemPurchase) ||
    hasValue(gov.tenderPurchase) ||
    hasValue(gov.emergencyProcurement) ||
    hasValue(gov.boardApprovalRequired) ||
    hasValue(gov.tenderNumber) ||
    hasValue(gov.gemBidNumber) ||
    hasValue(gov.governmentApprovalNumber) ||
    hasValue(gov.governmentReference);

  const hasCap =
    hasValue(cap.assetProcurement) ||
    hasValue(cap.assetName) ||
    hasValue(cap.assetCode) ||
    hasValue(cap.capitalizationRequired) ||
    hasValue(cap.capitalBudgetCode);

  const hasTracking =
    hasValue(tracking.approvalStatus) ||
    hasValue(tracking.approvalAuthority) ||
    hasValue(tracking.approvalDate) ||
    hasValue(tracking.approvalRemarks);

  if (!hasProc && !hasGov && !hasCap && !hasTracking) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {hasProc ? (
        <Section title="Procurement Reference" subtitle="Requisition and contract references">
          {indentNos ? <Field label="Purchase Requisition" value={indentNos} /> : null}
          {hasValue(proc.procurementCategory) ? (
            <Field label="Procurement Category" value={proc.procurementCategory} />
          ) : null}
          {hasValue(proc.purchaseType) ? <Field label="Purchase Type" value={proc.purchaseType} /> : null}
          {hasValue(proc.sourceListLabel || proc.sourceListCode) ? (
            <Field label="Source List Reference" value={proc.sourceListLabel || proc.sourceListCode} />
          ) : null}
          {hasValue(proc.vendorEvaluationLabel || proc.vendorEvaluationCode) ? (
            <Field
              label="Vendor Evaluation Reference"
              value={proc.vendorEvaluationLabel || proc.vendorEvaluationCode}
            />
          ) : null}
          {hasValue(proc.rateContractReference) ? (
            <Field label="Rate Contract Reference" value={proc.rateContractReference} />
          ) : null}
          {hasValue(proc.contractReference) ? (
            <Field label="Contract Reference" value={proc.contractReference} />
          ) : null}
          {hasValue(proc.budgetReference) ? (
            <Field label="Budget Reference" value={proc.budgetReference} />
          ) : null}
        </Section>
      ) : null}

      {hasGov ? (
        <Section title="Government Procurement" subtitle="GeM and tender details">
          {hasValue(gov.gemPurchase) ? <Field label="GeM Purchase" value={gov.gemPurchase} /> : null}
          {hasValue(gov.tenderPurchase) ? <Field label="Tender Purchase" value={gov.tenderPurchase} /> : null}
          {hasValue(gov.emergencyProcurement) ? (
            <Field label="Emergency Procurement" value={gov.emergencyProcurement} />
          ) : null}
          {hasValue(gov.boardApprovalRequired) ? (
            <Field label="Board Approval Required" value={gov.boardApprovalRequired} />
          ) : null}
          {hasValue(gov.tenderNumber) ? <Field label="Tender Number" value={gov.tenderNumber} /> : null}
          {hasValue(gov.gemBidNumber) ? <Field label="GeM Bid Number" value={gov.gemBidNumber} /> : null}
          {hasValue(gov.governmentApprovalNumber) ? (
            <Field label="Government Approval Number" value={gov.governmentApprovalNumber} />
          ) : null}
          {hasValue(gov.governmentReference) ? (
            <Field label="Government Reference" value={gov.governmentReference} />
          ) : null}
        </Section>
      ) : null}

      {hasCap ? (
        <Section title="Capital Procurement" subtitle="Asset and capitalization">
          {hasValue(cap.assetProcurement) ? (
            <Field label="Asset Procurement" value={cap.assetProcurement} />
          ) : null}
          {hasValue(cap.assetName || cap.assetCode) ? (
            <Field label="Asset Reference" value={cap.assetName || cap.assetCode} />
          ) : null}
          {hasValue(cap.capitalizationRequired) ? (
            <Field label="Capitalization Required" value={cap.capitalizationRequired} />
          ) : null}
          {hasValue(cap.capitalBudgetCode) ? (
            <Field label="Capital Budget Code" value={cap.capitalBudgetCode} />
          ) : null}
        </Section>
      ) : null}

      {hasTracking ? (
        <Section title="Approval Information" subtitle="Procurement approval tracking">
          {hasValue(tracking.approvalStatus) ? (
            <Field label="Approval Status" value={tracking.approvalStatus} />
          ) : null}
          {hasValue(tracking.approvalAuthority) ? (
            <Field label="Approval Authority" value={tracking.approvalAuthority} />
          ) : null}
          {hasValue(tracking.approvalDate) ? (
            <Field label="Approval Date" value={formatDate(tracking.approvalDate)} />
          ) : null}
          {hasValue(tracking.approvalRemarks) ? (
            <Field label="Approval Remarks" value={tracking.approvalRemarks} />
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
