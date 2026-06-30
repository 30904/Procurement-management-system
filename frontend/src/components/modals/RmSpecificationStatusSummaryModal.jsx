import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";

export default function RmSpecificationStatusSummaryModal({ open, summary, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  if (!open) return null;

  const rows = [
    { label: "Active items", value: summary?.total ?? 0 },
    { label: "With RM specification", value: summary?.withRmSpecification ?? 0 },
    { label: "Without RM specification", value: summary?.withoutRmSpecification ?? 0 },
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
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Status Summary</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ padding: "1.25rem" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {rows.map((row) => (
              <li
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  fontSize: "0.95rem",
                }}
              >
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="sc-modal-footer" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="erp-btn erp-btn--primary"
            style={{ padding: "0.5rem 1.25rem" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
