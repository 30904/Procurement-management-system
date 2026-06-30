import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import modalStyles from "./SupplierChildModal.module.css";
import "../../styles/subcomponents.css";

const EMPTY = {
  customerNameLegalEntity: "",
  plantNameLocation: "",
  plantCodeId: "",
  customerNameOnTaxInvoice: "",
  customerNickName: "",
};

export default function CustomerPlantDetailsModal({ open, initial, onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  useEffect(() => {
    if (!open) return;
    setForm({
      customerNameLegalEntity: initial?.customerNameLegalEntity ?? "",
      plantNameLocation: initial?.plantNameLocation ?? "",
      plantCodeId: initial?.plantCodeId ?? "",
      customerNameOnTaxInvoice: initial?.customerNameOnTaxInvoice ?? "",
      customerNickName: initial?.customerNickName ?? "",
    });
  }, [open, initial]);

  if (!open) return null;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function handleSave() {
    if (!form.customerNameLegalEntity.trim()) {
      toast.error("Customer Name (Legal Entity) is required.");
      return;
    }
    if (!form.customerNameOnTaxInvoice.trim()) {
      toast.error("Customer Name on Tax Invoice is required.");
      return;
    }
    if (!form.customerNickName.trim()) {
      toast.error("Customer Nick/Short Name is required.");
      return;
    }
    onSave?.({
      customerNameLegalEntity: form.customerNameLegalEntity.trim(),
      plantNameLocation: form.plantNameLocation.trim(),
      plantCodeId: form.plantCodeId.trim(),
      customerNameOnTaxInvoice: form.customerNameOnTaxInvoice.trim(),
      customerNickName: form.customerNickName.trim(),
    });
    onClose?.();
  }

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{
          ...modalStyle,
          width: "min(92vw, 520px)",
          minWidth: "320px",
          maxWidth: "520px",
          maxHeight: "85vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-plant-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="customer-plant-title" className="sc-modal-title">
            Customer Name &amp; Plant Details
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ padding: "2.2vh 1.5vw 1.6vh", gap: "1.5vh" }}>
          <div className="sc-field-grid sc-field-grid--1col">
            <InputField
              label="Customer Name (Legal Entity)"
              required
              value={form.customerNameLegalEntity}
              onChange={(v) => set("customerNameLegalEntity", v)}
              placeholder="Enter legal entity name"
            />
            <InputField
              label="Plant Name/Location/Division"
              value={form.plantNameLocation}
              onChange={(v) => set("plantNameLocation", v)}
              placeholder="Plant or division"
            />
            <InputField
              label="Plant Code/Plant ID"
              value={form.plantCodeId}
              onChange={(v) => set("plantCodeId", v)}
              placeholder="Plant code"
            />
            <InputField
              label="Customer Name on Tax Invoice"
              required
              value={form.customerNameOnTaxInvoice}
              onChange={(v) => set("customerNameOnTaxInvoice", v)}
              placeholder="Name on tax invoice"
            />
            <InputField
              label="Customer Nick/Short Name"
              required
              value={form.customerNickName}
              onChange={(v) => set("customerNickName", v)}
              placeholder="Short display name"
            />
          </div>
        </div>

        <div className="sc-modal-footer" style={{ justifyContent: "center" }}>
          <button type="button" className={modalStyles.btnSaveClose} onClick={handleSave}>
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
