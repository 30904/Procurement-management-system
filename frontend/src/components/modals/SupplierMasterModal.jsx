import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import {
  EMPTY_ADDRESS,
  EMPTY_BANK,
  supplierDocToForm,
  supplierFormToPayload,
  buildSupplierDevFillForm,
} from "../../utils/supplierFormState.js";
import "../../styles/subcomponents.css";

const ACTIVE_OPTS = [
  { value: "A", label: "Active (A)" },
  { value: "I", label: "Inactive (I)" },
];

const TABS = ["General", "Billing", "Bank", "Other"];

export default function SupplierMasterModal({ onClose, onSave, initialData }) {
  const toast = useToast();
  const isCreate = !initialData;
  const [tab, setTab] = useState("General");
  const [form, setForm] = useState(() => supplierDocToForm(initialData));
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    setForm(supplierDocToForm(initialData));
    setTab("General");
  }, [initialData]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const patchBilling = (key, value) => {
    setForm((prev) => {
      const list = [...(prev.supplierBillingAddress || [{ ...EMPTY_ADDRESS }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, supplierBillingAddress: list };
    });
  };

  const patchBank = (key, value) => {
    setForm((prev) => {
      const list = [...(prev.supplierBankDetails || [{ ...EMPTY_BANK }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, supplierBankDetails: list };
    });
  };

  const billing = form.supplierBillingAddress?.[0] || EMPTY_ADDRESS;
  const bank = form.supplierBankDetails?.[0] || EMPTY_BANK;
  const { options: supplierCategoryOptions, loading: supplierCategoryLoading } =
    useMasterDataOptions(MASTER_DATA_CATEGORY.SUPPLIER_CATEGORY);

  const fillDevData = useCallback(() => {
    setForm(buildSupplierDevFillForm());
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [toast]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  async function handleSave() {
    if (saving) return;
    if (!form.supplierCode?.trim()) {
      toast.error("Vendor Code is required.");
      return;
    }
    if (!form.supplierName?.trim()) {
      toast.error("Vendor Name is required.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.(supplierFormToPayload(form));
      toast.success(isCreate ? "Vendor created." : "Vendor updated.");
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save supplier");
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
        style={{ ...modalStyle, width: "72vw", maxHeight: "88vh" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="supplier-modal-title" className="sc-modal-title">
            {isCreate ? "Vendor Entry" : "Edit Vendor"}
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div
          className="sc-modal-tabs"
          style={{
            display: "flex",
            gap: "0.4vw",
            padding: "0.8vh 1.2vw",
            borderBottom: "0.06vw solid #e8eef5",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "0.5vh 1vw",
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82vw",
                background: tab === t ? "var(--brand-primary, #197dfa)" : "#f1f5f9",
                color: tab === t ? "#fff" : "#475569",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="sc-modal-body" style={{ maxHeight: "58vh", overflowY: "auto" }}>
          {tab === "General" && (
            <div className="sc-field-grid sc-field-grid--2col">
              <InputField
                label="Vendor Code"
                required
                value={form.supplierCode}
                onChange={(v) => set("supplierCode", v)}
                locked={!isCreate}
              />
              <InputField
                label="Vendor Name"
                required
                value={form.supplierName}
                onChange={(v) => set("supplierName", v)}
              />
              <InputField
                label="Purchase Type"
                value={form.supplierPurchaseType}
                onChange={(v) => set("supplierPurchaseType", v)}
              />
              <SelectField
                label="Status"
                required
                options={ACTIVE_OPTS}
                value={form.isSupplierActive}
                onChange={(v) => set("isSupplierActive", v)}
              />
              <InputField
                label="Company Type"
                value={form.supplierCompanyType}
                onChange={(v) => set("supplierCompanyType", v)}
              />
              <InputField
                label="Supplier Type"
                value={form.supplierType}
                onChange={(v) => set("supplierType", v)}
              />
              <SelectField
                label="Vendor Category"
                required
                options={supplierCategoryOptions}
                value={form.categoryType}
                onChange={(v) => set("categoryType", v)}
                disabled={supplierCategoryLoading}
              />
              <InputField
                label="Currency"
                value={form.supplierCurrency}
                onChange={(v) => set("supplierCurrency", v)}
              />
              <InputField
                label="INCOTerms"
                value={form.supplierINCOTerms}
                onChange={(v) => set("supplierINCOTerms", v)}
              />
              <InputField
                label="Payment Terms"
                value={form.supplierPaymentTerms}
                onChange={(v) => set("supplierPaymentTerms", v)}
              />
              <InputField
                label="GST Classification"
                value={form.gstClassification}
                onChange={(v) => set("gstClassification", v)}
              />
              <InputField
                label="GSTIN"
                value={form.gstin}
                onChange={(v) => set("gstin", v)}
              />
            </div>
          )}

          {tab === "Billing" && (
            <div className="sc-field-grid sc-field-grid--2col">
              <InputField label="Line 1" value={billing.line1} onChange={(v) => patchBilling("line1", v)} />
              <InputField label="Line 2" value={billing.line2} onChange={(v) => patchBilling("line2", v)} />
              <InputField label="Line 3" value={billing.line3} onChange={(v) => patchBilling("line3", v)} />
              <InputField label="Line 4" value={billing.line4} onChange={(v) => patchBilling("line4", v)} />
              <InputField label="City" value={billing.city} onChange={(v) => patchBilling("city", v)} />
              <InputField label="State" value={billing.state} onChange={(v) => patchBilling("state", v)} />
              <InputField label="District" value={billing.district} onChange={(v) => patchBilling("district", v)} />
              <InputField label="Pin Code" value={billing.pinCode} onChange={(v) => patchBilling("pinCode", v)} />
              <InputField label="Country" value={billing.country} onChange={(v) => patchBilling("country", v)} />
              <InputField label="Zone" value={billing.zone} onChange={(v) => patchBilling("zone", v)} />
            </div>
          )}

          {tab === "Bank" && (
            <div className="sc-field-grid sc-field-grid--2col">
              <InputField label="BEF Name" value={bank.befName} onChange={(v) => patchBank("befName", v)} />
              <InputField label="Bank Name" value={bank.bankName} onChange={(v) => patchBank("bankName", v)} />
              <InputField
                label="Account Number"
                value={bank.accountNumber}
                onChange={(v) => patchBank("accountNumber", v)}
              />
              <InputField
                label="Account Type"
                value={bank.accountType}
                onChange={(v) => patchBank("accountType", v)}
              />
              <InputField
                label="SWIFT Code"
                value={bank.bankSwiftCode}
                onChange={(v) => patchBank("bankSwiftCode", v)}
              />
            </div>
          )}

          {tab === "Other" && (
            <div className="sc-field-grid sc-field-grid--2col">
              <InputField
                label="Country of Origin"
                value={form.countryOfOrigin}
                onChange={(v) => set("countryOfOrigin", v)}
              />
              <InputField
                label="Nick Name"
                value={form.supplierNickName}
                onChange={(v) => set("supplierNickName", v)}
              />
              <InputField
                label="Vendor Code"
                value={form.supplierVendorCode}
                onChange={(v) => set("supplierVendorCode", v)}
              />
              <InputField
                label="Website"
                value={form.supplierWebsite}
                onChange={(v) => set("supplierWebsite", v)}
              />
              <InputField label="CIN" value={form.supplierCIN} onChange={(v) => set("supplierCIN", v)} />
              <InputField label="URD" value={form.supplierURD} onChange={(v) => set("supplierURD", v)} />
              <InputField label="MSME No." value={form.supplierMSMENo} onChange={(v) => set("supplierMSMENo", v)} />
              <InputField
                label="Lead Time (Days)"
                value={form.supplierLeadTimeInDays}
                onChange={(v) => set("supplierLeadTimeInDays", v)}
                inputMode="numeric"
              />
            </div>
          )}
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
