import { useState } from "react";
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

const DATA_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Yes/No" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multi_select", label: "Multi select" },
];

function initForm(data, categoryOptions) {
  if (data) {
    return {
      code: data.code || "",
      label: data.label || "",
      description: data.description || "",
      dataType: data.dataType || "text",
      unit: data.unit || "",
      options: (data.options || []).join(", "),
      masterDataCategory: data.masterDataCategory || "",
      mandatoryRule: data.mandatoryRule || "never",
      applicableCategories: Array.isArray(data.applicableCategories) ? [...data.applicableCategories] : [],
      min: data.min ?? "",
      max: data.max ?? "",
      regex: data.regex || "",
      sequence: data.sequence ?? 0,
      status: data.status || "Active",
    };
  }
  return {
    code: "",
    label: "",
    description: "",
    dataType: "text",
    unit: "",
    options: "",
    masterDataCategory: "",
    mandatoryRule: "never",
    applicableCategories: [],
    min: "",
    max: "",
    regex: "",
    sequence: 0,
    status: "Active",
  };
}

export default function ItemAttributeDefinitionModal({ onClose, onSave, initialData, categoryOptions = [] }) {
  const toast = useToast();
  const [form, setForm] = useState(() => initForm(initialData, categoryOptions));
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  function toggleCategory(value) {
    setForm((prev) => {
      const set = new Set(prev.applicableCategories);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, applicableCategories: [...set] };
    });
  }

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
        dataType: form.dataType,
        unit: form.unit.trim(),
        options: form.options.split(",").map((s) => s.trim()).filter(Boolean),
        masterDataCategory: form.masterDataCategory.trim(),
        mandatoryRule: form.mandatoryRule,
        applicableCategories: form.applicableCategories,
        min: form.min === "" ? null : Number(form.min),
        max: form.max === "" ? null : Number(form.max),
        regex: form.regex.trim(),
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
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "54vw" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">{initialData ? "Edit Attribute Definition" : "Add Attribute Definition"}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vh 1vw" }}>
          <label className="sc-field">
            <span className="sc-label">Code *</span>
            <input className="sc-input" value={form.code} disabled={Boolean(initialData)} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Label *</span>
            <input className="sc-input" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Data type</span>
            <select className="sc-select" value={form.dataType} onChange={(e) => setForm((p) => ({ ...p, dataType: e.target.value }))}>
              {DATA_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="sc-field">
            <span className="sc-label">Unit</span>
            <input className="sc-input" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
          </label>
          <label className="sc-field" style={{ gridColumn: "1 / -1" }}>
            <span className="sc-label">Static options (comma-separated, if not using Master Data)</span>
            <input className="sc-input" value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} />
          </label>
          <label className="sc-field">
            <span className="sc-label">Master Data category (for dropdown)</span>
            <input className="sc-input" value={form.masterDataCategory} onChange={(e) => setForm((p) => ({ ...p, masterDataCategory: e.target.value }))} placeholder="ITEM_COATING_TYPE" />
          </label>
          <label className="sc-field">
            <span className="sc-label">Mandatory rule</span>
            <select className="sc-select" value={form.mandatoryRule} onChange={(e) => setForm((p) => ({ ...p, mandatoryRule: e.target.value }))}>
              {MANDATORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label className="sc-field">
            <span className="sc-label">Min / Max</span>
            <div style={{ display: "flex", gap: "0.5vw" }}>
              <input className="sc-input" type="number" placeholder="Min" value={form.min} onChange={(e) => setForm((p) => ({ ...p, min: e.target.value }))} />
              <input className="sc-input" type="number" placeholder="Max" value={form.max} onChange={(e) => setForm((p) => ({ ...p, max: e.target.value }))} />
            </div>
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
