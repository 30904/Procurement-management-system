import styles from "../../pages/purchase/PurchaseOrderPrintPage.module.css";

/**
 * Standard print footer — printed-on timestamp and page numbering via CSS counters.
 * @param {{ note?: string, showSignatures?: boolean, signatoryLabel?: string, companyName?: string }} props
 */
export default function ProcurementPrintFooter({
  note = "This is a system-generated document.",
  showSignatures = true,
  signatoryLabel = "Authorised Signatory",
  companyName = "",
}) {
  const printedOn = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {showSignatures ? (
        <div className={styles.signRow} style={{ marginTop: "1.25rem" }}>
          <div className={styles.block}>
            <div className={styles.blockTitle}>{companyName || "Organisation"}</div>
            <div className={styles.signArea} />
            <div className={styles.signLabel}>{signatoryLabel}</div>
          </div>
          <div className={styles.block}>
            <div className={styles.blockTitle}>Vendor / Supplier</div>
            <div className={styles.signArea} />
            <div className={styles.signLabel}>Authorised Signatory</div>
          </div>
        </div>
      ) : null}

      <div className={styles.sheetFill} aria-hidden="true" />

      <div className={styles.docClose}>
        <p className={styles.footerNote}>{note}</p>
        <p className={styles.printMeta}>
          Printed on: {printedOn}
          <span className={styles.pageNumber} />
        </p>
      </div>
    </>
  );
}
