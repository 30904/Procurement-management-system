import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SacPRevisionModal({
  open,
  revisionNo,
  defaultProposedBy = "",
  onClose,
  onSave,
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    revisionDate: todayIso(),
    reason: "",
    proposedBy: defaultProposedBy,
    approvedBy: "",
  });

  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const revisionNoText = useMemo(() => `Rev ${revisionNo ?? 1}`, [revisionNo]);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm({
      revisionDate: todayIso(),
      reason: "",
      proposedBy: defaultProposedBy || "",
      approvedBy: "",
    });
  }, [open, defaultProposedBy, revisionNo]);

  if (!open) return null;

  async function handleSave() {
    if (saving) return;
    if (!form.revisionDate) {
      toast.error("Revision Date is required.");
      return;
    }
    if (!form.reason.trim()) {
      toast.error("Reason for Revision is required.");
      return;
    }
    if (!form.proposedBy.trim()) {
      toast.error("Revision Proposed by is required.");
      return;
    }
    if (!form.approvedBy.trim()) {
      toast.error("Revision Approved by is required.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.({
        revisionDate: form.revisionDate,
        reason: form.reason.trim(),
        proposedBy: form.proposedBy.trim(),
        approvedBy: form.approvedBy.trim(),
      });
    } finally {
      setSaving(false);
    }
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
          width: "46vw",
          minWidth: "560px",
          maxWidth: "760px",
          maxHeight: "72vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sac-p-revision-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="sac-p-revision-title" className="sc-modal-title">
            Revision Info
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ padding: "2.2vh 1.5vw 1.6vh", gap: "1.5vh" }}>
          <div className="sc-field-grid sc-field-grid--2col">
            <InputField label="Revision No." required value={revisionNoText} locked />
            <DateField
              label="Revision Date"
              required
              value={form.revisionDate}
              onChange={(v) => set("revisionDate", v)}
            />
            <div className="sc-field sc-field--full">
              <label className="sc-label sc-label-required">Reason for Revision</label>
              <textarea
                className="sc-input"
                style={{ minHeight: "6.2vh", paddingTop: "0.7vh", resize: "none" }}
                placeholder="Enter reason for this revision"
                value={form.reason}
                onChange={(e) => set("reason", e.target.value)}
              />
            </div>
            <InputField
              label="Revision Proposed by"
              required
              value={form.proposedBy}
              onChange={(v) => set("proposedBy", v)}
              placeholder="Enter user name"
            />
            <InputField
              label="Revision Approved by"
              required
              value={form.approvedBy}
              onChange={(v) => set("approvedBy", v)}
              placeholder="Enter approver name"
            />
          </div>
        </div>

        <ModalFooterActions onCancel={onClose} onSave={handleSave} saving={saving} />
      </div>
    </div>,
    document.body
  );
}

