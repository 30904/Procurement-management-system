import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import SupplierContactDetailsModal from "../../components/modals/SupplierContactDetailsModal.jsx";
import SupplierAddressTabs, {
  emptySupplierAddress,
  validateSupplierAddress,
} from "../../components/masters/SupplierAddressTabs.jsx";
import {
  ACTIVE_STATUS_OPTIONS,
  GST_CLASSIFICATION_OPTIONS,
} from "../../config/supplierFormOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createProspectSupplierMasterRequest,
  getProspectSupplierMasterRequest,
  previewProspectRegistrationNoRequest,
  updateProspectSupplierMasterRequest,
} from "../../services/api.js";
import {
  EMPTY_ADDRESS,
  emptyProspectForm,
  prospectDocToForm,
  prospectFormToPayload,
} from "../../utils/prospectSupplierFormState.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const ASSESSMENT_OPTIONS = ["Pending", "In Review", "Approved", "Rejected"];

export default function ProspectSupplierUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeAddressTab, setActiveAddressTab] = useState(0);
  const [form, setForm] = useState(emptyProspectForm());

  const billing = form.supplierBillingAddress[0] || { ...EMPTY_ADDRESS };
  const contactCount = form.supplierContactMatrix?.length ?? 0;

  const { options: supplierCategoryOptions, loading: supplierCategoryLoading } =
    useMasterDataOptions(MASTER_DATA_CATEGORY.SUPPLIER_CATEGORY);
  const { options: paymentTermsOptions, loading: paymentTermsLoading } =
    useMasterDataOptions(MASTER_DATA_CATEGORY.PAYMENT_TERMS);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setBilling(key, value) {
    setForm((prev) => {
      const list = [...(prev.supplierBillingAddress || [{ ...EMPTY_ADDRESS }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, supplierBillingAddress: list };
    });
  }

  useEffect(() => {
    if (!isEdit) {
      let cancelled = false;
      previewProspectRegistrationNoRequest()
        .then((res) => {
          if (!cancelled) {
            setForm((prev) => ({
              ...prev,
              registrationNo: res?.data?.code ?? prev.registrationNo,
            }));
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    getProspectSupplierMasterRequest(id)
      .then((res) => {
        if (!cancelled) setForm(prospectDocToForm(res?.data));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || "Failed to load prospect supplier");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, toast]);

  async function handleSave() {
    if (saving || loading) return;
    if (!form.supplierName.trim()) return toast.error("Vendor Name is required.");
    if (!form.registrationDate) return toast.error("Registration Date is required.");
    if (!form.gstClassification.trim()) return toast.error("GST Classification is required.");
    if (!form.gstin.trim()) return toast.error("GSTIN is required.");

    const addrErr = validateSupplierAddress(billing, "Billing");
    if (addrErr) return toast.error(addrErr);

    setSaving(true);
    try {
      const payload = prospectFormToPayload(form);
      if (isEdit) {
        await updateProspectSupplierMasterRequest(id, payload);
        toast.success("Prospect supplier updated.");
      } else {
        await createProspectSupplierMasterRequest(payload);
        toast.success("Prospect supplier created.");
      }
      navigateWithHubReturn("masters/purchase/prospect-supplier");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save prospect supplier");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="erp-page">
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/purchase/prospect-supplier"
          title={isEdit ? "Edit Prospect Vendor" : "New Prospect Vendor"}
        />
        <p style={{ padding: "1rem" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${styles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase/prospect-supplier"
        title={isEdit ? "Edit Prospect Vendor" : "New Prospect Vendor"}
        onSave={handleSave}
        saving={saving}
      />

      <div className={styles.formGrid}>
        <InputField
          label="Registration No."
          value={form.registrationNo}
          onChange={(v) => set("registrationNo", v)}
          disabled
        />
        <InputField
          label="Registration Date"
          type="date"
          value={form.registrationDate}
          onChange={(v) => set("registrationDate", v)}
          required
        />
        <SelectField
          label="Vendor Category"
          value={form.categoryType}
          onChange={(v) => set("categoryType", v)}
          options={supplierCategoryOptions}
          loading={supplierCategoryLoading}
          placeholder="Select category"
        />
        <InputField
          label="Vendor Name"
          value={form.supplierName}
          onChange={(v) => set("supplierName", v)}
          required
        />
        <SelectField
          label="GST Classification"
          value={form.gstClassification}
          onChange={(v) => set("gstClassification", v)}
          options={GST_CLASSIFICATION_OPTIONS}
          required
        />
        <InputField
          label="GSTIN"
          value={form.gstin}
          onChange={(v) => set("gstin", v)}
          required
        />
        <SelectField
          label="Payment Terms"
          value={form.supplierPaymentTerms}
          onChange={(v) => set("supplierPaymentTerms", v)}
          options={paymentTermsOptions}
          loading={paymentTermsLoading}
          placeholder="Select payment terms"
        />
        <SelectField
          label="Status"
          value={form.isSupplierActive}
          onChange={(v) => set("isSupplierActive", v)}
          options={ACTIVE_STATUS_OPTIONS}
        />
        <SelectField
          label="Assessment Status"
          value={form.assessmentStatus}
          onChange={(v) => set("assessmentStatus", v)}
          options={ASSESSMENT_OPTIONS.map((v) => ({ value: v, label: v }))}
        />
        <InputField
          label="Assessed By"
          value={form.assessedBy}
          onChange={(v) => set("assessedBy", v)}
        />
        <InputField
          label="Assessed At"
          type="date"
          value={form.assessedAt}
          onChange={(v) => set("assessedAt", v)}
        />
        <InputField
          label="Assessment Notes"
          value={form.assessmentNotes}
          onChange={(v) => set("assessmentNotes", v)}
          multiline
          className={styles.fullWidth}
        />
      </div>

      <SupplierAddressTabs
        billing={billing}
        shippingAddresses={[]}
        activeTab={activeAddressTab}
        onTabChange={setActiveAddressTab}
        onBillingChange={setBilling}
        onShippingChange={() => {}}
        onAddShipping={() => {}}
        onRemoveShipping={() => {}}
        showShipping={false}
      />

      <div className={toolbarStyles.toolbarRow} style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="erp-btn erp-btn--secondary"
          onClick={() => setContactModalOpen(true)}
        >
          <Plus size={16} />
          Contact Details ({contactCount})
        </button>
      </div>

      <SupplierContactDetailsModal
        open={contactModalOpen}
        contacts={form.supplierContactMatrix}
        onClose={() => setContactModalOpen(false)}
        onSave={(contacts) => {
          setForm((prev) => ({ ...prev, supplierContactMatrix: contacts }));
          setContactModalOpen(false);
        }}
      />
    </div>
  );
}
