import { useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalSearchBar from "../common/ModalSearchBar.jsx";
import InputField from "../subcomponents/InputField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import modalStyles from "./SupplierChildModal.module.css";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

const EMPTY_BANK = {
  befName: "",
  bankName: "",
  accountType: "",
  accountNumber: "",
  ifsCode: "",
  bankSwiftCode: "",
};

export default function SupplierBankDetailsModal({ open, rows = [], onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_BANK);
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  if (!open) return null;

  const filtered = items.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.bankName || "").toLowerCase().includes(q) ||
      String(r.accountNumber || "").toLowerCase().includes(q) ||
      String(r.bankSwiftCode || "").toLowerCase().includes(q)
    );
  });

  function patch(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addBank() {
    if (!form.befName.trim() || !form.bankName.trim() || !form.accountType.trim() || !form.accountNumber.trim() || !form.bankSwiftCode.trim()) {
      return;
    }
    setItems((prev) => [...prev, { ...form }]);
    setForm(EMPTY_BANK);
  }

  function removeBank(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "78vw", maxHeight: "88vh" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Supplier Bank Details</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ gap: "1.5vh" }}>
          <div className={`${modalStyles.addRow} ${modalStyles.addRowBank}`}>
            <InputField
              label="Beneficiary Name"
              required
              value={form.befName}
              onChange={(v) => patch("befName", v)}
              placeholder="As per bank records"
            />
            <InputField
              label="Bank Name"
              required
              value={form.bankName}
              onChange={(v) => patch("bankName", v)}
              placeholder="Enter bank name"
            />
            <InputField
              label="Account Type"
              required
              value={form.accountType}
              onChange={(v) => patch("accountType", v)}
              placeholder="Current / Savings"
            />
            <InputField
              label="Account No."
              required
              value={form.accountNumber}
              onChange={(v) => patch("accountNumber", v)}
              placeholder="Enter account number"
            />
            <InputField
              label="IFS Code"
              value={form.ifsCode}
              onChange={(v) => patch("ifsCode", v)}
              placeholder="IFSC / IFS code"
            />
            <InputField
              label="Swift Code"
              required
              value={form.bankSwiftCode}
              onChange={(v) => patch("bankSwiftCode", v)}
              placeholder="SWIFT / BIC"
            />
            <button type="button" className={modalStyles.btnAdd} onClick={addBank} aria-label="Add bank">
              +
            </button>
          </div>

          <p className={modalStyles.sectionLabel}>Bank Details List</p>

          <ModalSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search banks..."
            aria-label="Search bank details"
          />

          <table className="im-table im-table--master">
            <thead>
              <tr>
                <th>Bank Name</th>
                <th>Account Type</th>
                <th>Account No.</th>
                <th>IFS Code</th>
                <th>Swift Code</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>No bank details added</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.bankName}-${i}`}>
                    <td>{r.bankName}</td>
                    <td>{r.accountType}</td>
                    <td>{r.accountNumber}</td>
                    <td>{r.ifsCode || "—"}</td>
                    <td>{r.bankSwiftCode}</td>
                    <td style={{ textAlign: "center" }}>
                      <button type="button" className={modalStyles.btnRemove} onClick={() => removeBank(i)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sc-modal-footer">
          <button
            type="button"
            className={modalStyles.btnSaveClose}
            onClick={() => {
              onSave?.(items);
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

