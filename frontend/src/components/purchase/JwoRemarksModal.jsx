import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function JwoRemarksModal({ open, value = "", onClose, onSave }) {
  const [text, setText] = useState(value);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (open) setText(value || "");
  }, [open, value]);

  if (!open) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "42vw", minWidth: 420, maxWidth: 640 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">JWO Remarks / Instructions</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          <label className="sc-label">Enter JWO Remarks/Instructions</label>
          <textarea
            className="sc-input"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter JWO Remarks/Instructions"
            style={{ width: "100%", resize: "vertical", minHeight: "10rem" }}
          />
        </div>
        <div className="sc-modal-footer">
          <button type="button" className="sc-input" onClick={onClose} style={{ cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            className="sc-input"
            style={{
              background: "var(--brand-primary)",
              color: "#fff",
              borderColor: "var(--brand-primary)",
              cursor: "pointer",
            }}
            onClick={() => {
              onSave?.(text);
              onClose?.();
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
