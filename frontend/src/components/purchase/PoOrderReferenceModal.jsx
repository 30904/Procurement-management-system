import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function PoOrderReferenceModal({ open, value, onClose, onSave }) {
  const [local, setLocal] = useState({ orderReferenceNo: "", orderReferenceDate: "" });
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setLocal({
      orderReferenceNo: value?.orderReferenceNo ?? "",
      orderReferenceDate: value?.orderReferenceDate ?? "",
    });
  }, [open, value]);

  if (!open) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "36vw", minWidth: 420, maxWidth: 520 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Order Reference</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
          <InputField
            label="Order Reference No."
            value={local.orderReferenceNo}
            onChange={(v) => setLocal((p) => ({ ...p, orderReferenceNo: v }))}
          />
          <DateField
            label="Order Reference Date"
            type="date"
            value={local.orderReferenceDate}
            onChange={(v) => setLocal((p) => ({ ...p, orderReferenceDate: v }))}
          />
        </div>
        <ModalFooterActions onCancel={onClose} onSave={() => onSave?.(local)} />
      </div>
    </div>,
    document.body
  );
}
