import { useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalSearchBar from "../common/ModalSearchBar.jsx";
import InputField from "../subcomponents/InputField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import modalStyles from "./SupplierChildModal.module.css";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

const EMPTY_CONTACT = {
  name: "",
  department: "",
  designation: "",
  mobile: "",
  email: "",
};

export default function SupplierContactDetailsModal({ open, rows = [], onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  if (!open) return null;

  const filtered = items.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      String(r.name || "").toLowerCase().includes(q) ||
      String(r.email || "").toLowerCase().includes(q) ||
      String(r.mobile || "").toLowerCase().includes(q)
    );
  });

  function patch(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addContact() {
    if (!form.name.trim() || !form.designation.trim() || !form.mobile.trim() || !form.email.trim()) {
      return;
    }
    setItems((prev) => [...prev, { ...form }]);
    setForm(EMPTY_CONTACT);
  }

  function removeContact(index) {
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
          <span className="sc-modal-title">Supplier Contact Details</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ gap: "1.5vh" }}>
          <div className={modalStyles.addRow}>
            <InputField
              label="Contact Person's Name"
              required
              value={form.name}
              onChange={(v) => patch("name", v)}
              placeholder="Enter full name"
            />
            <InputField
              label="Department"
              value={form.department}
              onChange={(v) => patch("department", v)}
              placeholder="e.g. Purchase"
            />
            <InputField
              label="Designation"
              required
              value={form.designation}
              onChange={(v) => patch("designation", v)}
              placeholder="Enter designation"
            />
            <InputField
              label="Mobile No."
              required
              value={form.mobile}
              onChange={(v) => patch("mobile", v)}
              placeholder="Enter mobile number"
              inputMode="tel"
            />
            <InputField
              label="E-mail ID"
              required
              value={form.email}
              onChange={(v) => patch("email", v)}
              placeholder="name@company.com"
            />
            <button type="button" className={modalStyles.btnAdd} onClick={addContact} aria-label="Add contact">
              +
            </button>
          </div>

          <p className={modalStyles.sectionLabel}>Contact List</p>

          <ModalSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search contacts..."
            aria-label="Search contacts"
          />

          <table className="im-table im-table--master">
            <thead>
              <tr>
                <th>Contact Person's Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Mobile No.</th>
                <th>E-mail ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>No contacts added</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.email}-${i}`}>
                    <td>{r.name}</td>
                    <td>{r.department || "—"}</td>
                    <td>{r.designation}</td>
                    <td>{r.mobile}</td>
                    <td>{r.email}</td>
                    <td style={{ textAlign: "center" }}>
                      <button type="button" className={modalStyles.btnRemove} onClick={() => removeContact(i)}>
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

