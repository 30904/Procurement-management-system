import { useCallback, useEffect, useState } from "react";
import { getMasterDataNextSequenceRequest } from "../../services/api.js";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import InputField from "../subcomponents/InputField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import "../../styles/subcomponents.css";

function createInitialForm(initialData, activeCategory) {
  if (initialData) {
    return {
      category: initialData.category || activeCategory || "",
      label: initialData.label || "",
      value: initialData.value || "",
      description: initialData.description || "",
      sequence: String(initialData.sequence ?? 1),
      status: initialData.status || "Active",
    };
  }
  return {
    category: activeCategory || "",
    label: "",
    value: "",
    description: "",
    sequence: "1",
    status: "Active",
  };
}

export default function MasterDataModal({
  onClose,
  onSave,
  initialData,
  activeCategory,
  categories = [],
  lockCategory = false,
}) {
  const toast = useToast();
  const isCreate = !initialData;
  const [form, setForm] = useState(
    createInitialForm(initialData, activeCategory)
  );
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } =
    useModalDrag();

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  const fillDevData = useCallback(() => {
    const suffix = String(Date.now()).slice(-4);
    const category = activeCategory || categories[0] || "General";
    setForm({
      category,
      label: `Dev Entry ${suffix}`,
      value: `DEV-${suffix}`,
      description: "Auto-filled via Alt+F1",
      sequence: form.sequence || "1",
      status: "Active",
    });
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [activeCategory, categories, toast]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  useEffect(() => {
    if (!isCreate) return undefined;
    const category = form.category?.trim();
    if (!category) return undefined;

    let cancelled = false;
    getMasterDataNextSequenceRequest(category)
      .then((res) => {
        if (cancelled) return;
        const next = res?.data?.sequence;
        if (next != null) {
          setForm((prev) => ({ ...prev, sequence: String(next) }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isCreate, form.category]);

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  async function handleCreateCategory(name) {
    const normalized = String(name ?? "").trim();
    if (!normalized) return null;
    return { value: normalized, label: normalized };
  }

  async function handleSave() {
    if (saving) return;
    if (!form.category?.trim()) {
      toast.error("Please enter a category.");
      return;
    }
    if (!form.label?.trim()) {
      toast.error("Please enter a label.");
      return;
    }
    const sequence = Number(form.sequence);
    if (!Number.isFinite(sequence) || sequence < 1) {
      toast.error("Please enter a valid order (1 or greater).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: form.value?.trim() || form.label.trim(),
        sequence,
      };
      await onSave?.(payload);
      toast.success(
        initialData
          ? "Entry updated successfully."
          : "Entry created successfully."
      );
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save entry");
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
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "50vw" }}>
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">
            {initialData ? "Edit Entry" : "Add New Entry"}
          </span>
          <button
            type="button"
            className="sc-modal-close"
            onClick={() => onClose()}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          <div
            className="sc-field-grid"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            {!lockCategory ? (
              <SelectField
                label="Category"
                required
                options={categoryOptions}
                value={form.category}
                onChange={(v) => set("category", v)}
                allowCreate
                createLabel="+ Add new category"
                createPlaceholder="Type new category"
                onCreate={handleCreateCategory}
                disabled={!!initialData}
              />
            ) : null}
            <InputField
              label="Label"
              required
              placeholder="Enter label"
              value={form.label}
              onChange={(v) => set("label", v)}
            />
            <InputField
              label="Value"
              placeholder="Enter value (defaults to label)"
              value={form.value}
              onChange={(v) => set("value", v)}
            />
            <InputField
              label="Order"
              required
              type="number"
              min={1}
              placeholder="Display order in dropdowns"
              value={form.sequence}
              onChange={(v) => set("sequence", v)}
            />
            <StatusField
              label="Status"
              required
              value={form.status}
              onChange={(v) => set("status", v)}
            />
            <div className="sc-field sc-field--full">
              <label className="sc-label">Description</label>
              <input
                type="text"
                className="sc-input"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onSave={handleSave}
          saving={saving}
          showDevHint={isCreate}
        />
      </div>
    </div>,
    document.body
  );
}
