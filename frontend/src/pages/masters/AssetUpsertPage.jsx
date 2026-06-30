import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import { appPath } from "../../config/navigation.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useLocationHierarchy } from "../../hooks/useLocationHierarchy.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import ItemHsnLookupModal from "../../components/modals/ItemHsnLookupModal.jsx";
import ItemSupplierLookupModal from "../../components/modals/ItemSupplierLookupModal.jsx";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  createAssetMasterRequest,
  getAssetMasterRequest,
  listHsnPMasterRequest,
  listSupplierMasterRequest,
  previewAssetCodeRequest,
  updateAssetMasterRequest,
} from "../../services/api.js";
import {
  ASSET_CLASSIFICATION_OPTIONS,
  ASSET_LIFECYCLE_STATUS_OPTIONS,
  EMPTY_ASSET_PROCUREMENT,
  PROCUREMENT_MODE_OPTIONS,
} from "../../config/mpbcdcMasterOptions.js";
import styles from "./AssetUpsertPage.module.css";
import sectionStyles from "./SupplierCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const STATUS_OPTIONS = ["Active", "Inactive"];

function todayInputDate() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function buildInitialForm() {
  const today = todayInputDate();
  return {
    assetNo: "",
    assetCategory: "",
    assetName: "",
    assetDescription: "",
    uom: "",
    hsnCode: "",
    gstRate: "",
    lifeExpectancyYears: "",
    supplierId: "",
    supplierCode: "",
    supplierName: "",
    manufacturerName: "",
    mpnModelNo: "",
    purchaseRateExGst: "",
    assetUniqueId: "",
    acquisitionDate: today,
    capitalisationDate: today,
    inOperationDate: "",
    manufacturingYear: "",
    ratedPowerKw: "",
    locationId: "",
    subLocationId: "",
    status: "Active",
    procurementTracking: { ...EMPTY_ASSET_PROCUREMENT },
  };
}

function mapProcurementTracking(doc) {
  const p = doc?.procurementTracking || {};
  return {
    assetClassification: p.assetClassification ?? "",
    procurementMode: p.procurementMode ?? "",
    purchaseReference: p.purchaseReference ?? "",
    poReference: p.poReference ?? "",
    assetLifecycleStatus: p.assetLifecycleStatus ?? "",
  };
}

function formatRate(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function normalizeAssetRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
    assetNo: doc?.assetNo ?? "",
    assetCategory: doc?.assetCategory ?? "",
    assetName: doc?.assetName ?? "",
    assetDescription: doc?.assetDescription ?? "",
    uom: doc?.uom ?? "",
    hsnCode: doc?.hsnCode ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    lifeExpectancyYears: doc?.lifeExpectancyYears ?? "",
    supplierId: doc?.supplierId != null ? String(doc.supplierId) : "",
    supplierCode: doc?.supplierCode ?? "",
    supplierName: doc?.supplierName ?? "",
    manufacturerName: doc?.manufacturerName ?? "",
    mpnModelNo: doc?.mpnModelNo ?? "",
    purchaseRateExGst: doc?.purchaseRateExGst ?? "",
    assetUniqueId: doc?.assetUniqueId ?? "",
    acquisitionDate: toInputDate(doc?.acquisitionDate),
    capitalisationDate: toInputDate(doc?.capitalisationDate),
    inOperationDate: toInputDate(doc?.inOperationDate),
    manufacturingYear: doc?.manufacturingYear ?? "",
    ratedPowerKw: doc?.ratedPowerKw ?? "",
    locationId: doc?.locationId != null ? String(doc.locationId) : "",
    subLocationId: doc?.subLocationId != null ? String(doc.subLocationId) : "",
    status: doc?.status || "Active",
    revNumber: Number(doc?.revNumber ?? 0),
    procurementTracking: mapProcurementTracking(doc),
  };
}

function normalizeHsnRow(doc) {
  return {
    ...doc,
    _id: doc?._id != null ? String(doc._id) : String(doc?.id ?? doc?.hsnCode ?? ""),
    id: doc?._id != null ? String(doc._id) : String(doc?.id ?? doc?.hsnCode ?? ""),
    hsnCode: doc?.hsnCode ?? "",
    description: doc?.description ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    status: doc?.status || "Active",
  };
}

function formToPayload(form) {
  return {
    assetNo: form.assetNo,
    assetCategory: form.assetCategory,
    assetName: form.assetName.trim(),
    assetDescription: form.assetDescription.trim(),
    uom: form.uom,
    hsnCode: form.hsnCode,
    gstRate: Number(form.gstRate || 0),
    lifeExpectancyYears: Number(form.lifeExpectancyYears || 0),
    supplierId: form.supplierId || undefined,
    manufacturerName: form.manufacturerName.trim(),
    mpnModelNo: form.mpnModelNo.trim(),
    purchaseRateExGst: form.purchaseRateExGst === "" ? 0 : Number(form.purchaseRateExGst),
    assetUniqueId: form.assetUniqueId.trim(),
    acquisitionDate: form.acquisitionDate,
    capitalisationDate: form.capitalisationDate,
    inOperationDate: form.inOperationDate || undefined,
    manufacturingYear: form.manufacturingYear === "" ? undefined : Number(form.manufacturingYear),
    ratedPowerKw: form.ratedPowerKw === "" ? undefined : Number(form.ratedPowerKw),
    locationId: form.locationId || undefined,
    subLocationId: form.subLocationId || undefined,
    status: form.status,
    procurementTracking: {
      assetClassification: form.procurementTracking?.assetClassification || "",
      procurementMode: form.procurementTracking?.procurementMode || "",
      purchaseReference: form.procurementTracking?.purchaseReference?.trim() || "",
      poReference: form.procurementTracking?.poReference?.trim() || "",
      assetLifecycleStatus: form.procurementTracking?.assetLifecycleStatus || "",
    },
  };
}

export default function AssetUpsertPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const [form, setForm] = useState(buildInitialForm);
  const [editRow, setEditRow] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [hsnLookupOpen, setHsnLookupOpen] = useState(false);
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [hsnRows, setHsnRows] = useState([]);
  const [supplierRows, setSupplierRows] = useState([]);
  const [codePreviewLoading, setCodePreviewLoading] = useState(false);

  const { activeLocationId } = useLocationScope();
  const { options: assetCategoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.ASSET_CATEGORY);
  const { options: uomOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.UOM);
  const {
    locationOptions,
    subLocationOptions,
    loadingLocations,
    loadingChildren,
  } = useLocationHierarchy(form.locationId);

  const hsnMap = useMemo(() => {
    const map = new Map();
    hsnRows.forEach((row) => map.set(String(row.hsnCode), row));
    return map;
  }, [hsnRows]);

  const hsnOptions = useMemo(
    () =>
      hsnRows.map((h) => ({
        value: h.hsnCode,
        label: h.description ? `${h.hsnCode} — ${h.description}` : h.hsnCode,
      })),
    [hsnRows]
  );

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setProcurementTracking(key, value) {
    setForm((prev) => ({
      ...prev,
      procurementTracking: { ...(prev.procurementTracking || EMPTY_ASSET_PROCUREMENT), [key]: value },
    }));
  }

  useEffect(() => {
    if (!isEdit && activeLocationId && !form.locationId) {
      setField("locationId", activeLocationId);
    }
  }, [isEdit, activeLocationId, form.locationId]);

  useEffect(() => {
    if (!isEdit || form.locationId || !editRow?.assetLocation || !locationOptions.length) return;
    const legacy = String(editRow.assetLocation).trim();
    const match = locationOptions.find(
      (o) => o.label === legacy || o.label.includes(legacy) || legacy.includes(o.label.split("·").pop()?.trim() || "")
    );
    if (match) setField("locationId", match.value);
  }, [isEdit, editRow, locationOptions, form.locationId]);

  useEffect(() => {
    if (!form.locationId || form.subLocationId || !editRow?.subLocation || !subLocationOptions.length) return;
    const legacy = String(editRow.subLocation).trim();
    const match = subLocationOptions.find(
      (o) => o.label === legacy || o.label.includes(legacy) || legacy.includes(o.label)
    );
    if (match) setField("subLocationId", match.value);
  }, [editRow, subLocationOptions, form.locationId, form.subLocationId]);

  function handleLocationChange(locationId) {
    setForm((prev) => ({
      ...prev,
      locationId,
      subLocationId: "",
    }));
  }

  const subLocationPlaceholder = useMemo(() => {
    if (!form.locationId) return "Select location first";
    if (loadingChildren) return "Loading…";
    if (subLocationOptions.length === 0) {
      return "No sub-locations (add in Company Setup)";
    }
    return "Select sub-location";
  }, [form.locationId, loadingChildren, subLocationOptions.length]);

  const fetchHsn = useCallback(async () => {
    try {
      const res = await listHsnPMasterRequest();
      setHsnRows((Array.isArray(res?.data) ? res.data : []).map(normalizeHsnRow));
    } catch {
      setHsnRows([]);
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
    fetchHsn();
    fetchSuppliers();
  }, [fetchHsn, fetchSuppliers]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    async function loadAsset() {
      setLoading(true);
      try {
        const res = await getAssetMasterRequest(id);
        if (cancelled) return;
        const doc = normalizeAssetRow(res?.data || {});
        setEditRow(doc);
        setForm({ ...buildInitialForm(), ...doc, gstRate: formatRate(doc.gstRate || 0) });
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load asset");
          navigate(appPath("masters/purchase/asset-master-capitalised"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAsset();
    return () => { cancelled = true; };
  }, [isEdit, id, navigate, toast]);

  useEffect(() => {
    if (isEdit) return undefined;
    const assetCategory = form.assetCategory?.trim();
    if (!assetCategory) {
      setForm((prev) => (prev.assetNo ? { ...prev, assetNo: "" } : prev));
      return undefined;
    }

    let cancelled = false;
    setCodePreviewLoading(true);
    previewAssetCodeRequest(assetCategory)
      .then((res) => {
        if (!cancelled) setForm((prev) => ({ ...prev, assetNo: res?.data?.code || "" }));
      })
      .catch(() => {
        if (!cancelled) setForm((prev) => ({ ...prev, assetNo: "" }));
      })
      .finally(() => {
        if (!cancelled) setCodePreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, form.assetCategory]);

  const handleHsnChange = (hsnCode) => {
    const hsn = hsnMap.get(String(hsnCode));
    setForm((prev) => ({ ...prev, hsnCode, gstRate: hsn ? formatRate(hsn.gstRate) : "" }));
  };

  const handleReset = () => {
    if (isEdit && editRow) {
      setForm({ ...buildInitialForm(), ...normalizeAssetRow(editRow), gstRate: formatRate(editRow.gstRate || 0) });
    } else {
      setForm(buildInitialForm());
    }
    toast.info("Form reset.");
  };

  const validateForm = () => {
    if (!form.assetCategory) return toast.error("Asset Category is required"), false;
    if (!form.assetName.trim()) return toast.error("Asset Name is required"), false;
    if (!form.assetDescription.trim()) return toast.error("Asset Description is required"), false;
    if (!form.uom) return toast.error("Unit of Measurement is required"), false;
    if (!form.hsnCode) return toast.error("HSN Code is required"), false;
    if (form.lifeExpectancyYears === "" || Number(form.lifeExpectancyYears) < 0) {
      return toast.error("Life Expectancy (Year) is required"), false;
    }
    if (!form.acquisitionDate) return toast.error("Acquisition Date is required"), false;
    if (!form.capitalisationDate) return toast.error("Capitalisation Date is required"), false;
    if (!form.locationId) return toast.error("Asset Location is required"), false;
    return true;
  };

  const handleSave = async () => {
    if (saving || !validateForm()) return;
    const payload = formToPayload(form);
    setSaving(true);
    try {
      if (isEdit) {
        setPendingEditPayload(payload);
        setRevisionModalOpen(true);
        return;
      }
      await createAssetMasterRequest(payload);
      toast.success("Asset master created.");
      navigate(appPath("masters/purchase/asset-master-capitalised"));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save asset record");
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateWithRevision = async (revisionInfo) => {
    if (!editRow || !pendingEditPayload) return;
    setSaving(true);
    try {
      await updateAssetMasterRequest(editRow._id || editRow.id, { ...pendingEditPayload, revisionInfo });
      toast.success("Asset master updated.");
      setRevisionModalOpen(false);
      setPendingEditPayload(null);
      navigate(appPath("masters/purchase/asset-master-capitalised"));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save asset record");
    } finally {
      setSaving(false);
    }
  };

  useCreateModalDevFill({
    enabled: !isEdit,
    onFill: () => {
      const category = assetCategoryOptions[0]?.value || "";
      const uom = uomOptions[0]?.value || "";
      const location = locationOptions[0]?.value || activeLocationId || "";
      const subLoc = subLocationOptions[0]?.value || "";
      const hsn = hsnRows[0]?.hsnCode || "";
      const supplier = supplierRows[0];
      setForm((prev) => ({
        ...prev,
        assetCategory: category,
        assetName: "PCB LOADER",
        assetDescription: "NTE0700LL",
        uom,
        hsnCode: hsn,
        gstRate: hsnRows[0]?.gstRate != null ? formatRate(hsnRows[0].gstRate) : "",
        lifeExpectancyYears: "10",
        supplierId: supplier ? String(supplier._id || supplier.id) : "",
        supplierCode: supplier?.supplierCode || "",
        supplierName: supplier?.supplierName || "",
        manufacturerName: "NUTEK",
        mpnModelNo: "NTE0700LL",
        purchaseRateExGst: "850000",
        assetUniqueId: "2006-0496A01",
        acquisitionDate: todayInputDate(),
        capitalisationDate: todayInputDate(),
        inOperationDate: todayInputDate(),
        manufacturingYear: "2006",
        ratedPowerKw: "2.5",
        locationId: location,
        subLocationId: subLoc,
        status: "Active",
      }));
      if (category) {
        previewAssetCodeRequest(category)
          .then((res) => setForm((prev) => ({ ...prev, assetNo: res?.data?.code || prev.assetNo })))
          .catch(() => null);
      }
      toast.info("Sample data filled (Alt+F1).");
    },
  });

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p className={styles.loading}>Loading asset…</p>
      </div>
    );
  }

  const statusOptions = STATUS_OPTIONS.map((st) => ({ value: st, label: st }));

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("masters/purchase/asset-master-capitalised"))} ariaLabel="Back to Asset Summary" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>Masters</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase"))}>Purchase</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase/asset-master-capitalised"))}>Asset Summary</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEdit ? "Edit Asset" : "New Asset"}</span>
        </h1>
      </header>

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />

          <div className={styles.cardBody}>
            <div
              className="sc-field-grid"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >
              <SelectField
                label="Asset Category"
                required
                options={assetCategoryOptions}
                value={form.assetCategory}
                onChange={(v) => setField("assetCategory", v)}
                disabled={isEdit}
              />
              <InputField
                label="Asset No."
                required
                value={codePreviewLoading ? "Loading…" : form.assetNo}
                locked
                placeholder="Select category to generate"
              />
              <InputField
                label="Asset Name"
                required
                value={form.assetName}
                onChange={(v) => setField("assetName", v)}
                placeholder="Enter Asset Name"
              />
              <InputField
                label="Asset Description"
                required
                value={form.assetDescription}
                onChange={(v) => setField("assetDescription", v)}
                placeholder="Enter Asset Description"
              />

              <SelectField
                label="Unit of Measurement"
                required
                options={uomOptions}
                value={form.uom}
                onChange={(v) => setField("uom", v)}
              />
              <div className={styles.fieldWithBtn}>
                <SelectField
                  label="HSN Code"
                  required
                  options={hsnOptions}
                  value={form.hsnCode}
                  onChange={handleHsnChange}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setHsnLookupOpen(true)}
                  aria-label="HSN lookup"
                >
                  <Search size={16} strokeWidth={2.25} />
                </button>
              </div>
              <InputField
                label="Life Expectancy (Year)"
                required
                type="number"
                min={0}
                step={1}
                value={form.lifeExpectancyYears}
                onChange={(v) => setField("lifeExpectancyYears", v)}
              />
              <div className={styles.fieldWithBtn}>
                <InputField
                  label="Vendor Name"
                  value={form.supplierName}
                  locked
                  placeholder="Select supplier"
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setSupplierLookupOpen(true)}
                  aria-label="Supplier lookup"
                >
                  <Search size={16} strokeWidth={2.25} />
                </button>
              </div>

              <InputField
                label="Manufacturer Name"
                value={form.manufacturerName}
                onChange={(v) => setField("manufacturerName", v)}
              />
              <InputField
                label="MPN/Model No."
                value={form.mpnModelNo}
                onChange={(v) => setField("mpnModelNo", v)}
              />
              <div className={styles.creditWrap}>
                <span className={styles.creditPrefix}>₹</span>
                <InputField
                  label="Purchase Rate (Exclusive of GST)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.purchaseRateExGst}
                  onChange={(v) => setField("purchaseRateExGst", v)}
                />
              </div>
              <InputField
                label="Asset Unique ID"
                value={form.assetUniqueId}
                onChange={(v) => setField("assetUniqueId", v)}
              />

              <DateField
                label="Acquisition Date"
                required
                value={form.acquisitionDate}
                onChange={(v) => setField("acquisitionDate", v)}
              />
              <DateField
                label="Capitalisation Date"
                required
                value={form.capitalisationDate}
                onChange={(v) => setField("capitalisationDate", v)}
              />
              <DateField
                label="In-Operation Date"
                value={form.inOperationDate}
                onChange={(v) => setField("inOperationDate", v)}
              />
              <InputField
                label="Manufacturing Year"
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={form.manufacturingYear}
                onChange={(v) => setField("manufacturingYear", v)}
              />

              <InputField
                label="Rated Power kW"
                type="number"
                min={0}
                step="0.01"
                value={form.ratedPowerKw}
                onChange={(v) => setField("ratedPowerKw", v)}
              />
              <SelectField
                label="Asset Location"
                required
                options={locationOptions}
                value={form.locationId}
                onChange={handleLocationChange}
                disabled={loadingLocations}
              />
              <SelectField
                label="Sub Location"
                options={subLocationOptions}
                value={form.subLocationId}
                onChange={(v) => setField("subLocationId", v)}
                disabled={!form.locationId || loadingChildren}
                placeholder={subLocationPlaceholder}
              />
              <SelectField
                label="Status"
                required
                options={statusOptions}
                value={form.status}
                onChange={(v) => setField("status", v)}
              />
            </div>

            <hr className={sectionStyles.sectionRule} />
            <h2 className={sectionStyles.sectionTitle}>Procurement Tracking</h2>
            <div
              className="sc-field-grid"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >
              <SelectField
                label="Asset Classification"
                options={ASSET_CLASSIFICATION_OPTIONS}
                value={form.procurementTracking?.assetClassification || ""}
                onChange={(v) => setProcurementTracking("assetClassification", v)}
              />
              <SelectField
                label="Procurement Mode"
                options={PROCUREMENT_MODE_OPTIONS}
                value={form.procurementTracking?.procurementMode || ""}
                onChange={(v) => setProcurementTracking("procurementMode", v)}
              />
              <InputField
                label="Purchase Reference"
                value={form.procurementTracking?.purchaseReference || ""}
                onChange={(v) => setProcurementTracking("purchaseReference", v)}
              />
              <InputField
                label="PO Reference"
                value={form.procurementTracking?.poReference || ""}
                onChange={(v) => setProcurementTracking("poReference", v)}
              />
              <SelectField
                label="Asset Lifecycle Status"
                options={ASSET_LIFECYCLE_STATUS_OPTIONS}
                value={form.procurementTracking?.assetLifecycleStatus || ""}
                onChange={(v) => setProcurementTracking("assetLifecycleStatus", v)}
              />
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              {!isEdit ? (
                <span className={styles.devHint}>Alt+F1 — fill sample data</span>
              ) : null}
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => navigate(appPath("masters/purchase/asset-master-capitalised"))}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </button>
              <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </article>
      </section>

      <ItemHsnLookupModal
        open={hsnLookupOpen}
        hsnRows={hsnRows}
        selectedHsnCode={form.hsnCode}
        onClose={() => setHsnLookupOpen(false)}
        onApply={(row) => {
          setForm((prev) => ({ ...prev, hsnCode: row.hsnCode, gstRate: formatRate(row.gstRate) }));
          setHsnLookupOpen(false);
        }}
      />
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
      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={Number(editRow?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => { setRevisionModalOpen(false); setPendingEditPayload(null); }}
        onSave={submitUpdateWithRevision}
      />
    </div>
  );
}
