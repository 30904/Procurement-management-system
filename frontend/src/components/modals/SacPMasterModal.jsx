import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { EMPTY_TAX_MPBCDC } from "../../config/mpbcdcMasterOptions.js";
import "../../styles/subcomponents.css";

function formatDateForInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function mapMpbcdcTax(initialData) {
  const t = initialData?.mpbcdcTax || {};
  return {
    governmentCategory: t.governmentCategory ?? "",
    applicableCategory: t.applicableCategory ?? "",
    activeFrom: formatDateForInput(t.activeFrom),
    activeTo: formatDateForInput(t.activeTo),
  };
}

const STATUS_OPTS = ["Active", "Inactive"];

function createInitialForm(initialData) {
  if (initialData) {
    return {
      sacCode: initialData.sacCode ?? "",
      description: initialData.description ?? "",
      gstRate: String(initialData.gstRate ?? 0),
      igstRate: String(initialData.igstRate ?? 0),
      cgstRate: String(initialData.cgstRate ?? 0),
      sgstRate: String(initialData.sgstRate ?? 0),
      utgstRate: String(initialData.utgstRate ?? 0),
      revNumber: initialData.revNumber ?? 0,
      status: initialData.status || "Active",
      mpbcdcTax: mapMpbcdcTax(initialData),
    };
  }

  return {
    sacCode: "",
    description: "",
    gstRate: "",
    igstRate: "",
    cgstRate: "",
    sgstRate: "",
    utgstRate: "",
    revNumber: 0,
    status: "Active",
    mpbcdcTax: { ...EMPTY_TAX_MPBCDC },
  };
}

function buildDevFillForm() {
  const suffix = String(Date.now()).slice(-6);
  return {
    sacCode: `55${suffix}`,
    description: "Dev Test — Sample Services",
    gstRate: "18",
    igstRate: "18",
    cgstRate: "9",
    sgstRate: "9",
    utgstRate: "9",
    revNumber: 0,
    status: "Active",
    mpbcdcTax: { ...EMPTY_TAX_MPBCDC },
  };
}

export default function SacPMasterModal({ onClose, onSave, initialData }) {
  const toast = useToast();
  const isCreate = !initialData;
  const [form, setForm] = useState(() => createInitialForm(initialData));
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const { options: serviceCategoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.SERVICE_CATEGORY);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setMpbcdc = (key, value) =>
    setForm((prev) => ({
      ...prev,
      mpbcdcTax: { ...(prev.mpbcdcTax || EMPTY_TAX_MPBCDC), [key]: value },
    }));

  const fillDevData = useCallback(() => {
    setForm(buildDevFillForm());
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [toast]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  async function handleSave() {
    if (saving) return;
    if (!form.sacCode.trim()) {
      toast.error("SAC Code is required.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description of Services is required.");
      return;
    }

    const rates = [
      ["gstRate", "GST Rate"],
      ["igstRate", "IGST Rate"],
      ["cgstRate", "CGST Rate"],
      ["sgstRate", "SGST Rate"],
      ["utgstRate", "UTGST Rate"],
    ];

    for (const [key, label] of rates) {
      const n = Number(form[key]);
      if (form[key] === "" || Number.isNaN(n) || n < 0 || n > 100) {
        toast.error(`${label} must be between 0 and 100.`);
        return;
      }
    }

    setSaving(true);
    try {
      const result = await onSave?.({
        sacCode: form.sacCode.trim(),
        description: form.description.trim(),
        gstRate: Number(form.gstRate),
        igstRate: Number(form.igstRate),
        cgstRate: Number(form.cgstRate),
        sgstRate: Number(form.sgstRate),
        utgstRate: Number(form.utgstRate),
        revNumber: form.revNumber ?? 0,
        status: form.status,
        mpbcdcTax: {
          governmentCategory: form.mpbcdcTax?.governmentCategory?.trim() || "",
          applicableCategory: form.mpbcdcTax?.applicableCategory || "",
          activeFrom: form.mpbcdcTax?.activeFrom || undefined,
          activeTo: form.mpbcdcTax?.activeTo || undefined,
        },
      });

      if (result?.deferred) return;

      toast.success(isCreate ? "SAC/P record created." : "SAC/P record updated.");
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save SAC/P record");
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
        style={{ ...modalStyle, width: "68vw" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sac-p-modal-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="sac-p-modal-title" className="sc-modal-title">
            {isCreate ? "SAC/P Entry" : "Edit SAC/P Entry"}
          </span>
          <button
            type="button"
            className="sc-modal-close"
            onClick={() => onClose?.()}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          <div className="sc-field-grid">
            <InputField
              label="SAC Code"
              required
              placeholder="Enter SAC Code"
              value={form.sacCode}
              onChange={(v) => set("sacCode", v)}
            />
            <InputField
              label="Description Of Services"
              required
              placeholder="Enter Description"
              value={form.description}
              onChange={(v) => set("description", v)}
            />
            <InputField
              label="GST Rate %"
              required
              placeholder="0"
              value={form.gstRate}
              onChange={(v) => set("gstRate", v)}
              inputMode="decimal"
            />
            <InputField
              label="IGST Rate %"
              required
              placeholder="0"
              value={form.igstRate}
              onChange={(v) => set("igstRate", v)}
              inputMode="decimal"
            />
            <InputField
              label="CGST Rate %"
              required
              placeholder="0"
              value={form.cgstRate}
              onChange={(v) => set("cgstRate", v)}
              inputMode="decimal"
            />
            <InputField
              label="SGST Rate %"
              required
              placeholder="0"
              value={form.sgstRate}
              onChange={(v) => set("sgstRate", v)}
              inputMode="decimal"
            />
            <InputField
              label="UTGST Rate %"
              required
              placeholder="0"
              value={form.utgstRate}
              onChange={(v) => set("utgstRate", v)}
              inputMode="decimal"
            />
            <StatusField
              label="Status"
              required
              options={STATUS_OPTS}
              value={form.status}
              onChange={(v) => set("status", v)}
            />
          </div>
          <hr style={{ margin: "1.2vh 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
          <div className="sc-field-grid">
            <InputField
              label="Government Category"
              value={form.mpbcdcTax?.governmentCategory || ""}
              onChange={(v) => setMpbcdc("governmentCategory", v)}
              placeholder="Optional"
            />
            <SelectField
              label="Applicable Service Category"
              options={serviceCategoryOptions}
              value={form.mpbcdcTax?.applicableCategory || ""}
              onChange={(v) => setMpbcdc("applicableCategory", v)}
            />
            <DateField
              label="Active From"
              value={form.mpbcdcTax?.activeFrom || ""}
              onChange={(v) => setMpbcdc("activeFrom", v)}
            />
            <DateField
              label="Active To"
              value={form.mpbcdcTax?.activeTo || ""}
              onChange={(v) => setMpbcdc("activeTo", v)}
            />
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

