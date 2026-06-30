import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { previewInspectionChecklistIdRequest } from "../../services/api.js";
import styles from "./StandardSpecificationModal.module.css";
import "../../styles/subcomponents.css";

const STATUS_OPTS = ["Active", "Inactive"];

function createInitialForm(initialData) {
  if (initialData) {
    return {
      checklistId: initialData.checklistId ?? "",
      checklistItem: initialData.checklistItem ?? "",
      displayOrder: String(initialData.displayOrder ?? 0),
      status: initialData.status || "Active",
    };
  }
  return {
    checklistId: "",
    checklistItem: "",
    displayOrder: "",
    status: "Active",
  };
}

function buildDevFillForm(checklistId = "ICL/PREVIEW") {
  return {
    checklistId,
    checklistItem: "Print Quality",
    displayOrder: "10",
    status: "Active",
  };
}

export default function InspectionChecklistModal({
  onClose,
  onSave,
  initialData,
  readOnly = false,
}) {
  const toast = useToast();
  const isCreate = !initialData;
  const [form, setForm] = useState(() => createInitialForm(initialData));
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!isCreate || readOnly) return;
    let cancelled = false;
    setPreviewLoading(true);
    previewInspectionChecklistIdRequest()
      .then((res) => {
        if (cancelled) return;
        const code = res?.data?.code ?? "";
        setForm((prev) => ({ ...prev, checklistId: code }));
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err?.message ||
              "Auto increment for ICL is not configured. Add it in Settings → Auto Increment."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCreate, readOnly, toast]);

  const fillDevData = useCallback(() => {
    setForm(buildDevFillForm(form.checklistId || "ICL/PREVIEW"));
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [form.checklistId, toast]);

  useCreateModalDevFill({ enabled: isCreate && !readOnly, onFill: fillDevData });

  async function handleSave() {
    if (readOnly || saving) return;
    if (!form.checklistItem.trim()) {
      toast.error("Inspection checklist item is required.");
      return;
    }
    const orderNum = form.displayOrder === "" ? 0 : Number(form.displayOrder);
    if (form.displayOrder !== "" && (Number.isNaN(orderNum) || orderNum < 0)) {
      toast.error("Order must be zero or greater.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave?.({
        checklistItem: form.checklistItem.trim(),
        displayOrder: orderNum,
        status: form.status,
      });
      if (result?.deferred) return;
      toast.success(isCreate ? "Inspection checklist created." : "Inspection checklist updated.");
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save checklist");
    } finally {
      setSaving(false);
    }
  }

  const title = readOnly
    ? "Inspection Checklist — View"
    : isCreate
      ? "Inspection Checklist — Entry"
      : "Inspection Checklist — Edit";

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className={`sc-modal ${styles.modal}`}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="icl-modal-title"
      >
        <div className={styles.header} onMouseDown={handleHeaderMouseDown}>
          <h2 id="icl-modal-title" className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={() => onClose()} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.rowTop}>
              <InputField
                label="Checklist ID"
                required
                value={previewLoading && isCreate ? "Loading…" : form.checklistId}
                locked
              />
              <InputField
                label="Order"
                placeholder="0"
                value={form.displayOrder}
                onChange={(v) => set("displayOrder", v)}
                locked={readOnly}
                inputMode="numeric"
              />
            </div>

            <InputField
              label="Inspection Checklist Item"
              required
              placeholder="Describe the inspection point"
              value={form.checklistItem}
              onChange={(v) => set("checklistItem", v)}
              locked={readOnly}
            />

            <div className={styles.statusRow}>
              <StatusField
                label="Status"
                required
                options={STATUS_OPTS}
                value={form.status}
                onChange={readOnly ? undefined : (v) => set("status", v)}
                locked={readOnly}
              />
            </div>
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onSave={readOnly ? null : handleSave}
          saving={saving}
          showDevHint={isCreate && !readOnly}
        />
      </div>
    </div>,
    document.body
  );
}
