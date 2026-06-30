import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import PoItemLookupModal from "../../components/purchase/PoItemLookupModal.jsx";
import { appPath } from "../../config/navigation.js";
import { PURCHASE_INDENT_PATHS } from "../../config/purchaseIndentPaths.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { useToast } from "../../hooks/useToast.js";
import {
  createPurchaseIndentRequest,
  getPurchaseIndentRequest,
  listItemMasterRequest,
  previewPurchaseIndentNoRequest,
  updatePurchaseIndentRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  buildPurchaseIndentDevFillForm,
  computeIndentTotalQty,
  emptyIndentLineFromItem,
  emptyPurchaseIndentForm,
  INDENT_PRIORITY_OPTIONS,
  purchaseIndentDocToForm,
  purchaseIndentFormToPayload,
} from "../../utils/purchaseIndentFormState.js";
import {
  createEmptyPurchaseIndentValidation,
  validatePurchaseIndentForm,
} from "../../utils/purchaseIndentValidation.js";
import PurchaseIndentMpbcdcSections from "../../components/purchase/PurchaseIndentMpbcdcSections.jsx";
import PurchaseIndentDocumentsSection from "../../components/purchase/PurchaseIndentDocumentsSection.jsx";
import styles from "./PurchaseOrderCreatePage.module.css";
import indentStyles from "./PurchaseIndentForm.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LINE_PAGE_SIZE = 10;

export default function PurchaseIndentCreatePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const toast = useToast();
  const { activeLocationId } = useLocationScope();
  const [form, setForm] = useState(() => emptyPurchaseIndentForm(getUserDisplayName()));
  const [saving, setSaving] = useState(false);
  const [indentNoLoading, setIndentNoLoading] = useState(!isEditMode);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [items, setItems] = useState([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [lineQuery, setLineQuery] = useState("");
  const [linePage, setLinePage] = useState(1);
  const [validationErrors, setValidationErrors] = useState(createEmptyPurchaseIndentValidation);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const { options: departmentOptionsRaw, loading: deptLoading } = useMasterDataOptions(
    MASTER_DATA_CATEGORY.COST_CENTER
  );

  const departmentOptions = useMemo(() => {
    if (departmentOptionsRaw.length) return departmentOptionsRaw;
    return [];
  }, [departmentOptionsRaw]);

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLine = useCallback((key, patch) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }, []);

  const removeLine = useCallback((key) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((row) => row.key !== key) }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listItemMasterRequest();
        if (!cancelled) setItems(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (!cancelled) setItems([]);
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
      setIndentNoLoading(true);
      try {
        const res = await previewPurchaseIndentNoRequest();
        if (!cancelled) patchForm({ indentNo: res?.data?.code || "" });
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "Indent number is not available");
      } finally {
        if (!cancelled) setIndentNoLoading(false);
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
        const res = await getPurchaseIndentRequest(editId);
        if (!cancelled) {
          const doc = res?.data;
          if (doc?.status !== "Draft") {
            toast.error("Only draft indents can be edited.");
            navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { replace: true });
            return;
          }
          setForm(purchaseIndentDocToForm(doc));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load purchase indent");
          navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { replace: true });
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate, toast]);

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    if (!q) return form.lines;
    return form.lines.filter((row) =>
      [row.itemNo, row.itemName, row.description, row.uom].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [form.lines, lineQuery]);

  const lineTotalPages = Math.max(1, Math.ceil(filteredLines.length / LINE_PAGE_SIZE));
  const pageLines = filteredLines.slice((linePage - 1) * LINE_PAGE_SIZE, linePage * LINE_PAGE_SIZE);
  const totalQty = computeIndentTotalQty(form.lines);

  const existingItemIds = useMemo(
    () => form.lines.map((row) => String(row.itemId)).filter(Boolean),
    [form.lines]
  );

  const fillDevSample = useCallback(() => {
    setForm((prev) =>
      buildPurchaseIndentDevFillForm({
        requestedBy: getUserDisplayName(),
        indentNo: prev.indentNo,
        departmentOptions,
        items,
      })
    );
    setValidationErrors(createEmptyPurchaseIndentValidation());
    setHasTriedSave(false);
    toast.info("Sample data filled (Alt+F1).");
  }, [departmentOptions, items, toast]);

  useCreateModalDevFill({
    enabled: !isEditMode,
    onFill: fillDevSample,
  });

  function handleAddItems(pickedLines) {
    const next = [...form.lines];
    for (const poLine of pickedLines) {
      const id = String(poLine.itemId);
      if (!id || next.some((row) => String(row.itemId) === id)) continue;
      next.push({
        ...emptyIndentLineFromItem({
          _id: poLine.itemId,
          itemNo: poLine.itemNo,
          itemName: poLine.itemName,
          itemDescription: poLine.description,
          uom: poLine.uom,
        }),
        key: poLine.key || `line-${id}`,
      });
    }
    patchForm({ lines: next });
    setItemModalOpen(false);
  }

  async function handleSave() {
    setHasTriedSave(true);
    const errors = validatePurchaseIndentForm(form, { activeLocationId });
    setValidationErrors(errors);
    if (errors.hasErrors) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = purchaseIndentFormToPayload(form, activeLocationId);
      if (isEditMode) {
        await updatePurchaseIndentRequest(editId, payload);
        toast.success("Purchase indent updated.");
      } else {
        await createPurchaseIndentRequest(payload);
        toast.success("Purchase indent saved.");
      }
      navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (isEditMode && editId) {
      setEditLoading(true);
      try {
        const res = await getPurchaseIndentRequest(editId);
        setForm(purchaseIndentDocToForm(res?.data));
        setValidationErrors(createEmptyPurchaseIndentValidation());
        setHasTriedSave(false);
      } catch (err) {
        toast.error(err?.message || "Failed to reload indent");
      } finally {
        setEditLoading(false);
      }
      return;
    }
    setForm(emptyPurchaseIndentForm(getUserDisplayName()));
    setValidationErrors(createEmptyPurchaseIndentValidation());
    setHasTriedSave(false);
    setIndentNoLoading(true);
    previewPurchaseIndentNoRequest()
      .then((res) => patchForm({ indentNo: res?.data?.code || "" }))
      .catch((err) => toast.error(err?.message || "Indent number is not available"))
      .finally(() => setIndentNoLoading(false));
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.listPath))} ariaLabel="Back to summary" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.hubPath))}
          >
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.listPath))}
          >
            {PURCHASE_INDENT_PATHS.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEditMode ? "Edit" : "Create"}</span>
        </h1>
      </header>

      <div className={`${styles.wrap} ${indentStyles.pageShell}`}>
        {editLoading ? <p className={styles.editLoading}>Loading purchase indent…</p> : null}

        <div className={`${styles.card}${editLoading ? ` ${styles.cardHidden}` : ""}`}>
          <div className={indentStyles.formScroll}>
            <section className={indentStyles.sectionPanel}>
              <div className={indentStyles.sectionHeader}>
                <div>
                  <h2 className={indentStyles.sectionTitle}>Requisition Details</h2>
                  <p className={indentStyles.sectionSubtitle}>Basic indent information and scheduling</p>
                </div>
                <div className={indentStyles.sectionHeaderMeta}>
                  <span className={`${indentStyles.statusChip} ${indentStyles.statusChipDraft}`}>
                    Status: <strong>Draft</strong>
                  </span>
                  <span className={indentStyles.statusChip}>
                    Total Qty: <strong>{totalQty.toLocaleString("en-IN")}</strong>
                  </span>
                </div>
              </div>
              <div className={indentStyles.sectionBody}>
                {hasTriedSave && validationErrors.hasErrors ? (
                  <div className={styles.validationBanner} style={{ marginBottom: "1rem" }}>
                    <strong>Please fix the following:</strong>
                    <span>
                      {validationErrors.summary.join(" ") || "Resolve highlighted fields and try again."}
                    </span>
                  </div>
                ) : null}
                <div className="sc-field-grid">
                  <InputField label="Indent No." value={indentNoLoading ? "Loading…" : form.indentNo} locked />
                  <div className={styles.fieldStack}>
                    <DateField
                      label="Indent Date"
                      type="date"
                      required
                      value={form.indentDate}
                      onChange={(v) => patchForm({ indentDate: v })}
                    />
                    {validationErrors.indentDate ? (
                      <div className={styles.fieldError}>{validationErrors.indentDate}</div>
                    ) : null}
                  </div>
                  <div className={styles.fieldStack}>
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
                        placeholder="Cost center / department"
                      />
                    )}
                    {validationErrors.department ? (
                      <div className={styles.fieldError}>{validationErrors.department}</div>
                    ) : null}
                  </div>
                  <div className={styles.fieldStack}>
                    <InputField
                      label="Requested By"
                      required
                      value={form.requestedBy}
                      onChange={(v) => patchForm({ requestedBy: v })}
                    />
                    {validationErrors.requestedBy ? (
                      <div className={styles.fieldError}>{validationErrors.requestedBy}</div>
                    ) : null}
                  </div>
                  <SelectField
                    label="Priority"
                    options={INDENT_PRIORITY_OPTIONS}
                    value={form.priority}
                    onChange={(v) => patchForm({ priority: v })}
                  />
                  <DateField
                    label="Required By Date"
                    type="date"
                    value={form.requiredByDate}
                    onChange={(v) => patchForm({ requiredByDate: v })}
                  />
                  <InputField
                    label="Remarks"
                    value={form.remarks}
                    onChange={(v) => patchForm({ remarks: v })}
                    placeholder="Optional header remarks"
                  />
                </div>
              </div>
            </section>

            <PurchaseIndentMpbcdcSections
              form={form}
              setForm={setForm}
              costCenterOptions={departmentOptions}
              costCenterLoading={deptLoading}
            />

            <PurchaseIndentDocumentsSection indentId={editId} disabled={!editId} />

            <section className={indentStyles.sectionPanel}>
              <div className={indentStyles.sectionHeader}>
                <div>
                  <h2 className={indentStyles.sectionTitle}>Material Lines</h2>
                  <p className={indentStyles.sectionSubtitle}>Add materials and quantities for this requisition</p>
                </div>
              </div>
              <div className={indentStyles.sectionBody}>
                <div className={indentStyles.linesToolbar}>
                  <div className={`sc-modal-search ${indentStyles.linesSearch}`}>
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
                    <Plus size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Add Materials
                  </button>
                </div>

                <div className={`im-table-scroll ${indentStyles.linesTableWrap}`}>
                  <table className={`im-table im-table--master ${styles.poLinesTable}`}>
                    <thead>
                      <tr>
                        <th>Material Code</th>
                        <th>Material Name</th>
                        <th>Description</th>
                        <th>UoM</th>
                        <th>Qty</th>
                        <th>Required Date</th>
                        <th>Line Remarks</th>
                        <th aria-label="Remove" />
                      </tr>
                    </thead>
                    <tbody>
                      {pageLines.length === 0 ? (
                        <tr className="im-empty-row">
                          <td colSpan={8} className="im-empty-cell">
                            <div className={styles.addRowHint}>
                              Click <strong>Add Materials</strong> to add material lines to this indent.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageLines.map((row) => (
                          <tr key={row.key}>
                            <td className={styles.cellCenter}>{row.itemNo}</td>
                            <td className={styles.cellEllipsis} title={row.itemName}>
                              {row.itemName}
                            </td>
                            <td className={styles.cellEllipsis} title={row.description}>
                              {row.description}
                            </td>
                            <td className={styles.cellCenter}>{row.uom}</td>
                            <td className={styles.cellCenter}>
                              <input
                                type="number"
                                className={styles.lineInputCompact}
                                min="0"
                                step="any"
                                value={row.qty}
                                onChange={(e) => patchLine(row.key, { qty: e.target.value })}
                              />
                            </td>
                            <td className={styles.cellCenter}>
                              <input
                                type="date"
                                className={styles.lineInputCompact}
                                value={row.requiredDate}
                                onChange={(e) => patchLine(row.key, { requiredDate: e.target.value })}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={styles.lineInputCompact}
                                value={row.lineRemarks}
                                onChange={(e) => patchLine(row.key, { lineRemarks: e.target.value })}
                              />
                            </td>
                            <td className={styles.actionCell}>
                              <button
                                type="button"
                                className={styles.lineIconBtn}
                                aria-label="Remove line"
                                onClick={() => removeLine(row.key)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {validationErrors.linesGeneral ? (
                  <div className={styles.tableError}>{validationErrors.linesGeneral}</div>
                ) : null}
              </div>
            </section>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Back"
                onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.listPath))}
              >
                <ArrowLeft size={18} />
              </button>
              {!isEditMode ? (
                <span className={indentStyles.devHint}>Alt+F1 — fill sample data</span>
              ) : null}
            </div>
            <div className={styles.footerRight}>
              <button type="button" className={styles.btnAux} onClick={handleReset} disabled={saving}>
                Reset
              </button>
              <button type="button" className={styles.btnSave} disabled={saving || editLoading} onClick={handleSave}>
                {saving ? "Saving…" : isEditMode ? "Update" : "Save"}
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
    </div>
  );
}
