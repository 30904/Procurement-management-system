import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

const MANDATORY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "always", label: "Always (all materials)" },
  { value: "by_item_category", label: "By material category" },
];

const DEFAULT_MIMES = "application/pdf,image/jpeg,image/png,image/webp";

function initForm(data, categoryOptions) {
  if (data) {
    return {
      code: data.code || "",
      label: data.label || "",
      description: data.description || "",
      allowedMimeTypes: (data.allowedMimeTypes || []).join(", "),
      maxFiles: data.maxFiles ?? 1,
      mandatoryRule: data.mandatoryRule || "never",
      applicableCategories: Array.isArray(data.applicableCategories) ? [...data.applicableCategories] : [],
      sequence: data.sequence ?? 0,
      status: data.status || "Active",
    };
  }
  return {
    code: "",
    label: "",
    description: "",
    allowedMimeTypes: DEFAULT_MIMES,
    maxFiles: 1,
    mandatoryRule: "never",
    applicableCategories: categoryOptions[0] ? [categoryOptions[0].value] : [],
    sequence: 0,
    status: "Active",
  };
}

export default function ItemDocumentTypeModal({ onClose, onSave, initialData, categoryOptions = [] }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initForm(initialData, categoryOptions));
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const toggleCategory = useCallback((value) => {
    setForm((prev) => {
      const set = new Set(prev.applicableCategories);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, applicableCategories: [...set] };
    });
  }, []);

  async function handleSave() {
    if (!form.code.trim() || !form.label.trim()) {
      toast.error("Code and label are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave?.({
        code: form.code.trim(),
        label: form.label.trim(),
        description: form.description.trim(),
        allowedMimeTypes: form.allowedMimeTypes.split(",").map((s) => s.trim()).filter(Boolean),
        maxFiles: Number(form.maxFiles) || 1,
        mandatoryRule: form.mandatoryRule,
        applicableCategories: form.applicableCategories,
        sequence: Number(form.sequence) || 0,
        status: form.status,
      });
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="sc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={overlayStyle}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">{initialData ? "Edit Document Type" : "Add Document Type"}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vh 1vw" }}>
          <label className="sc-field">
            <span className="sc-label">Code *</span>
            <input className="sc-input" value={form.code} disabled={Boolean(initialData)} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="GA_DRAWING" />
          </label>
          <label className="sc-field">
            <span className="sc-label">Label *</span>
            <input className="sc-input" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </label>
          <label className="sc-field" style={{ gridColumn: "1 / -1" }}>
            <span className="sc-label">Description</span>
            <input className="sc-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </label>
          <label className="sc-field" style={{ gridColumn: "1 / -1" }}>
            <span className="sc-label">Allowed MIME types (comma-separated)</span>
            <input className="sc-input" value={form.allowedMimeTypes} onChange={(e) => setForm((p) => ({ ...p, allowedMimeTypes: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Max files</span>
            <input className="sc-input" type="number" min={1} max={20} value={form.maxFiles} onChange={(e) => setForm((p) => ({ ...p, maxFiles: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Mandatory rule</span>
            <select className="sc-select" value={form.mandatoryRule} onChange={(e) => setForm((p) => ({ ...p, mandatoryRule: e.target.value }))}>
              {MANDATORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="sc-field">
            <span className="sc-label">Sequence</span>
            <input className="sc-input" type="number" value={form.sequence} onChange={(e) => setForm((p) => ({ ...p, sequence: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Status</span>
            <select className="sc-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <div className="sc-field" style={{ gridColumn: "1 / -1" }}>
            <span className="sc-label">Applicable item categories (empty = all)</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5vw", marginTop: "0.5vh" }}>
              {categoryOptions.map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "0.3vw", fontSize: "0.78vw" }}>
                  <input type="checkbox" checked={form.applicableCategories.includes(opt.value)} onChange={() => toggleCategory(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <ModalFooterActions onCancel={onClose} onSave={handleSave} saving={saving} saveLabel={initialData ? "Update" : "Create"} />
      </div>
    </div>,
    document.body
  );
}
