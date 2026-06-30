import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import LogisticsContactDetailsModal from "../../components/modals/LogisticsContactDetailsModal.jsx";
import LogisticsBankDetailsModal from "../../components/modals/LogisticsBankDetailsModal.jsx";
import LogisticsVehicleDetailsModal from "../../components/modals/LogisticsVehicleDetailsModal.jsx";
import { ACTIVE_STATUS_OPTIONS, CURRENCY_OPTIONS, GST_CLASSIFICATION_OPTIONS } from "../../config/supplierFormOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import { getLogisticsMasterRequest, updateLogisticsMasterRequest } from "../../services/api.js";
import { EMPTY_ADDRESS, logisticsDocToForm, logisticsFormToPayload, logisticsCategoryDisplayLabel, resolveLogisticsCategoryValue } from "../../utils/logisticsFormState.js";
import {
  APPROVAL_STATUS_OPTIONS,
  EMPTY_LOGISTICS_MPBCDC,
  SERVICE_COVERAGE_OPTIONS,
  TRANSPORT_CATEGORY_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/mpbcdcMasterOptions.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function LogisticsEditPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [revNumber, setRevNumber] = useState(0);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [form, setForm] = useState(null);

  const { options: categoryOptions, loading: categoryLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.LSP_CATEGORY);
  const { options: paymentTermsOptions, loading: paymentTermsLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.PAYMENT_TERMS);
  const { options: freightServiceTypeOptions, loading: freightServiceTypeLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.FREIGHT_SERVICE_TYPE);
  const { options: rcmOptions, loading: rcmLoading } = useMasterDataOptions(MASTER_DATA_CATEGORY.RCM_APPLICABILITY);
  const categoryLabel = useMemo(() => logisticsCategoryDisplayLabel(form ?? {}, categoryOptions), [form, categoryOptions]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getLogisticsMasterRequest(id);
        if (cancelled) return;
        const doc = res?.data;
        const mapped = logisticsDocToForm(doc);
        setForm({ ...mapped, categoryType: resolveLogisticsCategoryValue(mapped.categoryType, categoryOptions) });
        setRevNumber(Number(doc?.revNumber || 0));
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load logistics");
          navigateWithHubReturn("masters/purchase/logistics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, navigateWithHubReturn, toast, categoryOptions]);

  function set(key, value) { setForm((prev) => (prev ? { ...prev, [key]: value } : prev)); }
  function setMpbcdc(key, value) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mpbcdcLogistics: { ...(prev.mpbcdcLogistics || EMPTY_LOGISTICS_MPBCDC), [key]: value },
      };
    });
  }
  function setAddress(key, value) {
    setForm((prev) => {
      if (!prev) return prev;
      const list = [...(prev.lspAddress || [{ ...EMPTY_ADDRESS }])];
      list[0] = { ...list[0], [key]: value };
      return { ...prev, lspAddress: list };
    });
  }

  async function submitUpdate(payload) {
    setSaving(true);
    try {
      const res = await updateLogisticsMasterRequest(id, payload);
      const updatedRev = Number(res?.data?.revNumber ?? revNumber);
      toast[updatedRev > revNumber ? "success" : "info"](updatedRev > revNumber ? "Logistics updated with revision details." : "No changes detected — logistics was not updated.");
      navigateWithHubReturn("masters/purchase/logistics");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update logistics");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (saving || !form) return;
    if (!form.lspNameLegalEntity.trim()) return toast.error("LSP Name is required.");
    if (!form.gstClassification.trim()) return toast.error("GST Classification is required.");
    if (!form.gstin.trim()) return toast.error("GSTIN is required.");
    if (!form.lspCIN.trim()) return toast.error("PAN Card No. is required.");
    if (!form.rcmApplicability.trim()) return toast.error("RCM Applicability is required.");
    if (!form.lspCurrency.trim()) return toast.error("Currency is required.");
    if (!form.lspPaymentTerms.trim()) return toast.error("Payment Terms are required.");
    if (!form.freightServiceType.trim()) return toast.error("Type of Freight Service is required.");
    const payload = logisticsFormToPayload(form);
    setPendingPayload(payload);
    setRevisionModalOpen(true);
  }

  if (loading || !form) return <div className={`erp-page ${toolbarStyles.page}`}><p className={styles.loading}>Loading logistics…</p></div>;
  const address = form.lspAddress?.[0] || { ...EMPTY_ADDRESS };

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase"
        listSegment="masters/purchase/logistics"
        listTitle="Logistics Summary"
        formTitle="Edit Logistics"
      />
      <section className={styles.wrap}><article className={styles.card}><div className="sc-modal-bar" />
        <div className={styles.cardBody}>
          <div className="sc-field-grid">
            <InputField label="LSP Category" required value={categoryLoading ? "Loading…" : categoryLabel} locked />
            <InputField label="LSP Code" required value={form.lspCode} locked />
            <InputField label="LSP Name (Legal Entity)" required value={form.lspNameLegalEntity} onChange={(v) => set("lspNameLegalEntity", v)} />
            <InputField label="LSP Nick Name" value={form.lspNickName} onChange={(v) => set("lspNickName", v)} />
            <SelectField label="GST Classification" required options={GST_CLASSIFICATION_OPTIONS} value={form.gstClassification} onChange={(v) => set("gstClassification", v)} />
            <InputField label="GSTIN" required value={form.gstin} onChange={(v) => set("gstin", v.toUpperCase())} />
            <InputField label="PAN Card No." required value={form.lspCIN} onChange={(v) => set("lspCIN", v.toUpperCase())} />
            <SelectField label="RCM Applicability" required options={rcmOptions} value={form.rcmApplicability} onChange={(v) => set("rcmApplicability", v)} disabled={rcmLoading} />
            <SelectField label="Currency" required options={CURRENCY_OPTIONS} value={form.lspCurrency} onChange={(v) => set("lspCurrency", v)} />
            <SelectField label="Payment Terms" required options={paymentTermsOptions} value={form.lspPaymentTerms} onChange={(v) => set("lspPaymentTerms", v)} disabled={paymentTermsLoading} />
            <SelectField label="Type of Freight Service" required options={freightServiceTypeOptions} value={form.freightServiceType} onChange={(v) => set("freightServiceType", v)} disabled={freightServiceTypeLoading} />
            <SelectField label="Status" required options={ACTIVE_STATUS_OPTIONS} value={form.isLspActive} onChange={(v) => set("isLspActive", v)} />
          </div>
          <hr className={styles.sectionRule} />
          <h2 className={styles.sectionTitle}>Primary Address</h2>
          <div className="sc-field-grid">
            <InputField label="Address Line 1" required value={address.line1} onChange={(v) => setAddress("line1", v)} />
            <InputField label="Address Line 2" value={address.line2} onChange={(v) => setAddress("line2", v)} />
            <InputField label="Address Line 3" value={address.line3} onChange={(v) => setAddress("line3", v)} />
            <InputField label="Address Line 4" value={address.line4} onChange={(v) => setAddress("line4", v)} />
            <InputField label="City" required value={address.city} onChange={(v) => setAddress("city", v)} />
            <InputField label="State" required value={address.state} onChange={(v) => setAddress("state", v)} />
            <InputField label="District" value={address.district} onChange={(v) => setAddress("district", v)} />
            <InputField label="Pin Code" value={address.pinCode} onChange={(v) => setAddress("pinCode", v)} />
            <InputField label="Country" required value={address.country} onChange={(v) => setAddress("country", v)} />
            <InputField label="Zone" value={address.zone} onChange={(v) => setAddress("zone", v)} />
          </div>
          <hr className={styles.sectionRule} />
          <h2 className={styles.sectionTitle}>MPBCDC Logistics</h2>
          <div className="sc-field-grid">
            <SelectField
              label="Transport Category"
              options={TRANSPORT_CATEGORY_OPTIONS}
              value={form.mpbcdcLogistics?.transportCategory || ""}
              onChange={(v) => setMpbcdc("transportCategory", v)}
            />
            <SelectField
              label="Service Coverage"
              options={SERVICE_COVERAGE_OPTIONS}
              value={form.mpbcdcLogistics?.serviceCoverage || ""}
              onChange={(v) => setMpbcdc("serviceCoverage", v)}
            />
            <SelectField
              label="GeM Registered"
              options={YES_NO_OPTIONS}
              value={form.mpbcdcLogistics?.gemRegistered || ""}
              onChange={(v) => setMpbcdc("gemRegistered", v)}
            />
            <SelectField
              label="Approval Status"
              options={APPROVAL_STATUS_OPTIONS}
              value={form.mpbcdcLogistics?.approvalStatus || "Draft"}
              onChange={(v) => setMpbcdc("approvalStatus", v)}
            />
          </div>
        </div>
        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <button type="button" className={styles.btnAux} onClick={() => setContactModalOpen(true)} disabled={saving}><Plus size={16} strokeWidth={2.5} aria-hidden />Contact Details</button>
            <button type="button" className={styles.btnAux} onClick={() => setBankModalOpen(true)} disabled={saving}><Plus size={16} strokeWidth={2.5} aria-hidden />Bank Details</button>
            <button type="button" className={styles.btnAux} onClick={() => setVehicleModalOpen(true)} disabled={saving}><Plus size={16} strokeWidth={2.5} aria-hidden />Vehicle Details</button>
          </div>
          <div className={styles.footerRight}><button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>
        </footer>
      </article></section>
      <LogisticsContactDetailsModal open={contactModalOpen} rows={form.lspContactMatrix} onClose={() => setContactModalOpen(false)} onSave={(items) => set("lspContactMatrix", items)} />
      <LogisticsBankDetailsModal open={bankModalOpen} rows={form.lspBankDetails} onClose={() => setBankModalOpen(false)} onSave={(items) => set("lspBankDetails", items)} />
      <LogisticsVehicleDetailsModal open={vehicleModalOpen} rows={form.lspVehicleDetails} onClose={() => setVehicleModalOpen(false)} onSave={(items) => set("lspVehicleDetails", items)} />
      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={revNumber + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => { if (!saving) { setRevisionModalOpen(false); setPendingPayload(null); } }}
        onSave={async (revisionInfo) => {
          if (!pendingPayload) return setRevisionModalOpen(false);
          try {
            await submitUpdate({ ...pendingPayload, revisionInfo });
            setRevisionModalOpen(false);
            setPendingPayload(null);
          } catch { /* handled */ }
        }}
      />
    </div>
  );
}
