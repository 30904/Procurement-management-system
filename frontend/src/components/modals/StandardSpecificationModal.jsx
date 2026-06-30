import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { previewStandardSpecIdRequest } from "../../services/api.js";
import styles from "./StandardSpecificationModal.module.css";
import "../../styles/subcomponents.css";

const STATUS_OPTS = ["Active", "Inactive"];

function createInitialForm(initialData) {
  if (initialData) {
    return {
      specId: initialData.specId ?? "",
      inspectionParameter: initialData.inspectionParameter ?? "",
      uom: initialData.uom ?? "",
      testStandard: initialData.testStandard ?? "",
      testMethod: initialData.testMethod ?? "",
      status: initialData.status || "Active",
    };
  }
  return {
    specId: "",
    inspectionParameter: "",
    uom: "",
    testStandard: "",
    testMethod: "",
    status: "Active",
  };
}

function buildDevFillForm(specId = "SPC/PREVIEW") {
  return {
    specId,
    inspectionParameter: "Peel Adhesion Strength",
    uom: "N/25mm",
    testStandard: "PM/LAB/WI/006",
    testMethod: "Digital Tensile Tester",
    status: "Active",
  };
}

export default function StandardSpecificationModal({
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
  const { options: uomOptions, loading: uomLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.UOM);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!isCreate || readOnly) return;
    let cancelled = false;
    setPreviewLoading(true);
    previewStandardSpecIdRequest()
      .then((res) => {
        if (cancelled) return;
        const code = res?.data?.code ?? "";
        setForm((prev) => ({ ...prev, specId: code }));
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err?.message ||
              "Auto increment for SPC is not configured. Add it in Settings → Auto Increment."
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
    setForm(buildDevFillForm(form.specId || "SPC/PREVIEW"));
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [form.specId, toast]);

  useCreateModalDevFill({ enabled: isCreate && !readOnly, onFill: fillDevData });

  async function handleSave() {
    if (readOnly || saving) return;
    if (!form.inspectionParameter.trim()) {
      toast.error("Inspection/Test Parameter is required.");
      return;
    }
    if (!form.uom.trim()) {
      toast.error("UoM is required.");
      return;
    }
    if (!form.testMethod.trim()) {
      toast.error("Test Method is required.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave?.({
        inspectionParameter: form.inspectionParameter.trim(),
        uom: form.uom.trim(),
        testStandard: form.testStandard.trim(),
        testMethod: form.testMethod.trim(),
        status: form.status,
      });
      if (result?.deferred) return;
      toast.success(
        isCreate ? "Standard specification created." : "Standard specification updated."
      );
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save specification");
    } finally {
      setSaving(false);
    }
  }

  const title = readOnly
    ? "Standard Specification — View"
    : isCreate
      ? "Standard Specification — Entry"
      : "Standard Specification — Edit";

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
        aria-labelledby="std-spec-modal-title"
      >
        <div
          className={styles.header}
          onMouseDown={handleHeaderMouseDown}
        >
          <h2 id="std-spec-modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onClose()}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.form}>
            <div className={styles.rowTop}>
              <InputField
                label="Spec ID"
                required
                value={previewLoading && isCreate ? "Loading…" : form.specId}
                locked
              />
              <InputField
                label="Inspection / Test Parameter"
                required
                placeholder="e.g. Peel adhesion strength"
                value={form.inspectionParameter}
                onChange={(v) => set("inspectionParameter", v)}
                locked={readOnly}
              />
            </div>

            <div className={styles.rowMid}>
              <SelectField
                label="UoM"
                required
                options={uomOptions}
                value={form.uom}
                onChange={(v) => set("uom", v)}
                locked={readOnly}
                disabled={readOnly || uomLoading}
              />
              <InputField
                label="Test Standard"
                placeholder="Optional"
                value={form.testStandard}
                onChange={(v) => set("testStandard", v)}
                locked={readOnly}
              />
              <InputField
                label="Test Method"
                required
                placeholder="e.g. Digital tensile tester"
                value={form.testMethod}
                onChange={(v) => set("testMethod", v)}
                locked={readOnly}
              />
            </div>

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
