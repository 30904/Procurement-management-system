import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalSearchBar from "../common/ModalSearchBar.jsx";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { EMPTY_BANK } from "../../utils/logisticsFormState.js";
import modalStyles from "./SupplierChildModal.module.css";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

export default function LogisticsBankDetailsModal({ open, rows = [], onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_BANK);
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });
  const { options: accountTypeOptions, loading: accountTypeLoading } = useMasterDataOptions(
    MASTER_DATA_CATEGORY.ACCOUNT_TYPE
  );

  useEffect(() => {
    if (open) setItems(rows);
  }, [open, rows]);

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
    if (!form.befName.trim() || !form.bankName.trim() || !form.accountType.trim() || !form.accountNumber.trim()) return;
    setItems((prev) => [...prev, { ...form }]);
    setForm(EMPTY_BANK);
  }

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "78vw", maxHeight: "88vh" }} role="dialog" aria-modal="true">
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Logistics Bank Details</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.5vh" }}>
          <div className={`${modalStyles.addRow} ${modalStyles.addRowBank}`}>
            <InputField label="Beneficiary Name" required value={form.befName} onChange={(v) => patch("befName", v)} />
            <InputField label="Bank Name" required value={form.bankName} onChange={(v) => patch("bankName", v)} />
            <SelectField label="Account Type" required options={accountTypeOptions} value={form.accountType} onChange={(v) => patch("accountType", v)} disabled={accountTypeLoading} />
            <InputField label="Account No." required value={form.accountNumber} onChange={(v) => patch("accountNumber", v)} />
            <InputField label="IFS Code" value={form.ifsCode} onChange={(v) => patch("ifsCode", v)} />
            <InputField label="Swift Code" value={form.bankSwiftCode} onChange={(v) => patch("bankSwiftCode", v)} />
            <button type="button" className={modalStyles.btnAdd} onClick={addBank} aria-label="Add bank">+</button>
          </div>
          <p className={modalStyles.sectionLabel}>Bank Details List</p>
          <ModalSearchBar value={query} onChange={setQuery} placeholder="Search banks..." aria-label="Search bank details" />
          <table className="im-table im-table--master">
            <thead><tr><th>Bank Name</th><th>Account Type</th><th>Account No.</th><th>IFS Code</th><th>Swift Code</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>No bank details added</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.bankName}-${i}`}>
                    <td>{r.bankName}</td><td>{r.accountType}</td><td>{r.accountNumber}</td><td>{r.ifsCode || "—"}</td><td>{r.bankSwiftCode || "—"}</td>
                    <td style={{ textAlign: "center" }}><button type="button" className={modalStyles.btnRemove} onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="sc-modal-footer">
          <button type="button" className={modalStyles.btnSaveClose} onClick={() => { onSave?.(items); onClose?.(); }}>Save & Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
