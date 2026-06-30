import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import ItemSupplierLookupModal from "../../components/modals/ItemSupplierLookupModal.jsx";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createSourceListMasterRequest,
  getNextSourceListCodeRequest,
  getSourceListMasterRequest,
  listItemMasterRequest,
  listServiceMasterR1Request,
  listSupplierMasterRequest,
  updateSourceListMasterRequest,
} from "../../services/api.js";
import {
  ACTIVE_INACTIVE_OPTIONS,
  emptySourceListForm,
  SOURCE_ITEM_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  sourceListDocToForm,
  sourceListFormToPayload,
  YES_NO_OPTIONS,
} from "../../utils/sourceListFormState.js";
import styles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function SourceListUpsertPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [form, setForm] = useState(emptySourceListForm());
  const [itemRows, setItemRows] = useState([]);
  const [supplierRows, setSupplierRows] = useState([]);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const itemOptions = useMemo(() => {
    if (form.itemType === "Service") {
      return itemRows.map((row) => ({
        value: String(row._id || row.id),
        label: `${row.serviceId || ""} — ${row.serviceName || ""}`.trim(),
      }));
    }
    if (form.itemType === "Material") {
      return itemRows.map((row) => ({
        value: String(row._id || row.id),
        label: `${row.itemNo || ""} — ${row.itemName || ""}`.trim(),
      }));
    }
    return [];
  }, [form.itemType, itemRows]);

  const fetchItems = useCallback(async (itemType) => {
    try {
      if (itemType === "Service") {
        const res = await listServiceMasterR1Request();
        setItemRows(Array.isArray(res?.data) ? res.data : []);
      } else if (itemType === "Material") {
        const res = await listItemMasterRequest();
        setItemRows(Array.isArray(res?.data) ? res.data : []);
      } else {
        setItemRows([]);
      }
    } catch {
      setItemRows([]);
    }
  }, []);

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
    fetchItems(form.itemType);
  }, [form.itemType, fetchItems]);

  useEffect(() => {
    if (isEdit) return undefined;
    let cancelled = false;
    getNextSourceListCodeRequest()
      .then((res) => {
        if (!cancelled) {
          setForm((prev) => ({
            ...prev,
            sourceListCode: res?.data?.sourceListCode ?? prev.sourceListCode,
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
    getSourceListMasterRequest(id)
      .then((res) => {
        if (!cancelled) setForm(sourceListDocToForm(res?.data));
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.message || "Failed to load source list record");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, toast]);

  function handleItemTypeChange(itemType) {
    setForm((prev) => ({
      ...prev,
      itemType,
      itemId: "",
      itemCode: "",
      itemName: "",
    }));
  }

  function handleItemChange(itemId) {
    const row = itemRows.find((r) => String(r._id || r.id) === String(itemId));
    if (!row) {
      setForm((prev) => ({ ...prev, itemId, itemCode: "", itemName: "" }));
      return;
    }
    if (form.itemType === "Service") {
      setForm((prev) => ({
        ...prev,
        itemId,
        itemCode: row.serviceId || "",
        itemName: row.serviceName || "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        itemId,
        itemCode: row.itemNo || "",
        itemName: row.itemName || "",
      }));
    }
  }

  async function handleSave() {
    if (saving || loading) return;
    if (!form.sourceListCode.trim()) return toast.error("Source List Code is required.");

    setSaving(true);
    try {
      const payload = sourceListFormToPayload(form);
      if (isEdit) {
        await updateSourceListMasterRequest(id, payload);
        toast.success("Source list record updated.");
      } else {
        await createSourceListMasterRequest(payload);
        toast.success("Source list record created.");
      }
      navigateWithHubReturn("masters/purchase/source-list");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save source list record");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/purchase/source-list"
          title={isEdit ? "Edit Source List" : "New Source List"}
        />
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${styles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase/source-list"
        title={isEdit ? "Edit Source List" : "New Source List"}
        onSave={handleSave}
        saving={saving}
      />

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <div className="sc-field-grid">
              <InputField
                label="Source List Code"
                value={form.sourceListCode}
                locked
                placeholder="Auto-generated"
              />
              <SelectField
                label="Material/Service Type"
                options={SOURCE_ITEM_TYPE_OPTIONS}
                value={form.itemType}
                onChange={handleItemTypeChange}
                placeholder="Select type"
              />
              <SelectField
                label="Material/Service"
                options={itemOptions}
                value={form.itemId}
                onChange={handleItemChange}
                disabled={!form.itemType}
                placeholder={form.itemType ? "Select material/service" : "Select type first"}
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
              <SelectField
                label="Source Type"
                options={SOURCE_TYPE_OPTIONS}
                value={form.sourceType}
                onChange={(v) => set("sourceType", v)}
              />
              <SelectField
                label="Preferred Vendor"
                options={YES_NO_OPTIONS}
                value={form.isPreferredVendor}
                onChange={(v) => set("isPreferredVendor", v)}
              />
              <DateField
                label="Valid From"
                value={form.validFrom}
                onChange={(v) => set("validFrom", v)}
              />
              <DateField
                label="Valid To"
                value={form.validTo}
                onChange={(v) => set("validTo", v)}
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
