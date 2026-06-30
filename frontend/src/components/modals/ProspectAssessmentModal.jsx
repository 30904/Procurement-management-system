import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import InputField from "../subcomponents/InputField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "In Review", label: "In Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

export default function ProspectAssessmentModal({ open, initialData, onClose, onSave }) {
  const [form, setForm] = useState({
    assessmentStatus: "Pending",
    assessmentNotes: "",
    assessedBy: "",
    assessedAt: "",
  });
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setForm({
      assessmentStatus: initialData?.assessmentStatus || "Pending",
      assessmentNotes: initialData?.assessmentNotes || "",
      assessedBy: initialData?.assessedBy || "",
      assessedAt: initialData?.assessedAt
        ? new Date(initialData.assessedAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  }, [open, initialData]);

  if (!open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave?.(form);
      onClose?.();
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "42vw" }}>
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">Assessment</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          <div
            className="sc-field-grid"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <SelectField
              label="Assessment Status"
              required
              options={STATUS_OPTIONS}
              value={form.assessmentStatus}
              onChange={(v) => setForm((p) => ({ ...p, assessmentStatus: v }))}
            />
            <DateField
              label="Assessment Date"
              value={form.assessedAt}
              onChange={(v) => setForm((p) => ({ ...p, assessedAt: v }))}
            />
            <InputField
              label="Assessed By"
              value={form.assessedBy}
              onChange={(v) => setForm((p) => ({ ...p, assessedBy: v }))}
              placeholder="Name of assessor"
            />
            <div className="sc-field sc-field--full">
              <label className="sc-label">Assessment Notes</label>
              <textarea
                className="sc-input"
                rows={4}
                value={form.assessmentNotes}
                onChange={(e) => setForm((p) => ({ ...p, assessmentNotes: e.target.value }))}
                placeholder="Feasibility, compliance, and approval remarks"
              />
            </div>
          </div>
        </div>
        <ModalFooterActions onCancel={onClose} onSave={handleSave} saving={saving} />
      </div>
    </div>,
    document.body
  );
}
