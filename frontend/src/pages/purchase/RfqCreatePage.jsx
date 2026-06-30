import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import PoItemLookupModal from "../../components/purchase/PoItemLookupModal.jsx";
import PoSupplierLookupModal from "../../components/purchase/PoSupplierLookupModal.jsx";
import AuditInformationSection from "../../components/common/AuditInformationSection.jsx";
import RfqDocumentsSection from "../../components/purchase/RfqDocumentsSection.jsx";
import { appPath } from "../../config/navigation.js";
import { RFQ_PATHS } from "../../config/rfqPaths.js";
import {
  PROCUREMENT_CATEGORY_OPTIONS,
  RFQ_CURRENCY_OPTIONS,
  RFQ_LINE_TYPE_OPTIONS,
  RFQ_PURCHASE_TYPE_OPTIONS,
  RFQ_TYPE_OPTIONS,
} from "../../config/rfqOptions.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createRfqRequest,
  getRfqRequest,
  listApprovedPurchaseIndentsRequest,
  listItemMasterRequest,
  listServiceMasterRequest,
  listSourceListMasterRequest,
  listSupplierMasterRequest,
  previewRfqNoRequest,
  updateRfqRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  computeRfqTotalQty,
  emptyRfqForm,
  emptyRfqLine,
  emptyRfqLineFromItem,
  emptyRfqLineFromService,
  rfqDocToForm,
  rfqFormToPayload,
  vendorFromSupplier,
} from "../../utils/rfqFormState.js";
import {
  createEmptyRfqValidation,
  validateRfqForm,
} from "../../utils/rfqValidation.js";
import styles from "./PurchaseOrderCreatePage.module.css";
import rfqStyles from "./PurchaseIndentForm.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LINE_PAGE_SIZE = 10;

function comingSoonButton(label) {
  return (
    <button type="button" className={styles.btnAux} disabled title="Coming Soon">
      {label} · Coming Soon
    </button>
  );
}

export default function RfqCreatePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const toast = useToast();
  const [form, setForm] = useState(() => emptyRfqForm(getUserDisplayName()));
  const [savedDoc, setSavedDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rfqNoLoading, setRfqNoLoading] = useState(!isEditMode);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sourceLists, setSourceLists] = useState([]);
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [lineQuery, setLineQuery] = useState("");
  const [linePage, setLinePage] = useState(1);
  const [validationErrors, setValidationErrors] = useState(createEmptyRfqValidation);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const { options: departmentOptionsRaw, loading: deptLoading } = useMasterDataOptions(
    MASTER_DATA_CATEGORY.COST_CENTER
  );
  const departmentOptions = useMemo(
    () => (departmentOptionsRaw.length ? departmentOptionsRaw : []),
    [departmentOptionsRaw]
  );

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLine = useCallback((key, patch) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }, []);

  const patchVendor = useCallback((key, patch) => {
    setForm((prev) => ({
      ...prev,
      vendors: prev.vendors.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }, []);

  const removeLine = useCallback((key) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((row) => row.key !== key) }));
  }, []);

  const removeVendor = useCallback((key) => {
    setForm((prev) => ({ ...prev, vendors: prev.vendors.filter((row) => row.key !== key) }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [itemRes, svcRes, supRes, slRes, prRes] = await Promise.all([
          listItemMasterRequest(),
          listServiceMasterRequest(),
          listSupplierMasterRequest(),
          listSourceListMasterRequest(),
          listApprovedPurchaseIndentsRequest(),
        ]);
        if (!cancelled) {
          setItems(Array.isArray(itemRes?.data) ? itemRes.data : []);
          setServices(Array.isArray(svcRes?.data) ? svcRes.data : []);
          setSuppliers(Array.isArray(supRes?.data) ? supRes.data : []);
          setSourceLists(Array.isArray(slRes?.data) ? slRes.data : []);
          setApprovedPrs(Array.isArray(prRes?.data) ? prRes.data : []);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setServices([]);
          setSuppliers([]);
          setSourceLists([]);
          setApprovedPrs([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode) return;
    let cancelled = false;
    (async () => {
      setRfqNoLoading(true);
      try {
        const res = await previewRfqNoRequest();
        if (!cancelled) patchForm({ rfqNo: res?.data?.code || "" });
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "RFQ number is not available");
      } finally {
        if (!cancelled) setRfqNoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, patchForm, toast]);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    let cancelled = false;
    (async () => {
      setEditLoading(true);
      try {
        const res = await getRfqRequest(editId);
        if (!cancelled) {
          const doc = res?.data;
          if (doc?.status !== "Draft") {
            toast.error("Only draft RFQs can be edited.");
            navigate(appPath(RFQ_PATHS.listPath), { replace: true });
            return;
          }
          setSavedDoc(doc);
          setForm(rfqDocToForm(doc));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load RFQ");
          navigate(appPath(RFQ_PATHS.listPath), { replace: true });
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate, toast]);

  const supplierRows = useMemo(
    () =>
      suppliers.map((s) => ({
        ...s,
        id: String(s._id || s.id),
      })),
    [suppliers]
  );

  const prOptions = useMemo(
    () => [
      { value: "", label: "Select PR (optional)" },
      ...approvedPrs.map((pr) => ({
        value: String(pr._id || pr.id),
        label: `${pr.indentNo || ""} · ${pr.department || ""}`.trim(),
      })),
    ],
    [approvedPrs]
  );

  const serviceOptions = useMemo(
    () => [
      { value: "", label: "Select service" },
      ...services.map((s) => ({
        value: String(s._id || s.id),
        label: `${s.serviceCode || ""} · ${s.serviceName || s.description || ""}`.trim(),
      })),
    ],
    [services]
  );

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    if (!q) return form.lines;
    return form.lines.filter((row) =>
      [row.itemNo, row.itemName, row.serviceCode, row.serviceName, row.description, row.uom].some(
        (v) => String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [form.lines, lineQuery]);

  const lineTotalPages = Math.max(1, Math.ceil(filteredLines.length / LINE_PAGE_SIZE));
  const pageLines = filteredLines.slice((linePage - 1) * LINE_PAGE_SIZE, linePage * LINE_PAGE_SIZE);
  const totalQty = computeRfqTotalQty(form.lines);

  const existingItemIds = useMemo(
    () => form.lines.map((row) => String(row.itemId)).filter(Boolean),
    [form.lines]
  );

  function handleAddItems(pickedLines) {
    const next = [...form.lines];
    for (const poLine of pickedLines) {
      const id = String(poLine.itemId);
      if (!id || next.some((row) => String(row.itemId) === id && row.lineType === "Material")) continue;
      next.push({
        ...emptyRfqLineFromItem({
          _id: poLine.itemId,
          itemNo: poLine.itemNo,
          itemName: poLine.itemName,
          description: poLine.description,
          uom: poLine.uom,
        }),
        key: poLine.key || `line-${id}`,
      });
    }
    patchForm({ lines: next });
    setItemModalOpen(false);
  }

  function handleAddVendor(supplierId) {
    const supplier = suppliers.find((s) => String(s._id || s.id) === String(supplierId));
    if (!supplier) return;
    const id = String(supplier._id || supplier.id);
    if (form.vendors.some((v) => String(v.supplierId) === id)) {
      toast.info("Vendor already added.");
      return;
    }
    patchForm({ vendors: [...form.vendors, vendorFromSupplier(supplier)] });
    setVendorModalOpen(false);
  }

  function handleSourceListLookup() {
    const firstMaterialLine = form.lines.find((l) => l.lineType === "Material" && l.itemId);
    const itemId = firstMaterialLine?.itemId;
    const matches = sourceLists.filter((sl) => {
      if (itemId && sl.itemId) return String(sl.itemId) === String(itemId);
      return true;
    });
    if (!matches.length) {
      toast.info("No source list entries found for selected materials.");
      return;
    }
    const next = [...form.vendors];
    for (const sl of matches.slice(0, 5)) {
      const sup = suppliers.find((s) => String(s._id || s.id) === String(sl.supplierId));
      if (!sup) continue;
      const sid = String(sup._id || sup.id);
      if (next.some((v) => String(v.supplierId) === sid)) continue;
      const row = vendorFromSupplier(sup, Boolean(sl.preferred));
      row.sourceListCode = sl.sourceListCode || sl.code || "";
      next.push(row);
    }
    patchForm({ vendors: next });
    toast.success("Vendors loaded from source list.");
  }

  function handlePrChange(prId) {
    const pr = approvedPrs.find((p) => String(p._id || p.id) === String(prId));
    patchForm({
      referencePrId: prId,
      referencePrNo: pr?.indentNo || "",
      department: pr?.department || form.department,
      procurementCategory: pr?.procurementInfo?.procurementCategory || form.procurementCategory,
    });
  }

  function handleServicePick(lineKey, serviceId) {
    const svc = services.find((s) => String(s._id || s.id) === String(serviceId));
    if (!svc) return;
    patchLine(lineKey, emptyRfqLineFromService(svc));
  }

  async function handleSave() {
    setHasTriedSave(true);
    const { valid, errors } = validateRfqForm(form);
    setValidationErrors(errors);
    if (!valid) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = rfqFormToPayload(form);
      if (isEditMode) {
        await updateRfqRequest(editId, payload);
        toast.success("RFQ updated.");
      } else {
        await createRfqRequest(payload);
        toast.success("RFQ saved.");
      }
      navigate(appPath(RFQ_PATHS.listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(RFQ_PATHS.listPath))} ariaLabel="Back to RFQ list" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(RFQ_PATHS.hubPath))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(RFQ_PATHS.listPath))}>
            {RFQ_PATHS.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEditMode ? "Edit RFQ" : "Create RFQ"}</span>
        </h1>
      </header>

      <div className={`${styles.wrap} ${rfqStyles.pageShell}`}>
        {editLoading ? <p className={styles.editLoading}>Loading RFQ…</p> : null}

        <div className={`${styles.card}${editLoading ? ` ${styles.cardHidden}` : ""}`}>
          <div className={rfqStyles.formScroll}>
            <section className={rfqStyles.sectionPanel}>
              <div className={rfqStyles.sectionHeader}>
                <div>
                  <h2 className={rfqStyles.sectionTitle}>RFQ Header</h2>
                  <p className={rfqStyles.sectionSubtitle}>Basic RFQ information and scheduling</p>
                </div>
                <div className={rfqStyles.sectionHeaderMeta}>
                  <span className={`${rfqStyles.statusChip} ${rfqStyles.statusChipDraft}`}>
                    Status: <strong>Draft</strong>
                  </span>
                  <span className={rfqStyles.statusChip}>
                    Total Qty: <strong>{totalQty.toLocaleString("en-IN")}</strong>
                  </span>
                </div>
              </div>
              <div className={rfqStyles.sectionBody}>
                <div className="sc-field-grid">
                  <InputField label="RFQ Number" value={rfqNoLoading ? "Loading…" : form.rfqNo} locked />
                  <DateField
                    label="RFQ Date"
                    type="date"
                    required
                    value={form.rfqDate}
                    onChange={(v) => patchForm({ rfqDate: v })}
                  />
                  <SelectField
                    label="RFQ Type"
                    options={RFQ_TYPE_OPTIONS}
                    value={form.rfqType}
                    onChange={(v) => patchForm({ rfqType: v })}
                  />
                  {departmentOptions.length ? (
                    <SelectField
                      label="Department"
                      required
                      options={departmentOptions}
                      value={form.department}
                      onChange={(v) => patchForm({ department: v })}
                      disabled={deptLoading}
                    />
                  ) : (
                    <InputField
                      label="Department"
                      required
                      value={form.department}
                      onChange={(v) => patchForm({ department: v })}
                    />
                  )}
                  <SelectField
                    label="Procurement Category"
                    options={[{ value: "", label: "Select" }, ...PROCUREMENT_CATEGORY_OPTIONS]}
                    value={form.procurementCategory}
                    onChange={(v) => patchForm({ procurementCategory: v })}
                  />
                  <SelectField
                    label="Purchase Type"
                    options={RFQ_PURCHASE_TYPE_OPTIONS}
                    value={form.purchaseType}
                    onChange={(v) => patchForm({ purchaseType: v })}
                  />
                  <SelectField
                    label="Currency"
                    options={RFQ_CURRENCY_OPTIONS}
                    value={form.currency}
                    onChange={(v) => patchForm({ currency: v })}
                  />
                  <SelectField
                    label="Reference PR"
                    options={prOptions}
                    value={form.referencePrId}
                    onChange={handlePrChange}
                  />
                  <InputField
                    label="Reference Planning"
                    value={form.referencePlanningRef}
                    onChange={(v) => patchForm({ referencePlanningRef: v })}
                    placeholder="Planning reference"
                  />
                  <DateField
                    label="Required Delivery Date"
                    type="date"
                    value={form.requiredDeliveryDate}
                    onChange={(v) => patchForm({ requiredDeliveryDate: v })}
                  />
                  <DateField
                    label="Closing Date"
                    type="date"
                    required
                    value={form.closingDate}
                    onChange={(v) => patchForm({ closingDate: v })}
                  />
                  <InputField
                    label="Buyer"
                    value={form.buyer}
                    onChange={(v) => patchForm({ buyer: v })}
                  />
                  <InputField
                    label="Remarks"
                    value={form.remarks}
                    onChange={(v) => patchForm({ remarks: v })}
                    placeholder="Header remarks"
                  />
                </div>
                {hasTriedSave && validationErrors.department ? (
                  <div className={styles.fieldError}>{validationErrors.department}</div>
                ) : null}
                {hasTriedSave && validationErrors.closingDate ? (
                  <div className={styles.fieldError}>{validationErrors.closingDate}</div>
                ) : null}
              </div>
            </section>

            <section className={rfqStyles.sectionPanel}>
              <div className={rfqStyles.sectionHeader}>
                <div>
                  <h2 className={rfqStyles.sectionTitle}>Vendor Selection</h2>
                  <p className={rfqStyles.sectionSubtitle}>Invite vendors for quotation</p>
                </div>
                <div className={rfqStyles.linesToolbar}>
                  <button type="button" className={styles.btnAux} onClick={() => setVendorModalOpen(true)}>
                    <Plus size={16} /> Select Vendors
                  </button>
                  <button type="button" className={styles.btnAux} onClick={handleSourceListLookup}>
                    Source List Lookup
                  </button>
                  {comingSoonButton("Email Vendors")}
                  {comingSoonButton("Vendor Portal Publish")}
                  {comingSoonButton("Auto Vendor Selection")}
                  {comingSoonButton("GeM Publish")}
                  {comingSoonButton("Reverse Auction")}
                </div>
              </div>
              <div className={rfqStyles.sectionBody}>
                {hasTriedSave && validationErrors.vendors ? (
                  <div className={styles.fieldError}>{validationErrors.vendors}</div>
                ) : null}
                <div className={`im-table-scroll ${rfqStyles.linesTableWrap}`}>
                  <table className={`im-table im-table--master ${styles.poLinesTable}`}>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Preferred</th>
                        <th>Source List</th>
                        <th>Rating</th>
                        <th>MSME</th>
                        <th>GeM</th>
                        <th>Contact</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {form.vendors.length === 0 ? (
                        <tr className="im-empty-row">
                          <td colSpan={10} className="im-empty-cell">
                            Add vendors using Select Vendors or Source List Lookup.
                          </td>
                        </tr>
                      ) : (
                        form.vendors.map((row) => (
                          <tr key={row.key}>
                            <td>{row.supplierName || row.supplierCode || "—"}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={Boolean(row.preferred)}
                                onChange={(e) => patchVendor(row.key, { preferred: e.target.checked })}
                              />
                            </td>
                            <td>{row.sourceListCode || "—"}</td>
                            <td>{row.vendorRating ?? "—"}</td>
                            <td>{row.msme || "—"}</td>
                            <td>{row.gemRegistered || "—"}</td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.contactPerson}
                                onChange={(e) => patchVendor(row.key, { contactPerson: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.email}
                                onChange={(e) => patchVendor(row.key, { email: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.mobile}
                                onChange={(e) => patchVendor(row.key, { mobile: e.target.value })}
                              />
                            </td>
                            <td>
                              <button type="button" className={styles.btnAux} onClick={() => removeVendor(row.key)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className={rfqStyles.sectionPanel}>
              <div className={rfqStyles.sectionHeader}>
                <div>
                  <h2 className={rfqStyles.sectionTitle}>Item Lines</h2>
                  <p className={rfqStyles.sectionSubtitle}>Materials and services requested for quotation</p>
                </div>
              </div>
              <div className={rfqStyles.sectionBody}>
                {hasTriedSave && validationErrors.lines ? (
                  <div className={styles.fieldError}>{validationErrors.lines}</div>
                ) : null}
                <div className={rfqStyles.linesToolbar}>
                  <div className={`sc-modal-search ${rfqStyles.linesSearch}`}>
                    <Search className="sc-modal-search__icon" size={18} />
                    <input
                      type="text"
                      className="sc-modal-search__input"
                      placeholder="Search lines"
                      value={lineQuery}
                      onChange={(e) => {
                        setLineQuery(e.target.value);
                        setLinePage(1);
                      }}
                    />
                  </div>
                  <button type="button" className={styles.btnAux} onClick={() => setItemModalOpen(true)}>
                    <Plus size={16} /> Add Material
                  </button>
                  <button
                    type="button"
                    className={styles.btnAux}
                    onClick={() => patchForm({ lines: [...form.lines, emptyRfqLine()] })}
                  >
                    <Plus size={16} /> Add Service Line
                  </button>
                </div>
                <div className={`im-table-scroll ${rfqStyles.linesTableWrap}`}>
                  <table className={`im-table im-table--master ${styles.poLinesTable}`}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Material / Service</th>
                        <th>Description</th>
                        <th>UoM</th>
                        <th>Qty</th>
                        <th>Expected Delivery</th>
                        <th>Technical Spec</th>
                        <th>Drawing Ref</th>
                        <th>Remarks</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pageLines.length === 0 ? (
                        <tr className="im-empty-row">
                          <td colSpan={10} className="im-empty-cell">
                            Add material or service lines to this RFQ.
                          </td>
                        </tr>
                      ) : (
                        pageLines.map((row) => (
                          <tr key={row.key}>
                            <td>
                              <select
                                className={styles.lineInput}
                                value={row.lineType}
                                onChange={(e) => patchLine(row.key, { lineType: e.target.value })}
                              >
                                {RFQ_LINE_TYPE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              {row.lineType === "Service" ? (
                                <select
                                  className={styles.lineInput}
                                  value={row.serviceId}
                                  onChange={(e) => handleServicePick(row.key, e.target.value)}
                                >
                                  {serviceOptions.map((o) => (
                                    <option key={o.value || "blank"} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span>{row.itemNo ? `${row.itemNo} · ${row.itemName}` : "—"}</span>
                              )}
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.description}
                                onChange={(e) => patchLine(row.key, { description: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.uom}
                                onChange={(e) => patchLine(row.key, { uom: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                type="number"
                                min="0"
                                value={row.qty}
                                onChange={(e) => patchLine(row.key, { qty: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                type="date"
                                value={row.expectedDelivery}
                                onChange={(e) => patchLine(row.key, { expectedDelivery: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.technicalSpecification}
                                onChange={(e) =>
                                  patchLine(row.key, { technicalSpecification: e.target.value })
                                }
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.drawingReference}
                                onChange={(e) => patchLine(row.key, { drawingReference: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                className={styles.lineInput}
                                value={row.lineRemarks}
                                onChange={(e) => patchLine(row.key, { lineRemarks: e.target.value })}
                              />
                            </td>
                            <td>
                              <button type="button" className={styles.btnAux} onClick={() => removeLine(row.key)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {lineTotalPages > 1 ? (
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    Page {linePage} of {lineTotalPages}
                    <button type="button" className={styles.btnAux} disabled={linePage <= 1} onClick={() => setLinePage((p) => p - 1)}>
                      Prev
                    </button>
                    <button
                      type="button"
                      className={styles.btnAux}
                      disabled={linePage >= lineTotalPages}
                      onClick={() => setLinePage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={rfqStyles.sectionPanel}>
              <div className={rfqStyles.sectionHeader}>
                <div>
                  <h2 className={rfqStyles.sectionTitle}>Terms</h2>
                  <p className={rfqStyles.sectionSubtitle}>Commercial and delivery terms for vendors</p>
                </div>
              </div>
              <div className={rfqStyles.sectionBody}>
                <textarea
                  className={styles.lineInput}
                  style={{ width: "100%", minHeight: "6rem", resize: "vertical" }}
                  rows={4}
                  value={form.terms}
                  onChange={(e) => patchForm({ terms: e.target.value })}
                  placeholder="Standard terms and conditions for this RFQ"
                />
              </div>
            </section>

            <RfqDocumentsSection rfqId={editId} disabled={!editId} />

            {isEditMode && savedDoc ? (
              <AuditInformationSection document={savedDoc} documentType="rfq" />
            ) : null}
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnAux} onClick={() => navigate(appPath(RFQ_PATHS.listPath))}>
                Cancel
              </button>
              <button type="button" className={styles.btnSave} disabled={saving} onClick={handleSave}>
                {saving ? "Saving…" : isEditMode ? "Update RFQ" : "Save RFQ"}
              </button>
            </div>
          </footer>
        </div>
      </div>

      <PoItemLookupModal
        open={itemModalOpen}
        itemRows={items}
        existingIds={existingItemIds}
        onClose={() => setItemModalOpen(false)}
        onApply={handleAddItems}
      />

      <PoSupplierLookupModal
        open={vendorModalOpen}
        supplierRows={supplierRows}
        selectedSupplierId=""
        title="Select Vendor for RFQ"
        onClose={() => setVendorModalOpen(false)}
        onApply={(row) => handleAddVendor(row?.id || row?._id)}
      />
    </div>
  );
}
