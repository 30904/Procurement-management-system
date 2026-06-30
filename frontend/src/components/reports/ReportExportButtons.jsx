import ExportExcelIcon from "../../assets/export-excel.svg?react";
import ExportPdfIcon from "../../assets/export-pdf.svg?react";
import styles from "../../pages/reports/PurchaseOrderReportPage.module.css";

/**
 * Excel + PDF export actions (equal icon size). Place below table, aligned right.
 */
export default function ReportExportButtons({
  onExcel,
  onPdf,
  exporting = false,
  pdfExporting = false,
  showPdf = true,
  iconSize = "default",
  className = "",
}) {
  const busy = exporting || pdfExporting;
  const iconClass =
    iconSize === "compact"
      ? `${styles.exportIcon} ${styles.exportIconCompact}`
      : styles.exportIcon;

  return (
    <div className={`${styles.exportGroup} ${className}`.trim()}>
      {showPdf && onPdf ? (
        <button
          type="button"
          className={styles.exportBtn}
          onClick={onPdf}
          disabled={busy}
          title="Download PDF"
          aria-label="Download PDF"
        >
          <ExportPdfIcon className={iconClass} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        className={styles.exportBtn}
        onClick={onExcel}
        disabled={busy || !onExcel}
        title="Download Excel"
        aria-label="Download Excel"
      >
        <ExportExcelIcon className={iconClass} aria-hidden />
      </button>
    </div>
  );
}
