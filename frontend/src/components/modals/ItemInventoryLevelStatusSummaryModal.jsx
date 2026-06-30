import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import styles from "./ItemInventoryLevelsModal.module.css";

export default function ItemInventoryLevelStatusSummaryModal({ open, summary, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  if (!open) return null;

  const rows = [
    { label: "Active Materials Count", value: summary?.activeItemsCount ?? 0 },
    { label: "Total Materials with SL data", value: summary?.withSlData ?? 0 },
    { label: "Total Materials without SL Data", value: summary?.withoutSlData ?? 0 },
  ];

  return createPortal(
    <div
      className="sc-modal-overlay"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "28rem", maxWidth: "95vw" }}
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">Status Summary</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body">
          <ul className={styles.summaryList}>
            {rows.map((row) => (
              <li key={row.label} className={styles.summaryRow}>
                <span className={styles.summaryArrow} aria-hidden>
                  →
                </span>
                <span className={styles.summaryLabel}>{row.label}</span>
                <strong className={styles.summaryValue}>{row.value}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.summaryFooter}>
          <button type="button" className={styles.inlBtnPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
