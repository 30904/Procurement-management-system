import { useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { changePasswordRequest } from "../../services/api.js";
import "../../styles/subcomponents.css";

export default function ChangePasswordModal({ onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (saving) return;
    if (!form.currentPassword) { toast.error("Enter your current password"); return; }
    if (!form.newPassword) { toast.error("Enter a new password"); return; }
    if (form.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }

    setSaving(true);
    try {
      await changePasswordRequest(form);
      toast.success("Password changed successfully");
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  function renderPasswordField(label, key, show, setShow) {
    return (
      <div className="sc-field">
        <label className="sc-label sc-label-required">{label}</label>
        <div style={{ position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            className="sc-input"
            placeholder={`Enter ${label.toLowerCase()}`}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
            autoComplete="new-password"
            style={{ paddingRight: "2.5vw" }}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: "absolute", right: "0.6vw", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: "0.8vw", color: "#64748b",
            }}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    );
  }

  return createPortal(
    <div className="sc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "32vw" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Change Password</span>
          <button type="button" className="sc-modal-close" onClick={() => onClose()} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            {renderPasswordField("Current Password", "currentPassword", showCurrent, setShowCurrent)}
            {renderPasswordField("New Password", "newPassword", showNew, setShowNew)}
            {renderPasswordField("Confirm Password", "confirmPassword", showConfirm, setShowConfirm)}
          </div>
        </div>

        <ModalFooterActions onCancel={onClose} onSave={handleSave} saving={saving} />
      </div>
    </div>,
    document.body
  );
}
