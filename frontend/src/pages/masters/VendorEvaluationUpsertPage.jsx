import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import ItemSupplierLookupModal from "../../components/modals/ItemSupplierLookupModal.jsx";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createVendorEvaluationMasterRequest,
  getNextVendorEvaluationCodeRequest,
  getVendorEvaluationMasterRequest,
  listSupplierMasterRequest,
  updateVendorEvaluationMasterRequest,
} from "../../services/api.js";
import {
  ACTIVE_INACTIVE_OPTIONS,
  emptyVendorEvaluationForm,
  vendorEvaluationDocToForm,
  vendorEvaluationFormToPayload,
} from "../../utils/vendorEvaluationFormState.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function VendorEvaluationUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [form, setForm] = useState(emptyVendorEvaluationForm());
  const [supplierRows, setSupplierRows] = useState([]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await listSupplierMasterRequest();
      setSupplierRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSupplierRows([]);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    if (isEdit) return undefined;
    let cancelled = false;
    getNextVendorEvaluationCodeRequest()
      .then((res) => {
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            evaluationCode: res?.data?.evaluationCode ?? prev.evaluationCode,
          }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    setLoading(true);
    getVendorEvaluationMasterRequest(id)
      .then((res) => {
        if (!cancelled) setForm(vendorEvaluationDocToForm(res?.data));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || "Failed to load vendor evaluation record");
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
    if (!form.evaluationCode.trim()) return toast.error("Evaluation Code is required.");

    setSaving(true);
    try {
      const payload = vendorEvaluationFormToPayload(form);
      if (isEdit) {
        await updateVendorEvaluationMasterRequest(id, payload);
        toast.success("Vendor evaluation record updated.");
      } else {
        await createVendorEvaluationMasterRequest(payload);
        toast.success("Vendor evaluation record created.");
      }
      navigateWithHubReturn("masters/purchase/vendor-evaluation");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save vendor evaluation record");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/purchase/vendor-evaluation"
          title={isEdit ? "Edit Vendor Evaluation" : "New Vendor Evaluation"}
        />
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${styles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase/vendor-evaluation"
        title={isEdit ? "Edit Vendor Evaluation" : "New Vendor Evaluation"}
        onSave={handleSave}
        saving={saving}
      />

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <div className="sc-field-grid">
              <InputField
                label="Evaluation Code"
                value={form.evaluationCode}
                locked
                placeholder="Auto-generated"
              />
              <div className={styles.fieldWithBtn}>
                <InputField
                  label="Vendor"
                  value={form.supplierName}
                  locked
                  placeholder="Select vendor"
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setSupplierLookupOpen(true)}
                  aria-label="Vendor lookup"
                >
                  <Search size={16} strokeWidth={2.25} />
                </button>
              </div>
              <InputField
                label="Price Weight"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.priceWeight}
                onChange={(v) => set("priceWeight", v)}
              />
              <InputField
                label="Delivery Weight"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.deliveryWeight}
                onChange={(v) => set("deliveryWeight", v)}
              />
              <InputField
                label="Quality Weight"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.qualityWeight}
                onChange={(v) => set("qualityWeight", v)}
              />
              <InputField
                label="Compliance Weight"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.complianceWeight}
                onChange={(v) => set("complianceWeight", v)}
              />
              <InputField
                label="Minimum Score"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.minimumScore}
                onChange={(v) => set("minimumScore", v)}
              />
              <SelectField
                label="Status"
                options={ACTIVE_INACTIVE_OPTIONS}
                value={form.status}
                onChange={(v) => set("status", v)}
              />
            </div>
          </div>
        </article>
      </section>

      <ItemSupplierLookupModal
        open={supplierLookupOpen}
        supplierRows={supplierRows}
        selectedSupplierId={form.supplierId}
        onClose={() => setSupplierLookupOpen(false)}
        onApply={(supplier) => {
          setForm((prev) => ({
            ...prev,
            supplierId: String(supplier._id || supplier.id),
            supplierCode: supplier.supplierCode || "",
            supplierName: supplier.supplierName || "",
          }));
          setSupplierLookupOpen(false);
        }}
      />
    </div>
  );
}
