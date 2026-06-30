import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { sortRmSpecLines } from "../../utils/rmSpecificationLines.js";
import styles from "./RmSpecificationInspectionChecklistModal.module.css";
import previewStyles from "./RmSpecificationPreviewModal.module.css";

export default function RmSpecificationPreviewModal({
  open,
  item,
  inspectionStandard,
  lines = [],
  checklistRows = [],
  onClose,
}) {
  if (!open) return null;

  const sortedLines = sortRmSpecLines(lines);
  const selectedChecklist = (checklistRows || []).filter((r) => r.selected);

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={`${styles.modal} ${previewStyles.modalWide}`}
        role="dialog"
        aria-labelledby="rm-preview-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="rm-preview-title" className={styles.title}>
            RM Specification — Preview
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>

        <div className={previewStyles.meta}>
          <div>
            <span className={previewStyles.metaLabel}>Material Code</span>
            <span>{item?.itemNo || "—"}</span>
          </div>
          <div>
            <span className={previewStyles.metaLabel}>Material Name</span>
            <span>{item?.itemName || "—"}</span>
          </div>
          <div>
            <span className={previewStyles.metaLabel}>Inspection Standard</span>
            <span>{inspectionStandard || "—"}</span>
          </div>
        </div>

        {sortedLines.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Seq.</th>
                  <th>Inspection/Test Parameter</th>
                  <th>UoM</th>
                  <th>Inspection Standard</th>
                  <th>Inspection Method</th>
                  <th>Spec Value</th>
                  <th>LTL</th>
                  <th>UTL</th>
                </tr>
              </thead>
              <tbody>
                {sortedLines.map((line) => (
                  <tr key={`${line.specId}-${line.sequence}`}>
                    <td>{line.sequence}</td>
                    <td>{line.inspectionParameter}</td>
                    <td>{line.uom}</td>
                    <td>{line.testStandard || "—"}</td>
                    <td>{line.testMethod}</td>
                    <td>{line.specValue || "—"}</td>
                    <td>{line.ltl || "—"}</td>
                    <td>{line.utl || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {selectedChecklist.length > 0 ? (
          <div className={previewStyles.checklistBlock}>
            <h3 className={previewStyles.sectionTitle}>Inspection Checklist</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Seq.</th>
                  <th>Inspection Parameter</th>
                </tr>
              </thead>
              <tbody>
                {selectedChecklist
                  .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
                  .map((row) => (
                    <tr key={row.inspectionChecklistId || row.checklistId}>
                      <td>{row.sequence}</td>
                      <td>{row.checklistItem}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <footer className={styles.footer}>
          <div className={styles.footerRight}>
            <button type="button" className={styles.btnSavePink} onClick={onClose}>
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
