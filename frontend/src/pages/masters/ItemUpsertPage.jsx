import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, RefreshCw, Search } from "lucide-react";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import { useHubReturn } from "../../utils/hubNavigation.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useLocationHierarchy } from "../../hooks/useLocationHierarchy.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import ItemHsnLookupModal from "../../components/modals/ItemHsnLookupModal.jsx";
import ItemDualUnitModal from "../../components/modals/ItemDualUnitModal.jsx";
import ItemSupplierLookupModal from "../../components/modals/ItemSupplierLookupModal.jsx";
import ItemSupplierRateModal from "../../components/modals/ItemSupplierRateModal.jsx";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import ItemDocumentsTab from "../../components/masters/ItemDocumentsTab.jsx";
import ItemAttributesTab from "../../components/masters/ItemAttributesTab.jsx";
import ItemAttributeFieldsGrid from "../../components/masters/ItemAttributeFieldsGrid.jsx";
import {
  categoryHasDimensionAttributes,
  isDimensionAttributeCode,
} from "../../config/itemDimensionAttributes.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  createItemMasterRequest,
  createItemSupplierLinkRequest,
  deleteItemSupplierLinkRequest,
  getItemApplicableConfigRequest,
  getItemAttributeValuesRequest,
  getItemMasterRequest,
  listHsnPMasterRequest,
  listItemSupplierLinksRequest,
  listSupplierMasterRequest,
  previewItemCodeRequest,
  saveItemAttributeValuesRequest,
  updateItemMasterRequest,
  updateItemSupplierLinkRequest,
} from "../../services/api.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import styles from "./ItemUpsertPage.module.css";
import MpbcdcItemSections from "../../components/masters/MpbcdcItemSections.jsx";
import {
  EMPTY_ITEM_GOVERNANCE,
  EMPTY_ITEM_PROCUREMENT,
} from "../../config/mpbcdcMasterOptions.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const INITIAL_DUAL_UNIT = { enabled: false, primaryUnit: "", secondaryUnit: "", conversionFactor: 1 };
const INITIAL_FORM = {
  itemNo: "",
  itemCategory: "",
  itemName: "",
  itemDescription: "",
  uom: "",
  hsnCode: "",
  gstRate: "",
  locationId: "",
  inventoryStoreId: "",
  inventoryStore: "",
  subLocationId: "",
  reorderLevel: "",
  status: "Active",
  dualUnit: INITIAL_DUAL_UNIT,
  procurementInfo: { ...EMPTY_ITEM_PROCUREMENT },
  governance: { ...EMPTY_ITEM_GOVERNANCE },
};
const INITIAL_LINK_FORM = {
  id: "",
  supplierId: "",
  supplierCode: "",
  supplierCategory: "",
  supplierName: "",
  mpn: "",
  uom: "",
  rates: [],
  isPreferred: false,
  status: "Active",
};

function formatRate(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function formatDateForInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function mapItemProcurement(doc) {
  const p = doc?.procurementInfo || {};
  return {
    materialType: p.materialType ?? "",
    procurementCategory: p.procurementCategory ?? "",
    stockType: p.stockType ?? "",
    gemApplicable: p.gemApplicable ?? "",
  };
}

function mapItemGovernance(doc) {
  const g = doc?.governance || {};
  return {
    approvalStatus: g.approvalStatus ?? "Draft",
    approvedBy: g.approvedBy ?? "",
    approvalDate: formatDateForInput(g.approvalDate),
    remarks: g.remarks ?? "",
  };
}

function normalizeItemRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
    itemNo: doc?.itemNo ?? "",
    itemCategory: doc?.itemCategory ?? "",
    itemName: doc?.itemName ?? "",
    itemDescription: doc?.itemDescription ?? "",
    uom: doc?.uom ?? "",
    hsnCode: doc?.hsnCode ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    locationId: doc?.locationId != null ? String(doc.locationId) : "",
    inventoryStoreId: doc?.inventoryStoreId != null ? String(doc.inventoryStoreId) : "",
    inventoryStore: doc?.inventoryStore ?? "",
    subLocationId: doc?.subLocationId != null ? String(doc.subLocationId) : "",
    reorderLevel:
      doc?.reorderLevel !== undefined && doc?.reorderLevel !== null ? String(doc.reorderLevel) : "",
    status: doc?.status || "Active",
    revNumber: Number(doc?.revNumber ?? 0),
    dualUnit: {
      ...INITIAL_DUAL_UNIT,
      ...(doc?.dualUnit || {}),
      conversionFactor: Number(doc?.dualUnit?.conversionFactor ?? 1),
    },
    procurementInfo: mapItemProcurement(doc),
    governance: mapItemGovernance(doc),
  };
}

function isDraftSupplierLink(row) {
  return String(row?._id || row?.id || "").startsWith("draft-");
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

export default function ItemUpsertPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("item");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editRow, setEditRow] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [dualUnitOpen, setDualUnitOpen] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [hsnRows, setHsnRows] = useState([]);
  const [supplierRows, setSupplierRows] = useState([]);
  const [linkRows, setLinkRows] = useState([]);
  const [draftLinkRows, setDraftLinkRows] = useState([]);
  const [linkForm, setLinkForm] = useState(INITIAL_LINK_FORM);
  const [supplierLookupOpen, setSupplierLookupOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkDeletingId, setLinkDeletingId] = useState("");
  const [attributeValues, setAttributeValues] = useState({});
  const [attrDefinitions, setAttrDefinitions] = useState([]);

  const { options: itemCategoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.ITEM_CATEGORY);
  const { options: uomOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.UOM);
  const { activeLocationId } = useLocationScope();
  const {
    locationOptions,
    subLocationOptions,
    storeOptions,
    loadingLocations,
    loadingChildren,
    getStoreOption,
  } = useLocationHierarchy(form.locationId);

  const hsnMap = useMemo(() => {
    const map = new Map();
    hsnRows.forEach((row) => map.set(String(row.hsnCode), row));
    return map;
  }, [hsnRows]);

  const dimensionDefinitions = useMemo(
    () =>
      attrDefinitions
        .filter((d) => isDimensionAttributeCode(d.code))
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [attrDefinitions]
  );

  const showDimensionSection =
    categoryHasDimensionAttributes(form.itemCategory) && dimensionDefinitions.length > 0;

  const patchAttributeValue = useCallback((code, val) => {
    setAttributeValues((prev) => ({ ...prev, [code]: val }));
  }, []);

  const persistAttributeValues = useCallback(async (itemId) => {
    if (!itemId || !attributeValues || Object.keys(attributeValues).length === 0) return;
    await saveItemAttributeValuesRequest(itemId, attributeValues);
  }, [attributeValues]);

  const fetchHsn = useCallback(async () => {
    try {
      const res = await listHsnPMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setHsnRows(data.map(normalizeHsnRow));
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

  const fetchLinkRows = useCallback(async (itemId) => {
    if (!itemId) {
      setLinkRows([]);
      return;
    }
    try {
      const res = await listItemSupplierLinksRequest(itemId);
      setLinkRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setLinkRows([]);
    }
  }, []);

  const activeLinkRows = editRow ? linkRows : draftLinkRows;

  useEffect(() => {
    fetchHsn();
    fetchSuppliers();
  }, [fetchHsn, fetchSuppliers]);

  useEffect(() => {
    if (!form.itemCategory) {
      setAttrDefinitions([]);
      return;
    }
    let cancelled = false;
    getItemApplicableConfigRequest(form.itemCategory)
      .then((res) => {
        if (!cancelled) {
          setAttrDefinitions(Array.isArray(res?.data?.attributeDefinitions) ? res.data.attributeDefinitions : []);
        }
      })
      .catch(() => {
        if (!cancelled) setAttrDefinitions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.itemCategory]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    async function loadItem() {
      setLoading(true);
      try {
        const res = await getItemMasterRequest(id);
        if (cancelled) return;
        const doc = normalizeItemRow(res?.data || {});
        setEditRow(doc);
        setForm({ ...INITIAL_FORM, ...doc, gstRate: formatRate(doc.gstRate || 0) });
        try {
          const attrRes = await getItemAttributeValuesRequest(doc._id || doc.id);
          setAttributeValues(attrRes?.data?.values || {});
        } catch {
          setAttributeValues({});
        }
        await fetchLinkRows(doc._id || doc.id);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load material");
          navigateWithHubReturn("masters/purchase/item-master");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadItem();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, fetchLinkRows, navigateWithHubReturn, toast]);

  useEffect(() => {
    if (isEdit || !form.itemCategory) return;
    let cancelled = false;
    previewItemCodeRequest(form.itemCategory)
      .then((res) => {
        if (!cancelled) setForm((prev) => ({ ...prev, itemNo: res?.data?.code || "" }));
      })
      .catch(() => {
        if (!cancelled) setForm((prev) => ({ ...prev, itemNo: "" }));
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, form.itemCategory]);

  const setCategory = async (itemCategory) => {
    setForm((prev) => ({ ...prev, itemCategory, itemNo: isEdit ? prev.itemNo : "" }));
    if (isEdit || !itemCategory) return;
    try {
      const res = await previewItemCodeRequest(itemCategory);
      setForm((prev) => ({ ...prev, itemCategory, itemNo: res?.data?.code || "" }));
    } catch {
      setForm((prev) => ({ ...prev, itemCategory, itemNo: "" }));
    }
  };

  const handleHsnChange = (hsnCode) => {
    const hsn = hsnMap.get(String(hsnCode));
    setForm((prev) => ({ ...prev, hsnCode, gstRate: hsn ? formatRate(hsn.gstRate) : "" }));
  };

  useEffect(() => {
    if (!isEdit && activeLocationId && !form.locationId) {
      setForm((p) => ({ ...p, locationId: activeLocationId }));
    }
  }, [isEdit, activeLocationId, form.locationId]);

  useEffect(() => {
    if (!form.locationId || form.subLocationId || !subLocationOptions.length) return;
    const legacyName = String(editRow?.subLocationName ?? editRow?.subLocation ?? "").trim();
    if (!legacyName) return;
    const match = subLocationOptions.find(
      (o) =>
        o.label === legacyName ||
        o.value === legacyName ||
        String(o.label).toLowerCase() === legacyName.toLowerCase()
    );
    if (match) setForm((p) => ({ ...p, subLocationId: match.value }));
  }, [editRow, subLocationOptions, form.locationId, form.subLocationId]);

  const subLocationPlaceholder = useMemo(() => {
    if (!form.locationId) return "Select location first";
    if (loadingChildren) return "Loading…";
    if (subLocationOptions.length === 0) {
      return "No sub-locations (add in Company Setup)";
    }
    return "Select sub-location";
  }, [form.locationId, loadingChildren, subLocationOptions.length]);

  function handleItemLocationChange(locationId) {
    setForm((p) => ({
      ...p,
      locationId,
      inventoryStoreId: "",
      inventoryStore: "",
      subLocationId: "",
    }));
  }

  function handleInventoryStoreChange(inventoryStoreId) {
    const opt = getStoreOption(inventoryStoreId);
    setForm((p) => ({
      ...p,
      inventoryStoreId,
      inventoryStore: opt?.storeCode || "",
    }));
  }

  useEffect(() => {
    if (!form.locationId || form.inventoryStoreId || !form.inventoryStore) return;
    const match = storeOptions.find(
      (o) =>
        o.storeCode === form.inventoryStore ||
        o.storeName === form.inventoryStore ||
        o.label === form.inventoryStore
    );
    if (match) {
      setForm((p) => ({ ...p, inventoryStoreId: match.value, inventoryStore: match.storeCode }));
    }
  }, [storeOptions, form.locationId, form.inventoryStore, form.inventoryStoreId]);

  const validateItemForm = () => {
    if (!form.itemCategory) return toast.error("Material Category is required"), false;
    if (!form.itemName.trim()) return toast.error("Material Name is required"), false;
    if (!form.itemDescription.trim()) return toast.error("Material Description is required"), false;
    if (!form.uom) return toast.error("UoM is required"), false;
    if (!form.hsnCode) return toast.error("HSN Code is required"), false;
    if (!form.locationId) return toast.error("Location is required"), false;
    if (!form.inventoryStoreId) return toast.error("Inventory Store is required"), false;
    return true;
  };

  const handleSaveItem = async () => {
    if (saving || !validateItemForm()) return;
    const payload = {
      itemNo: form.itemNo,
      itemCategory: form.itemCategory,
      itemName: form.itemName.trim(),
      itemDescription: form.itemDescription.trim(),
      uom: form.uom,
      hsnCode: form.hsnCode,
      gstRate: Number(form.gstRate || 0),
      locationId: form.locationId,
      inventoryStoreId: form.inventoryStoreId,
      inventoryStore: form.inventoryStore,
      subLocationId: form.subLocationId,
      reorderLevel: form.reorderLevel === "" ? undefined : form.reorderLevel,
      status: form.status,
      dualUnit: form.dualUnit,
      procurementInfo: form.procurementInfo,
      governance: form.governance,
    };
    setSaving(true);
    try {
      if (isEdit) {
        if (!payload?.revisionInfo) {
          setPendingEditPayload(payload);
          setRevisionModalOpen(true);
          return;
        }
        await updateItemMasterRequest(editRow._id || editRow.id, payload);
        await persistAttributeValues(editRow._id || editRow.id);
        toast.success("Material master updated.");
        navigateWithHubReturn("masters/purchase/item-master");
      } else {
        const res = await createItemMasterRequest(payload);
        const created = normalizeItemRow(res?.data || {});
        setEditRow(created);
        setForm({ ...INITIAL_FORM, ...created, gstRate: formatRate(created.gstRate || 0) });
        if (draftLinkRows.length > 0) {
          for (const d of draftLinkRows) {
            await createItemSupplierLinkRequest(created._id || created.id, {
              supplierId: d.supplierId,
              mpn: d.mpn,
              uom: d.uom,
              rates: d.rates,
              isPreferred: Boolean(d.isPreferred),
              status: d.status || "Active",
            });
          }
          setDraftLinkRows([]);
          await fetchLinkRows(created._id || created.id);
        }
        setActiveTab("documents");
        toast.success("Material created. Add drawings/documents and attributes, or link suppliers.");
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save material record");
    } finally {
      setSaving(false);
    }
  };

  const submitItemUpdateWithRevision = async (revisionInfo) => {
    if (!editRow || !pendingEditPayload) return;
    setSaving(true);
    try {
      await updateItemMasterRequest(editRow._id || editRow.id, { ...pendingEditPayload, revisionInfo });
      await persistAttributeValues(editRow._id || editRow.id);
      toast.success("Material master updated.");
      setRevisionModalOpen(false);
      setPendingEditPayload(null);
      navigateWithHubReturn("masters/purchase/item-master");
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save material record");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async () => {
    if (!linkForm.supplierId) return toast.error("Vendor is required.");
    if (!linkForm.uom) return toast.error("UoM is required for supplier link.");
    if (!Array.isArray(linkForm.rates) || linkForm.rates.length === 0) return toast.error("Please add purchase rate rows.");

    const linkPayload = {
      supplierId: linkForm.supplierId,
      supplierCode: linkForm.supplierCode,
      supplierCategory: linkForm.supplierCategory,
      supplierName: linkForm.supplierName,
      mpn: linkForm.mpn,
      uom: linkForm.uom,
      rates: linkForm.rates,
      isPreferred: Boolean(linkForm.isPreferred),
      status: linkForm.status || "Active",
    };

    const itemId = editRow?._id || editRow?.id;
    if (!itemId) {
      const nextId = linkForm.id || `draft-${Date.now()}`;
      setDraftLinkRows((prev) => {
        const rows = linkPayload.isPreferred
          ? prev.map((r) => ({ ...r, isPreferred: false }))
          : [...prev];
        const idx = rows.findIndex((r) => String(r.id) === String(nextId));
        const row = { ...linkPayload, id: nextId, _id: nextId };
        if (idx >= 0) rows[idx] = row;
        else rows.push(row);
        return rows;
      });
      setLinkForm(INITIAL_LINK_FORM);
      toast.success(linkForm.id ? "Vendor link updated in draft." : "Vendor link added in draft.");
      return;
    }

    setLinkSaving(true);
    try {
      if (linkForm.id) {
        await updateItemSupplierLinkRequest(itemId, linkForm.id, linkPayload);
        toast.success("Vendor link updated.");
      } else {
        await createItemSupplierLinkRequest(itemId, linkPayload);
        toast.success("Vendor linked successfully.");
      }
      await fetchLinkRows(itemId);
      setLinkForm(INITIAL_LINK_FORM);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save supplier link");
    } finally {
      setLinkSaving(false);
    }
  };

  const editLink = (row) => {
    setLinkForm({
      id: String(row._id || row.id),
      supplierId: String(row.supplierId),
      supplierCode: row.supplierCode || "",
      supplierCategory: row.supplierCategory || "",
      supplierName: row.supplierName || "",
      mpn: row.mpn || "",
      uom: row.uom || "",
      rates: Array.isArray(row.rates) ? row.rates : [],
      isPreferred: Boolean(row.isPreferred),
      status: row.status || "Active",
    });
    setActiveTab("supplier");
  };

  const removeLink = async (row) => {
    const itemId = editRow?._id || editRow?.id;
    if (!itemId) {
      const linkId = String(row._id || row.id);
      setDraftLinkRows((prev) => prev.filter((r) => String(r._id || r.id) !== linkId));
      if (String(linkForm.id) === linkId) setLinkForm(INITIAL_LINK_FORM);
      toast.success("Vendor link removed from draft.");
      return;
    }
    if (!itemId) return;
    const linkId = String(row._id || row.id);
    setLinkDeletingId(linkId);
    try {
      await deleteItemSupplierLinkRequest(itemId, linkId);
      toast.success("Vendor link removed.");
      await fetchLinkRows(itemId);
      if (String(linkForm.id) === linkId) setLinkForm(INITIAL_LINK_FORM);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to remove supplier link");
    } finally {
      setLinkDeletingId("");
    }
  };

  useCreateModalDevFill({
    enabled: !isEdit,
    onFill: () => {
      const category = itemCategoryOptions[0]?.value || "";
      const uom = uomOptions[0]?.value || "";
      const loc = locationOptions[0]?.value || activeLocationId || "";
      const storeOpt = storeOptions[0];
      const hsn = hsnRows[0]?.hsnCode || "";
      const gstRate = hsnRows[0]?.gstRate ?? "";
      setActiveTab("item");
      setForm((prev) => ({
        ...prev,
        itemCategory: category,
        itemName: "Demo Material",
        itemDescription: "Demo material description",
        uom,
        hsnCode: hsn,
        gstRate: gstRate === "" ? "" : formatRate(gstRate),
        locationId: loc,
        inventoryStoreId: storeOpt?.value || "",
        inventoryStore: storeOpt?.storeCode || "",
        subLocationId: subLocationOptions[0]?.value || "",
        reorderLevel: "100",
        status: "Active",
        dualUnit: { enabled: false, primaryUnit: uom, secondaryUnit: "", conversionFactor: 1 },
      }));
      if (category) {
        previewItemCodeRequest(category)
          .then((res) => setForm((prev) => ({ ...prev, itemNo: res?.data?.code || prev.itemNo })))
          .catch(() => null);
      }
      toast.info("Sample data filled (Alt+F1).");
    },
  });

  const hsnSelectOptions = useMemo(
    () => hsnRows.map((h) => ({ value: h.hsnCode, label: h.hsnCode })),
    [hsnRows]
  );

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p className={styles.loading}>Loading material…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/purchase"
        listSegment="masters/purchase/item-master"
        listTitle="Material Summary"
        formTitle={isEdit ? "Edit Material" : "New Material"}
      />

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <nav className={styles.pageTabRow} aria-label="Material sections">
              <button type="button" className={`${styles.pageTab} ${activeTab === "item" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("item")}>Material Details</button>
              <button type="button" className={`${styles.pageTab} ${activeTab === "documents" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("documents")} disabled={!editRow}>Documents</button>
              <button type="button" className={`${styles.pageTab} ${activeTab === "attributes" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("attributes")} disabled={!editRow}>Attributes</button>
              <button type="button" className={`${styles.pageTab} ${activeTab === "supplier" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("supplier")}>Vendor Link</button>
            </nav>

            {activeTab === "documents" ? (
              <ItemDocumentsTab
                itemId={editRow?._id || editRow?.id}
                itemCategory={form.itemCategory}
                disabled={!editRow}
              />
            ) : activeTab === "attributes" ? (
              <ItemAttributesTab
                itemId={editRow?._id || editRow?.id}
                itemCategory={form.itemCategory}
                disabled={!editRow}
                attributeValues={attributeValues}
                onAttributeValuesChange={setAttributeValues}
                hideDimensionAttributes
              />
            ) : activeTab === "item" ? (
              <>
                <div className="sc-field-grid">
                  <SelectField
                    label="Material Category"
                    required
                    options={itemCategoryOptions}
                    value={form.itemCategory}
                    onChange={(v) => setCategory(v)}
                    locked={isEdit}
                  />
                  <InputField label="Material Code" required value={form.itemNo} locked />
                  <InputField
                    label="Material Name"
                    required
                    value={form.itemName}
                    onChange={(v) => setForm((p) => ({ ...p, itemName: v }))}
                    placeholder="Enter material name"
                  />
                  <InputField
                    label="Material Description"
                    required
                    value={form.itemDescription}
                    onChange={(v) => setForm((p) => ({ ...p, itemDescription: v }))}
                    placeholder="Enter description"
                  />
                  <SelectField
                    label="UoM"
                    required
                    options={uomOptions}
                    value={form.uom}
                    onChange={(v) => setForm((p) => ({ ...p, uom: v }))}
                  />
                  <div className={styles.fieldWithBtn}>
                    <SelectField
                      label="HSN Code"
                      required
                      options={hsnSelectOptions}
                      value={form.hsnCode}
                      onChange={(v) => handleHsnChange(v)}
                    />
                    <button type="button" className={styles.iconBtn} onClick={() => setLookupOpen(true)} aria-label="HSN lookup">
                      <Search size={16} />
                    </button>
                  </div>
                  <InputField label="GST Rate %" value={form.gstRate} locked />
                  <SelectField
                    label="Location"
                    required
                    options={locationOptions}
                    value={form.locationId}
                    onChange={handleItemLocationChange}
                    disabled={loadingLocations}
                  />
                  <SelectField
                    label="Inventory Store"
                    required
                    options={storeOptions}
                    value={form.inventoryStoreId}
                    onChange={handleInventoryStoreChange}
                    disabled={!form.locationId || loadingChildren}
                  />
                  <SelectField
                    label="Sub Location"
                    options={subLocationOptions}
                    value={form.subLocationId}
                    onChange={(v) => setForm((p) => ({ ...p, subLocationId: v }))}
                    disabled={!form.locationId || loadingChildren}
                    placeholder={subLocationPlaceholder}
                  />
                  <InputField
                    label="Reorder Level"
                    type="number"
                    min={0}
                    step="0.001"
                    value={form.reorderLevel}
                    onChange={(v) => setForm((p) => ({ ...p, reorderLevel: v }))}
                    placeholder="Optional"
                  />
                  <SelectField
                    label="Status"
                    required
                    options={STATUS_OPTIONS}
                    value={form.status}
                    onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                  />
                </div>
                <MpbcdcItemSections
                  procurementInfo={form.procurementInfo}
                  governance={form.governance}
                  onProcurementChange={(key, value) =>
                    setForm((p) => ({
                      ...p,
                      procurementInfo: { ...(p.procurementInfo || EMPTY_ITEM_PROCUREMENT), [key]: value },
                    }))
                  }
                  onGovernanceChange={(key, value) =>
                    setForm((p) => ({
                      ...p,
                      governance: { ...(p.governance || EMPTY_ITEM_GOVERNANCE), [key]: value },
                    }))
                  }
                />
                {showDimensionSection ? (
                  <>
                    <hr className={styles.sectionRule} />
                    <h2 className={styles.sectionTitle}>Dimensions &amp; GSM</h2>
                    <p className={styles.sectionHint}>
                      Width, length, thickness and GSM for raw material and packing materials.
                      {!editRow ? " Values are saved when you save the material." : ""}
                    </p>
                    <ItemAttributeFieldsGrid
                      definitions={dimensionDefinitions}
                      values={attributeValues}
                      onChange={patchAttributeValue}
                    />
                  </>
                ) : null}
              </>
            ) : (
              <>
                <hr className={styles.sectionRule} />
                <h2 className={styles.sectionTitle}>Vendor Link</h2>
                <p className={styles.sectionHint}>
                  Link one or more suppliers with manufacturer part numbers and purchase rates.
                  {!editRow ? " Draft links are saved when you create the material." : ""}
                </p>
                <div className="sc-field-grid">
                  <InputField label="Vendor Category" value={linkForm.supplierCategory} locked />
                  <InputField label="Vendor Name" value={linkForm.supplierName} locked />
                  <InputField
                    label="MPN - Mfr Part No."
                    value={linkForm.mpn}
                    onChange={(v) => setLinkForm((p) => ({ ...p, mpn: v }))}
                    placeholder="Manufacturer part number"
                  />
                  <InputField label="UoM" value={linkForm.uom} locked />
                </div>
                <label className={styles.primaryCheck}>
                  <input
                    type="checkbox"
                    checked={Boolean(linkForm.isPreferred)}
                    onChange={(e) => setLinkForm((p) => ({ ...p, isPreferred: e.target.checked }))}
                  />
                  Mark as Primary Vendor
                </label>
                <div className="im-table-scroll" style={{ marginTop: "1vh" }}>
                  <table className="im-table im-table--master">
                    <thead><tr><th style={{ width: "17%" }}>Vendor Category</th><th style={{ width: "25%" }}>Vendor Name</th><th style={{ width: "14%" }}>MPN</th><th style={{ width: "9%" }}>UoM</th><th style={{ width: "9%" }}>Primary</th><th style={{ width: "12%" }}>View Rate</th><th style={{ width: "14%" }}>Action</th></tr></thead>
                    <tbody>
                      {activeLinkRows.length === 0 ? (
                        <tr className="im-empty-row"><td colSpan={7} className="im-empty-cell"><span className="im-no-records__text">No suppliers linked</span></td></tr>
                      ) : activeLinkRows.map((row) => {
                        const linkId = String(row._id || row.id);
                        return (
                          <tr key={linkId}>
                            <td>{row.supplierCategory || "—"}</td>
                            <td>
                              <span className={styles.supplierNameCell}>
                                {row.supplierName}
                                {isDraftSupplierLink(row) ? <span className={styles.draftBadge}>Draft</span> : null}
                              </span>
                            </td>
                            <td>{row.mpn || "—"}</td>
                            <td style={{ textAlign: "center" }}>{row.uom}</td>
                            <td style={{ textAlign: "center" }}>{row.isPreferred ? "Yes" : "—"}</td>
                            <td style={{ textAlign: "center" }}><button type="button" className={styles.rateBtn} onClick={() => { editLink(row); setRateModalOpen(true); }}>Rate</button></td>
                            <td style={{ textAlign: "center" }}>
                              <button type="button" className={styles.actionBtn} onClick={() => editLink(row)}>Edit</button>
                              <button type="button" className={styles.actionBtnDanger} disabled={linkDeletingId === linkId} onClick={() => removeLink(row)}>{linkDeletingId === linkId ? "..." : "Delete"}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {activeTab === "item" ? (
            <footer className={styles.footer}>
              <div className={styles.footerLeft}>
                <button type="button" className={styles.btnAux} onClick={() => setDualUnitOpen(true)} disabled={saving}>
                  <RefreshCw size={16} strokeWidth={2.5} aria-hidden />
                  Dual Unit
                </button>
                {!isEdit ? <span className={styles.devHint}>Alt+F1 — fill sample data</span> : null}
              </div>
              <div className={styles.footerRight}>
                <button type="button" className={styles.btnCancel} onClick={() => navigateWithHubReturn("masters/purchase/item-master")} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className={styles.btnSave} onClick={handleSaveItem} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </footer>
          ) : activeTab === "supplier" ? (
            <footer className={styles.footer}>
              <div className={styles.footerLeft}>
                <button type="button" className={styles.btnAux} onClick={() => setSupplierLookupOpen(true)} disabled={linkSaving}>
                  <Search size={16} strokeWidth={2.5} aria-hidden />
                  Vendor
                </button>
                <button type="button" className={styles.btnAux} onClick={() => setRateModalOpen(true)} disabled={linkSaving}>
                  <Plus size={16} strokeWidth={2.5} aria-hidden />
                  Rate
                </button>
              </div>
              <div className={styles.footerRight}>
                <button type="button" className={styles.btnCancel} onClick={() => navigateWithHubReturn("masters/purchase/item-master")} disabled={linkSaving}>
                  Cancel
                </button>
                <button type="button" className={styles.btnSave} onClick={handleSaveLink} disabled={linkSaving}>
                  {linkSaving ? "Saving…" : linkForm.id ? "Update Link" : "Add Link"}
                </button>
              </div>
            </footer>
          ) : null}
        </article>
      </section>

      <ItemHsnLookupModal
        open={lookupOpen}
        hsnRows={hsnRows}
        selectedHsnCode={form.hsnCode}
        onClose={() => setLookupOpen(false)}
        onApply={(row) => {
          setForm((prev) => ({ ...prev, hsnCode: row.hsnCode, gstRate: formatRate(row.gstRate) }));
          setLookupOpen(false);
        }}
      />
      <ItemDualUnitModal
        open={dualUnitOpen}
        uomOptions={uomOptions}
        value={form.dualUnit}
        defaultPrimaryUnit={form.uom}
        onClose={() => setDualUnitOpen(false)}
        onSave={(dualUnit) => {
          setForm((prev) => ({ ...prev, dualUnit }));
          setDualUnitOpen(false);
        }}
      />
      <ItemSupplierLookupModal
        open={supplierLookupOpen}
        supplierRows={supplierRows}
        selectedSupplierId={linkForm.supplierId}
        onClose={() => setSupplierLookupOpen(false)}
        onApply={(supplier) => {
          setLinkForm((prev) => ({
            ...prev,
            supplierId: String(supplier._id || supplier.id),
            supplierCode: supplier.supplierCode || "",
            supplierCategory: supplier.categoryType || supplier.supplierPurchaseType || "",
            supplierName: supplier.supplierName || "",
            uom: prev.uom || form.uom || "",
          }));
          setSupplierLookupOpen(false);
        }}
      />
      <ItemSupplierRateModal
        open={rateModalOpen}
        value={linkForm.rates}
        defaultUom={linkForm.uom || form.uom}
        uomOptions={uomOptions}
        onClose={() => setRateModalOpen(false)}
        onSave={(rates) => {
          setLinkForm((prev) => ({ ...prev, rates, uom: prev.uom || rates[0]?.uom || form.uom || "" }));
          setRateModalOpen(false);
        }}
      />
      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={Number(editRow?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          setRevisionModalOpen(false);
          setPendingEditPayload(null);
        }}
        onSave={submitItemUpdateWithRevision}
      />
    </div>
  );
}
