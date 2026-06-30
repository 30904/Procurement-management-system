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

export default function GoodsReceiptMpbcdcDetailView({ grn }) {
  if (!grn) return null;

  const proc = grn.procurementReference || {};
  const receipt = grn.receiptInformation || {};
  const gov = grn.governmentProcurement || {};
  const cap = grn.capitalProcurement || {};
  const auth = grn.receivingAuthority || {};

  const hasProc =
    hasValue(proc.purchaseRequisitionNo) ||
    hasValue(proc.procurementCategory) ||
    hasValue(proc.purchaseType) ||
    hasValue(proc.sourceListLabel) ||
    hasValue(proc.sourceListCode) ||
    hasValue(proc.vendorEvaluationLabel) ||
    hasValue(proc.vendorEvaluationCode) ||
    hasValue(proc.contractReference) ||
    hasValue(proc.budgetReference);

  const hasReceipt =
    hasValue(receipt.receiptType) ||
    hasValue(receipt.receiptStatus) ||
    hasValue(receipt.inspectionRequired) ||
    hasValue(receipt.qcStatus) ||
    receipt.acceptedQuantity != null ||
    receipt.rejectedQuantity != null ||
    receipt.shortQuantity != null ||
    receipt.excessQuantity != null;

  const hasGov =
    hasValue(gov.gemProcurement) ||
    hasValue(gov.tenderProcurement) ||
    hasValue(gov.inspectionCertificateAvailable) ||
    hasValue(gov.governmentInspectionRequired) ||
    hasValue(gov.inspectionCertificateNumber) ||
    hasValue(gov.inspectionAgency) ||
    hasValue(gov.inspectionDate) ||
    hasValue(gov.governmentRemarks);

  const hasCap =
    hasValue(cap.assetCreationRequired) ||
    hasValue(cap.assetName) ||
    hasValue(cap.assetCode) ||
    hasValue(cap.capitalizationPending) ||
    hasValue(cap.assetTagNumber);

  const hasAuth =
    hasValue(auth.receivedByName) ||
    hasValue(auth.verifiedByName) ||
    hasValue(auth.verifiedDate) ||
    hasValue(auth.receivingRemarks);

  if (!hasProc && !hasReceipt && !hasGov && !hasCap && !hasAuth) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {hasProc ? (
        <Section title="Procurement Reference" subtitle="Requisition and contract references">
          {hasValue(proc.purchaseRequisitionNo) ? (
            <Field label="Purchase Requisition" value={proc.purchaseRequisitionNo} />
          ) : null}
          {hasValue(proc.procurementCategory) ? (
            <Field label="Procurement Category" value={proc.procurementCategory} />
          ) : null}
          {hasValue(proc.purchaseType) ? <Field label="Purchase Type" value={proc.purchaseType} /> : null}
          {hasValue(grn.poNo) ? <Field label="Purchase Order Reference" value={grn.poNo} /> : null}
          {hasValue(proc.sourceListLabel || proc.sourceListCode) ? (
            <Field label="Source List Reference" value={proc.sourceListLabel || proc.sourceListCode} />
          ) : null}
          {hasValue(proc.vendorEvaluationLabel || proc.vendorEvaluationCode) ? (
            <Field
              label="Vendor Evaluation Reference"
              value={proc.vendorEvaluationLabel || proc.vendorEvaluationCode}
            />
          ) : null}
          {hasValue(proc.contractReference) ? (
            <Field label="Contract Reference" value={proc.contractReference} />
          ) : null}
          {hasValue(proc.budgetReference) ? (
            <Field label="Budget Reference" value={proc.budgetReference} />
          ) : null}
        </Section>
      ) : null}

      {hasReceipt ? (
        <Section title="Receipt Information" subtitle="Inspection and quantity summary">
          {hasValue(receipt.receiptType) ? <Field label="Receipt Type" value={receipt.receiptType} /> : null}
          {hasValue(receipt.receiptStatus) ? (
            <Field label="Receipt Status" value={receipt.receiptStatus} />
          ) : null}
          {hasValue(receipt.inspectionRequired) ? (
            <Field label="Inspection Required" value={receipt.inspectionRequired} />
          ) : null}
          {hasValue(receipt.qcStatus) ? <Field label="QC Status" value={receipt.qcStatus} /> : null}
          {receipt.acceptedQuantity != null && receipt.acceptedQuantity !== "" ? (
            <Field label="Accepted Quantity" value={receipt.acceptedQuantity} />
          ) : null}
          {receipt.rejectedQuantity != null && receipt.rejectedQuantity !== "" ? (
            <Field label="Rejected Quantity" value={receipt.rejectedQuantity} />
          ) : null}
          {receipt.shortQuantity != null && receipt.shortQuantity !== "" ? (
            <Field label="Short Quantity" value={receipt.shortQuantity} />
          ) : null}
          {receipt.excessQuantity != null && receipt.excessQuantity !== "" ? (
            <Field label="Excess Quantity" value={receipt.excessQuantity} />
          ) : null}
        </Section>
      ) : null}

      {hasGov ? (
        <Section title="Government Procurement" subtitle="GeM, tender, and inspection details">
          {hasValue(gov.gemProcurement) ? <Field label="GeM Procurement" value={gov.gemProcurement} /> : null}
          {hasValue(gov.tenderProcurement) ? (
            <Field label="Tender Procurement" value={gov.tenderProcurement} />
          ) : null}
          {hasValue(gov.inspectionCertificateAvailable) ? (
            <Field label="Inspection Certificate Available" value={gov.inspectionCertificateAvailable} />
          ) : null}
          {hasValue(gov.governmentInspectionRequired) ? (
            <Field label="Government Inspection Required" value={gov.governmentInspectionRequired} />
          ) : null}
          {hasValue(gov.inspectionCertificateNumber) ? (
            <Field label="Inspection Certificate Number" value={gov.inspectionCertificateNumber} />
          ) : null}
          {hasValue(gov.inspectionAgency) ? (
            <Field label="Inspection Agency" value={gov.inspectionAgency} />
          ) : null}
          {hasValue(gov.inspectionDate) ? (
            <Field label="Inspection Date" value={formatDate(gov.inspectionDate)} />
          ) : null}
          {hasValue(gov.governmentRemarks) ? (
            <Field label="Government Remarks" value={gov.governmentRemarks} />
          ) : null}
        </Section>
      ) : null}

      {hasCap ? (
        <Section title="Capital Goods" subtitle="Asset creation and capitalization">
          {hasValue(cap.assetCreationRequired) ? (
            <Field label="Asset Creation Required" value={cap.assetCreationRequired} />
          ) : null}
          {hasValue(cap.assetName || cap.assetCode) ? (
            <Field label="Asset Reference" value={cap.assetName || cap.assetCode} />
          ) : null}
          {hasValue(cap.capitalizationPending) ? (
            <Field label="Capitalization Pending" value={cap.capitalizationPending} />
          ) : null}
          {hasValue(cap.assetTagNumber) ? (
            <Field label="Asset Tag Number" value={cap.assetTagNumber} />
          ) : null}
        </Section>
      ) : null}

      {hasAuth ? (
        <Section title="Receiving Authority" subtitle="Receipt verification details">
          {hasValue(auth.receivedByName) ? <Field label="Received By" value={auth.receivedByName} /> : null}
          {hasValue(auth.verifiedByName) ? <Field label="Verified By" value={auth.verifiedByName} /> : null}
          {hasValue(auth.verifiedDate) ? (
            <Field label="Verified Date" value={formatDate(auth.verifiedDate)} />
          ) : null}
          {hasValue(auth.receivingRemarks) ? (
            <Field label="Receiving Remarks" value={auth.receivingRemarks} />
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
