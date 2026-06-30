import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import SupplierContactDetailsModal from "../../components/modals/SupplierContactDetailsModal.jsx";
import SupplierBankDetailsModal from "../../components/modals/SupplierBankDetailsModal.jsx";
import SupplierAddressTabs, {
  emptySupplierAddress,
  isSupplierAddressEmpty,
  validateSupplierAddress,
} from "../../components/masters/SupplierAddressTabs.jsx";
import {
  ACTIVE_STATUS_OPTIONS,
  CURRENCY_OPTIONS,
  GST_CLASSIFICATION_OPTIONS,
  MSME_OPTIONS,
} from "../../config/supplierFormOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { createSupplierMasterRequest, previewSupplierCodeRequest } from "../../services/api.js";
import SupplierGovProcurementSections from "../../components/masters/SupplierGovProcurementSections.jsx";
import SupplierDocumentsSection from "../../components/masters/SupplierDocumentsSection.jsx";
import {
  EMPTY_ADDRESS,
  EMPTY_GOV_PROCUREMENT,
  EMPTY_VENDOR_COMPLIANCE,
  EMPTY_VENDOR_PERFORMANCE,
  buildSupplierDevFillForm,
  supplierFormToPayload,
} from "../../utils/supplierFormState.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function SupplierCreatePage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [codePreviewLoading, setCodePreviewLoading] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState(0);

  const [form, setForm] = useState({
    categoryType: "",
    supplierCode: "",
    supplierName: "",
    supplierNickName: "",
    gstClassification: "",
    gstin: "",
    supplierCIN: "",
    supplierMSMENo: "",
    supplierCurrency: "USD",
    supplierPaymentTerms: "",
    supplierINCOTerms: "",
    isSupplierActive: "A",
    supplierBillingAddress: [{ ...EMPTY_ADDRESS }],
    supplierShippingAddress: [],
    supplierContactMatrix: [],
    supplierBankDetails: [],
    govProcurement: { ...EMPTY_GOV_PROCUREMENT },
    vendorCompliance: { ...EMPTY_VENDOR_COMPLIANCE },
    vendorPerformance: { ...EMPTY_VENDOR_PERFORMANCE },
  });

  const billing = form.supplierBillingAddress[0] || { ...EMPTY_ADDRESS };
  const shippingAddresses = form.supplierShippingAddress ?? [];
  const contactCount = form.supplierContactMatrix?.length ?? 0;
  const bankCount = form.supplierBankDetails?.length ?? 0;
  const {
    options: supplierCategoryOptions,
    loading: supplierCategoryLoading,
  } = useMasterDataOptions(MASTER_DATA_CATEGORY.SUPPLIER_CATEGORY);
  const {
    options: paymentTermsOptions,
    loading: paymentTermsLoading,
  } = useMasterDataOptions(MASTER_DATA_CATEGORY.PAYMENT_TERMS);
  const {
    options: freightTermsOptions,
    loading: freightTermsLoading,
  } = useMasterDataOptions(MASTER_DATA_CATEGORY.FREIGHT_TERMS);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setGov(key, value) {
    setForm((prev) => ({
      ...prev,
      govProcurement: { ...(prev.govProcurement || EMPTY_GOV_PROCUREMENT), [key]: value },
    }));
  }

  function setCompliance(key, value) {
    setForm((prev) => ({
      ...prev,
      vendorCompliance: { ...(prev.vendorCompliance || EMPTY_VENDOR_COMPLIANCE), [key]: value },
    }));
  }

  useEffect(() => {
    const category = form.categoryType?.trim();
    if (!category) {
      setForm((prev) => (prev.supplierCode ? { ...prev, supplierCode: "" } : prev));
      return undefined;
    }

    let cancelled = false;
    setCodePreviewLoading(true);
    previewSupplierCodeRequest(category)
      .then((res) => {
        if (cancelled) return;
        setForm((prev) => ({ ...prev, supplierCode: res?.data?.code ?? "" }));
      })
      .catch((err) => {
        if (!cancelled) {
          setForm((prev) => ({ ...prev, supplierCode: "" }));
          if (category) {
            toast.error(err?.data?.message || err?.message || "Could not preview supplier code");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setCodePreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.categoryType]);

  function setBilling(key, value) {
    setForm((prev) => {
      const list = [...(prev.supplierBillingAddress || [{ ...EMPTY_ADDRESS }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, supplierBillingAddress: list };
    });
  }

  function setShipping(shippingIndex, key, value) {
    setForm((prev) => {
      const list = [...(prev.supplierShippingAddress || [])];
      list[shippingIndex] = { ...(list[shippingIndex] || emptySupplierAddress()), [key]: value };
      return { ...prev, supplierShippingAddress: list };
    });
  }

  function addShippingAddress() {
    setForm((prev) => {
      const nextList = [...(prev.supplierShippingAddress || []), emptySupplierAddress()];
      setActiveAddressTab(nextList.length);
      return { ...prev, supplierShippingAddress: nextList };
    });
  }

  function removeShippingAddress(shippingIndex) {
    setForm((prev) => {
      const list = (prev.supplierShippingAddress || []).filter((_, i) => i !== shippingIndex);
      return { ...prev, supplierShippingAddress: list };
    });
    setActiveAddressTab((prev) => {
      if (prev === 0) return 0;
      const removedTab = shippingIndex + 1;
      if (prev === removedTab) return 0;
      if (prev > removedTab) return prev - 1;
      return prev;
    });
  }

  useCreateModalDevFill({
    enabled: true,
    onFill: () => {
      const sample = buildSupplierDevFillForm();
      setForm({
        categoryType: sample.categoryType,
        supplierCode: "",
        supplierName: sample.supplierName,
        supplierNickName: sample.supplierNickName ?? "",
        gstClassification: "B2B Regular",
        gstin: "27AABCU9603R1ZM",
        supplierCIN: sample.supplierCIN || "ABCDE1234F",
        supplierMSMENo: "Micro",
        supplierCurrency: sample.supplierCurrency,
        supplierPaymentTerms: sample.supplierPaymentTerms,
        supplierINCOTerms: sample.supplierINCOTerms,
        isSupplierActive: sample.isSupplierActive,
        supplierBillingAddress: sample.supplierBillingAddress,
        supplierShippingAddress: [],
        supplierContactMatrix: sample.supplierContactMatrix ?? [],
        supplierBankDetails: sample.supplierBankDetails ?? [],
        govProcurement: { ...EMPTY_GOV_PROCUREMENT },
        vendorCompliance: { ...EMPTY_VENDOR_COMPLIANCE },
        vendorPerformance: { ...EMPTY_VENDOR_PERFORMANCE },
      });
      setActiveAddressTab(0);
      toast.info("Sample data filled (Alt+F1).");
    },
  });

  async function handleSave() {
    if (saving) return;
    if (!form.categoryType.trim()) {
      return toast.error(
        supplierCategoryOptions.length === 0
          ? "Vendor Category is required. Add entries in Settings → Master Data → Supplier Category."
          : "Vendor Category is required."
      );
    }
    if (!form.supplierName.trim()) return toast.error("Vendor Name is required.");
    if (!form.gstClassification.trim()) return toast.error("GST Classification is required.");
    if (!form.gstin.trim()) return toast.error("GSTIN is required.");
    if (!form.supplierCIN.trim()) return toast.error("PAN Card No. is required.");
    if (!form.supplierCurrency.trim()) return toast.error("Currency is required.");
    if (!form.supplierPaymentTerms.trim()) {
      return toast.error(
        paymentTermsOptions.length === 0
          ? "Payment Terms is required. Add entries in Settings → Master Data → Payment Terms."
          : "Payment Terms are required."
      );
    }
    if (!form.supplierINCOTerms.trim()) {
      return toast.error(
        freightTermsOptions.length === 0
          ? "Freight/INCO Terms is required. Add entries in Settings → Master Data → Freight Terms."
          : "Freight/INCO Terms are required."
      );
    }
    const billingErrors = validateSupplierAddress(billing, "Primary Address (Billing)");
    if (billingErrors.length) return toast.error(billingErrors[0]);

    const filledShipping = (form.supplierShippingAddress || []).filter((a) => !isSupplierAddressEmpty(a));
    for (let i = 0; i < filledShipping.length; i += 1) {
      const shipErrors = validateSupplierAddress(filledShipping[i], `Address ${i + 2} (Shipping)`);
      if (shipErrors.length) return toast.error(shipErrors[0]);
    }

    const categoryLabel =
      supplierCategoryOptions.find((o) => o.value === form.categoryType)?.label ||
      form.categoryType;

    const payload = supplierFormToPayload({
      ...form,
      supplierCode: "",
      categoryType: form.categoryType.trim(),
      supplierPurchaseType: categoryLabel,
      supplierCompanyType: "PVT LTD",
      supplierType: "Manufacturer",
      supplierShippingAddress: filledShipping,
    });

    setSaving(true);
    try {
      await createSupplierMasterRequest(payload);
      toast.success("Supplier created successfully.");
      navigateWithHubReturn("masters/purchase/supplier");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create supplier");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase"
        listSegment="masters/purchase/supplier"
        listTitle="Vendor Summary"
        formTitle="New Vendor"
      />

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />

          <div className={styles.cardBody}>
            <div className="sc-field-grid">
              <SelectField
                label="Vendor Category"
                required
                options={supplierCategoryOptions}
                value={form.categoryType}
                onChange={(v) => set("categoryType", v)}
                disabled={supplierCategoryLoading}
              />
              <InputField
                label="Vendor Code"
                value={codePreviewLoading ? "Loading…" : form.supplierCode}
                locked
                placeholder="Select category to generate"
              />
              <InputField
                label="Vendor Name (Legal Entity)"
                required
                value={form.supplierName}
                onChange={(v) => set("supplierName", v)}
                placeholder="Enter legal entity name"
              />
              <InputField
                label="Vendor Short Name"
                value={form.supplierNickName}
                onChange={(v) => set("supplierNickName", v)}
                placeholder="Short display name"
              />

              <SelectField
                label="GST Classification"
                required
                options={GST_CLASSIFICATION_OPTIONS}
                value={form.gstClassification}
                onChange={(v) => set("gstClassification", v)}
              />
              <InputField
                label="GSTIN"
                required
                value={form.gstin}
                onChange={(v) => set("gstin", v.toUpperCase())}
                placeholder="15 character GSTIN"
              />
              <InputField
                label="PAN Card No."
                required
                value={form.supplierCIN}
                onChange={(v) => set("supplierCIN", v.toUpperCase())}
                placeholder="ABCDE1234F"
              />
              <SelectField
                label="MSME Classification"
                options={MSME_OPTIONS}
                value={form.supplierMSMENo}
                onChange={(v) => set("supplierMSMENo", v)}
              />

              <SelectField
                label="Currency"
                required
                options={CURRENCY_OPTIONS}
                value={form.supplierCurrency}
                onChange={(v) => set("supplierCurrency", v)}
              />
              <SelectField
                label="Payment Terms"
                required
                options={paymentTermsOptions}
                value={form.supplierPaymentTerms}
                onChange={(v) => set("supplierPaymentTerms", v)}
                disabled={paymentTermsLoading}
              />
              <SelectField
                label="Freight/INCO Terms"
                required
                options={freightTermsOptions}
                value={form.supplierINCOTerms}
                onChange={(v) => set("supplierINCOTerms", v)}
                disabled={freightTermsLoading}
              />
              <SelectField
                label="Status"
                required
                options={ACTIVE_STATUS_OPTIONS}
                value={form.isSupplierActive}
                onChange={(v) => set("isSupplierActive", v)}
              />
            </div>

            <hr className={styles.sectionRule} />
            <h2 className={styles.sectionTitle}>Addresses</h2>

            <SupplierAddressTabs
              billingAddress={billing}
              shippingAddresses={shippingAddresses}
              activeTab={activeAddressTab}
              onActiveTabChange={setActiveAddressTab}
              onBillingChange={setBilling}
              onShippingChange={setShipping}
              onAddShipping={addShippingAddress}
              onRemoveShipping={removeShippingAddress}
            />

            <SupplierGovProcurementSections
              govProcurement={form.govProcurement}
              vendorCompliance={form.vendorCompliance}
              vendorPerformance={form.vendorPerformance}
              onGovChange={setGov}
              onComplianceChange={setCompliance}
            />

            <SupplierDocumentsSection supplierId={null} disabled />
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.btnAux}
                onClick={() => setContactModalOpen(true)}
                disabled={saving}
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden />
                Contact Details
                {contactCount > 0 ? <span className={styles.badge}>{contactCount}</span> : null}
              </button>
              <button
                type="button"
                className={styles.btnAux}
                onClick={() => setBankModalOpen(true)}
                disabled={saving}
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden />
                Bank Details
                {bankCount > 0 ? <span className={styles.badge}>{bankCount}</span> : null}
              </button>
              <span className={styles.devHint}>Alt+F1 — fill sample data</span>
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </article>
      </section>

      <SupplierContactDetailsModal
        open={contactModalOpen}
        rows={form.supplierContactMatrix}
        onClose={() => setContactModalOpen(false)}
        onSave={(items) => set("supplierContactMatrix", items)}
      />

      <SupplierBankDetailsModal
        open={bankModalOpen}
        rows={form.supplierBankDetails}
        onClose={() => setBankModalOpen(false)}
        onSave={(items) => set("supplierBankDetails", items)}
      />
    </div>
  );
}
