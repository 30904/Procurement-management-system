import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import SupplierContactDetailsModal from "../../components/modals/SupplierContactDetailsModal.jsx";
import SupplierBankDetailsModal from "../../components/modals/SupplierBankDetailsModal.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
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
import { getSupplierMasterRequest, updateSupplierMasterRequest } from "../../services/api.js";
import SupplierGovProcurementSections from "../../components/masters/SupplierGovProcurementSections.jsx";
import SupplierDocumentsSection from "../../components/masters/SupplierDocumentsSection.jsx";
import {
  supplierCategoryDisplayLabel,
  supplierDocToForm,
  supplierFormToPayload,
  resolveSupplierCategoryValue,
  EMPTY_GOV_PROCUREMENT,
  EMPTY_VENDOR_COMPLIANCE,
} from "../../utils/supplierFormState.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function SupplierEditPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState(0);
  const [revNumber, setRevNumber] = useState(0);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [form, setForm] = useState(null);

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

  const categoryLabel = useMemo(
    () => supplierCategoryDisplayLabel(form ?? {}, supplierCategoryOptions),
    [form, supplierCategoryOptions]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getSupplierMasterRequest(id);
        if (cancelled) return;
        const doc = res?.data;
        const mapped = supplierDocToForm(doc);
        setForm({
          ...mapped,
          categoryType: resolveSupplierCategoryValue(
            mapped.categoryType || doc?.supplierPurchaseType,
            supplierCategoryOptions
          ),
          supplierPurchaseType: doc?.supplierPurchaseType ?? mapped.supplierPurchaseType,
        });
        setRevNumber(Number(doc?.revNumber || 0));
        setActiveAddressTab(0);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load supplier");
          navigateWithHubReturn("masters/purchase/supplier");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigateWithHubReturn, toast]);

  useEffect(() => {
    if (!form || !supplierCategoryOptions.length) return;
    const resolved = resolveSupplierCategoryValue(
      form.categoryType || form.supplierPurchaseType,
      supplierCategoryOptions
    );
    if (resolved && resolved !== form.categoryType) {
      setForm((prev) => (prev ? { ...prev, categoryType: resolved } : prev));
    }
  }, [supplierCategoryOptions]);

  function set(key, value) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setGov(key, value) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            govProcurement: { ...(prev.govProcurement || EMPTY_GOV_PROCUREMENT), [key]: value },
          }
        : prev
    );
  }

  function setCompliance(key, value) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            vendorCompliance: { ...(prev.vendorCompliance || EMPTY_VENDOR_COMPLIANCE), [key]: value },
          }
        : prev
    );
  }

  function setBilling(key, value) {
    setForm((prev) => {
      if (!prev) return prev;
      const list = [...(prev.supplierBillingAddress || [{ ...emptySupplierAddress() }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, supplierBillingAddress: list };
    });
  }

  function setShipping(shippingIndex, key, value) {
    setForm((prev) => {
      if (!prev) return prev;
      const list = [...(prev.supplierShippingAddress || [])];
      list[shippingIndex] = { ...(list[shippingIndex] || emptySupplierAddress()), [key]: value };
      return { ...prev, supplierShippingAddress: list };
    });
  }

  function addShippingAddress() {
    setForm((prev) => {
      if (!prev) return prev;
      const nextList = [...(prev.supplierShippingAddress || []), emptySupplierAddress()];
      setActiveAddressTab(nextList.length);
      return { ...prev, supplierShippingAddress: nextList };
    });
  }

  function removeShippingAddress(shippingIndex) {
    setForm((prev) => {
      if (!prev) return prev;
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

  function buildPayload() {
    const filledShipping = (form.supplierShippingAddress || []).filter((a) => !isSupplierAddressEmpty(a));
    return supplierFormToPayload({
      ...form,
      supplierCode: form.supplierCode,
      categoryType: form.categoryType,
      supplierPurchaseType: categoryLabel || form.supplierPurchaseType,
      supplierCompanyType: form.supplierCompanyType || "PVT LTD",
      supplierType: form.supplierType || "Manufacturer",
      supplierShippingAddress: filledShipping,
    });
  }

  function validateForm() {
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

    const billing = form.supplierBillingAddress[0] || emptySupplierAddress();
    const billingErrors = validateSupplierAddress(billing, "Primary Address (Billing)");
    if (billingErrors.length) return toast.error(billingErrors[0]);

    const filledShipping = (form.supplierShippingAddress || []).filter((a) => !isSupplierAddressEmpty(a));
    for (let i = 0; i < filledShipping.length; i += 1) {
      const shipErrors = validateSupplierAddress(filledShipping[i], `Address ${i + 2} (Shipping)`);
      if (shipErrors.length) return toast.error(shipErrors[0]);
    }
    return true;
  }

  async function submitUpdate(payload) {
    setSaving(true);
    try {
      const res = await updateSupplierMasterRequest(id, payload);
      const updatedRev = Number(res?.data?.revNumber ?? revNumber);
      if (updatedRev > revNumber) {
        toast.success("Supplier updated with revision details.");
      } else {
        toast.info("No changes detected — supplier was not updated.");
      }
      navigateWithHubReturn("masters/purchase/supplier");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update supplier");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (saving || !form) return;
    if (!validateForm()) return;

    const payload = buildPayload();
    if (!payload.revisionInfo) {
      setPendingPayload(payload);
      setRevisionModalOpen(true);
      return;
    }
    await submitUpdate(payload);
  }

  async function handleRevisionSave(revisionInfo) {
    if (!pendingPayload) {
      setRevisionModalOpen(false);
      return;
    }
    try {
      await submitUpdate({ ...pendingPayload, revisionInfo });
      setRevisionModalOpen(false);
      setPendingPayload(null);
    } catch {
      /* toast shown in submitUpdate */
    }
  }

  if (loading || !form) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p className={styles.loading}>Loading supplier…</p>
      </div>
    );
  }

  const billing = form.supplierBillingAddress[0] || emptySupplierAddress();
  const shippingAddresses = form.supplierShippingAddress ?? [];
  const contactCount = form.supplierContactMatrix?.length ?? 0;
  const bankCount = form.supplierBankDetails?.length ?? 0;

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase"
        listSegment="masters/purchase/supplier"
        listTitle="Vendor Summary"
        formTitle="Edit Vendor"
      />

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />

          <div className={styles.cardBody}>
            <div className="sc-field-grid">
              <InputField
                label="Vendor Category"
                required
                value={supplierCategoryLoading ? "Loading…" : categoryLabel}
                locked
              />
              <InputField label="Vendor Code" required value={form.supplierCode} locked />
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

            <SupplierDocumentsSection supplierId={id} disabled={false} />
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

      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={revNumber + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          if (!saving) {
            setRevisionModalOpen(false);
            setPendingPayload(null);
          }
        }}
        onSave={handleRevisionSave}
      />
    </div>
  );
}
