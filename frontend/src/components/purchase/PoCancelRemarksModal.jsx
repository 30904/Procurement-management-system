import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import styles from "../modals/ItemInventoryLevelsModal.module.css";

export default function PoCancelRemarksModal({
  open,
  poNo,
  onClose,
  onConfirm,
  submitting = false,
  title = "Cancel Purchase Order",
  confirmLabel = "Cancel PO",
  notStartedNote = "GRN has not started on this PO.",
}) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) setRemarks("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = remarks.trim();
    if (!trimmed) return;
    onConfirm?.(trimmed);
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && !submitting && onClose?.()}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "min(92vw, 480px)", maxWidth: "480px" }}
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">{title}</span>
          <button
            type="button"
            className="sc-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body">
          <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.9rem" }}>
            Cancel <strong>{poNo}</strong>? This cannot be undone. {notStartedNote}
          </p>
          <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", color: "#334155" }}>
            Cancellation remarks <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            className={styles.inlInput}
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter reason for cancellation…"
            disabled={submitting}
            style={{ resize: "vertical", minHeight: "5rem" }}
          />
        </div>
        <div className={styles.inlFooter}>
          <button
            type="button"
            className={styles.inlBtnGhost}
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.inlBtnPrimary}
            onClick={handleSubmit}
            disabled={submitting || !remarks.trim()}
            style={{ background: "#dc2626" }}
          >
            {submitting ? "Cancelling…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
