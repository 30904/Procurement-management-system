import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SearchIcon from "../../assets/search-icon.svg?react";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import JwoJobWorkerLookupModal from "../../components/purchase/JwoJobWorkerLookupModal.jsx";
import JwoJwiLinePickerModal from "../../components/purchase/JwoJwiLinePickerModal.jsx";
import JwoTermsModal from "../../components/purchase/JwoTermsModal.jsx";
import JwoRemarksModal from "../../components/purchase/JwoRemarksModal.jsx";
import { appPath } from "../../config/navigation.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import {
  createJobWorkOrderRequest,
  getJobWorkOrderRequest,
  listItemMasterBySupplierRequest,
  listItemMasterRequest,
  listSupplierMasterRequest,
  previewJobWorkOrderNoRequest,
  updateJobWorkOrderRequest,
} from "../../services/api.js";
import { normalizeJwoLine } from "../../utils/jwoCalculations.js";
import {
  JWO_LIST_PATH,
  JWO_TYPE_OPTIONS,
  computeFormJwoValue,
  emptyJobWorkOrderForm,
  emptyJwoLineFromItem,
  jobWorkOrderDocToForm,
  jobWorkOrderFormToPayload,
} from "../../utils/jobWorkOrderFormState.js";
import formStyles from "./ServicePurchaseOrderCreatePage.module.css";
import jwoStyles from "./JobWorkOrderCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validateForm(form, locationId) {
  const errors = {};
  if (!form.jobWorkerId) errors.jobWorkerId = "Job worker is required";
  if (!locationId) errors.location = "Select a location from the header";
  const t = form.jwoTerms || {};
  if (!t.shipToLocationId) errors.jwoTerms = "Complete JWO Terms (Ship To location)";
  if (!t.modeOfTransport) errors.jwoTerms = "Complete JWO Terms (Mode of transport)";
  if (!t.freightTerms) errors.jwoTerms = "Complete JWO Terms (Freight terms)";
  if (!t.transporterId) errors.jwoTerms = "Complete JWO Terms (Transporter)";
  if (!t.paymentTerms) errors.jwoTerms = "Complete JWO Terms (Payment terms)";
  if (!t.jwoValidity) errors.jwoTerms = "Complete JWO Terms (JWO validity)";
  const hasQty = form.lines.some((row) => Number(row.qty) > 0);
  if (!hasQty) errors.lines = "Add at least one line with quantity";
  return errors;
}

export default function JobWorkOrderCreatePage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const toast = useToast();
  const { activeLocation, activeLocationId } = useLocationScope();
  const [form, setForm] = useState(emptyJobWorkOrderForm);
  const [saving, setSaving] = useState(false);
  const [jwoNoLoading, setJwoNoLoading] = useState(!isEditMode);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [suppliers, setSuppliers] = useState([]);
  const [itemCatalog, setItemCatalog] = useState([]);
  const [workerOpen, setWorkerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [lineQuery, setLineQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLine = useCallback((key, patch) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((row) => {
        if (row.key !== key) return row;
        const merged = { ...row, ...patch };
        return { ...merged, ...normalizeJwoLine(merged, 0) };
      }),
    }));
  }, []);

  const removeLine = useCallback((key) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((row) => row.key !== key) }));
  }, []);

  const jwoValue = useMemo(() => computeFormJwoValue(form), [form]);
  const headerLocationId = useMemo(
    () => String(activeLocation?._id || activeLocationId || ""),
    [activeLocation, activeLocationId]
  );

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    if (!q) return form.lines;
    return form.lines.filter((row) =>
      [row.jwiNo, row.jwiItemName, row.jwiItemDescription, row.serviceDescription, row.sacCode].some(
        (v) => String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [form.lines, lineQuery]);

  const termsComplete = useMemo(() => {
    const t = form.jwoTerms || {};
    return Boolean(
      t.shipToLocationId &&
        t.modeOfTransport &&
        t.freightTerms &&
        t.transporterId &&
        t.paymentTerms &&
        t.jwoValidity
    );
  }, [form.jwoTerms]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listSupplierMasterRequest();
        if (!cancelled) setSuppliers(Array.isArray(res?.data) ? res.data : []);
      } catch {
        if (!cancelled) setSuppliers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadItemsForWorker = useCallback(
    async (supplierId) => {
      if (!supplierId) {
        setItemCatalog([]);
        return;
      }
      try {
        const res = await listItemMasterBySupplierRequest(supplierId);
        let items = Array.isArray(res?.data) ? res.data : [];
        if (!items.length) {
          const allRes = await listItemMasterRequest();
          items = Array.isArray(allRes?.data) ? allRes.data : [];
          toast.info("No materials linked to this job worker; showing all active materials.");
        }
        setItemCatalog(items);
      } catch {
        setItemCatalog([]);
        toast.error("Failed to load items for job worker");
      }
    },
    [toast]
  );

  useEffect(() => {
    if (isEditMode) return;
    let cancelled = false;
    (async () => {
      setJwoNoLoading(true);
      try {
        const res = await previewJobWorkOrderNoRequest();
        if (!cancelled) patchForm({ jwoNo: res?.data?.code || "" });
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "JWO number preview unavailable");
      } finally {
        if (!cancelled) setJwoNoLoading(false);
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
        const res = await getJobWorkOrderRequest(editId);
        const doc = res?.data;
        if (!cancelled) {
          if (doc?.status !== "Draft") {
            toast.error("Only draft JWOs can be edited.");
            navigate(appPath(JWO_LIST_PATH), { replace: true });
            return;
          }
          setForm(jobWorkOrderDocToForm(doc));
          if (doc.jobWorkerId) await loadItemsForWorker(String(doc.jobWorkerId));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load JWO");
          navigate(appPath(JWO_LIST_PATH), { replace: true });
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate, toast, loadItemsForWorker]);

  const handleAddItems = (selected) => {
    const existing = new Set(form.lines.map((row) => String(row.jwiId || "")));
    const additions = [];
    for (const item of selected) {
      const sid = String(item._id || item.id);
      if (existing.has(sid)) continue;
      existing.add(sid);
      additions.push(emptyJwoLineFromItem(item));
    }
    if (!additions.length) {
      toast.info("Selected items are already on this JWO.");
      return;
    }
    setForm((prev) => ({ ...prev, lines: [...prev.lines, ...additions] }));
    setItemPickerOpen(false);
  };

  const handleReset = () => {
    setForm(emptyJobWorkOrderForm());
    setErrors({});
    setHasTriedSave(false);
    setLineQuery("");
    setItemCatalog([]);
    if (!isEditMode) {
      previewJobWorkOrderNoRequest()
        .then((res) => patchForm({ jwoNo: res?.data?.code || "" }))
        .catch(() => {});
    }
  };

  const handleSave = async () => {
    setHasTriedSave(true);
    const nextErrors = validateForm(form, headerLocationId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(nextErrors.jwoTerms || "Please complete required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = jobWorkOrderFormToPayload({ ...form, locationId: headerLocationId });
      if (isEditMode) {
        await updateJobWorkOrderRequest(editId, payload);
        toast.success("Job work order updated.");
      } else {
        await createJobWorkOrderRequest(payload);
        toast.success("Job work order saved.");
      }
      navigate(appPath(JWO_LIST_PATH), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to save JWO");
    } finally {
      setSaving(false);
    }
  };

  if (editLoading || jwoNoLoading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p style={{ padding: "1rem" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(JWO_LIST_PATH))} ariaLabel="Back to JWO summary" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase/job-work"))}>
            Job Work
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEditMode ? "Edit JWO" : "Create JWO"}</span>
        </h1>
      </header>

      <div className={formStyles.pageWrap}>
        <section className={formStyles.formShell}>
          <div className={formStyles.formHeaderBar}>
            <h2>{isEditMode ? "Edit Job Work Order" : "Job Work Order Entry"}</h2>
          </div>

          <div className={formStyles.headerGrid}>
            <div>
              <label className="sc-label">JWO No.</label>
              <input className="sc-input sc-input--locked" value={form.jwoNo} disabled />
            </div>
            <DateField label="JWO Date" value={form.jwoDate} onChange={(v) => patchForm({ jwoDate: v })} />
            <div className={formStyles.providerField}>
              <label className="sc-label">
                Job Worker Name <span className={formStyles.required}>*</span>
              </label>
              <div className={formStyles.providerRow}>
                <input
                  className="sc-input sc-input--locked"
                  value={form.jobWorkerName}
                  readOnly
                  placeholder="Select job worker"
                />
                <button
                  type="button"
                  className={formStyles.lookupBtn}
                  aria-label="Lookup job worker"
                  onClick={() => setWorkerOpen(true)}
                >
                  <Search size={16} />
                </button>
              </div>
              {hasTriedSave && errors.jobWorkerId ? (
                <span className={formStyles.fieldError}>{errors.jobWorkerId}</span>
              ) : null}
            </div>
            <div>
              <label className="sc-label">Order Reference</label>
              <input
                className="sc-input"
                value={form.orderReferenceNo}
                onChange={(e) => patchForm({ orderReferenceNo: e.target.value })}
              />
            </div>
            <SelectField
              label={
                <>
                  JWO Type <span className={formStyles.required}>*</span>
                </>
              }
              options={JWO_TYPE_OPTIONS}
              value={form.jwoType}
              onChange={(v) => patchForm({ jwoType: v })}
            />
            <div>
              <label className="sc-label">Ccy</label>
              <input
                className="sc-input"
                value={form.currency}
                onChange={(e) => patchForm({ currency: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className={formStyles.formBody}>
            <div className={formStyles.linesToolbar}>
              <div className={`erp-search-wrap ${formStyles.linesSearch}`}>
                <SearchIcon className="erp-search-icon" />
                <input
                  type="text"
                  className="erp-search-input"
                  placeholder="Search lines…"
                  value={lineQuery}
                  onChange={(e) => setLineQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className={formStyles.btnSecondary}
                style={{ padding: "0.4rem 0.85rem" }}
                disabled={!form.jobWorkerId}
                onClick={() => {
                  if (!form.jobWorkerId) {
                    toast.error("Select a job worker first.");
                    return;
                  }
                  setItemPickerOpen(true);
                }}
              >
                Add JWI Lines
              </button>
            </div>

            <div className={formStyles.linesTableWrap}>
              <table className={`im-table ${formStyles.spoLinesTable}`}>
                <thead>
                  <tr>
                    <th className={formStyles.colSn}>SN.</th>
                    <th className={formStyles.colServiceNo}>JWI No.</th>
                    <th className={formStyles.colDesc}>JWI Material Name</th>
                    <th className={formStyles.colDetails}>JWI Material Description</th>
                    <th className={formStyles.colSac}>Service Description</th>
                    <th className={formStyles.colGst}>SAC</th>
                    <th className={formStyles.colQty}>UoM</th>
                    <th className={formStyles.colRate}>JWO Qty</th>
                    <th className={formStyles.colDisc}>Rate/Unit</th>
                    <th className={formStyles.colNetRate}>JWO Amt.</th>
                    <th className={formStyles.colSchedule}>Sch.</th>
                    <th className={formStyles.colAction} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredLines.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                        {hasTriedSave && errors.lines
                          ? errors.lines
                          : form.jobWorkerId
                            ? "Add job work items (JWI) from Material Master"
                            : "Select a job worker, then add JWI lines"}
                      </td>
                    </tr>
                  ) : (
                    filteredLines.map((row, idx) => (
                      <tr key={row.key}>
                        <td className={formStyles.cellCenter}>{idx + 1}</td>
                        <td className={`${formStyles.cellCenter} ${formStyles.cellEllipsis}`} title={row.jwiNo}>
                          {row.jwiNo || "—"}
                        </td>
                        <td className={formStyles.colDesc}>
                          <span className={formStyles.descText} title={row.jwiItemName}>
                            {row.jwiItemName}
                          </span>
                        </td>
                        <td className={formStyles.colDesc}>
                          <span className={formStyles.descText} title={row.jwiItemDescription}>
                            {row.jwiItemDescription}
                          </span>
                        </td>
                        <td className={formStyles.colDetails}>
                          <input
                            className={formStyles.lineInput}
                            value={row.serviceDescription}
                            onChange={(e) => patchLine(row.key, { serviceDescription: e.target.value })}
                          />
                        </td>
                        <td className={formStyles.cellCenter}>{row.sacCode}</td>
                        <td className={formStyles.cellCenter}>{row.uom}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className={`${formStyles.lineInput} ${formStyles.lineInputNum}`}
                            value={row.qty}
                            onChange={(e) => patchLine(row.key, { qty: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className={`${formStyles.lineInput} ${formStyles.lineInputNum}`}
                            value={row.rate}
                            onChange={(e) => patchLine(row.key, { rate: e.target.value })}
                          />
                        </td>
                        <td className={formStyles.cellNum}>{formatMoney(row.jwoAmount)}</td>
                        <td>
                          <input
                            type="date"
                            className={`${formStyles.lineInput} ${formStyles.lineInputDate}`}
                            value={row.scheduleDate || ""}
                            onChange={(e) => patchLine(row.key, { scheduleDate: e.target.value })}
                          />
                        </td>
                        <td className={formStyles.cellCenter}>
                          <button
                            type="button"
                            className={formStyles.removeBtn}
                            onClick={() => removeLine(row.key)}
                            aria-label="Remove line"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={jwoStyles.footerBar}>
            <button type="button" className={jwoStyles.termsBtn} onClick={() => setTermsOpen(true)}>
              JWO Terms
            </button>
            <button type="button" className={jwoStyles.termsBtn} onClick={() => setRemarksOpen(true)}>
              JWO Remarks
            </button>
            <div className={jwoStyles.jwoValueChip}>
              JWO Value : {form.currency} {formatMoney(jwoValue.totalJwoValue)}
            </div>
            {hasTriedSave && errors.jwoTerms ? (
              <span className={jwoStyles.termsHint}>{errors.jwoTerms}</span>
            ) : !termsComplete ? (
              <span className={jwoStyles.termsHint}>Open JWO Terms and complete required fields before save.</span>
            ) : null}
          </div>

          <div className={formStyles.formActions}>
            <button
              type="button"
              className={`${formStyles.btnAction} ${formStyles.btnSecondary}`}
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="button"
              className={`${formStyles.btnAction} ${formStyles.btnPrimary}`}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </section>
      </div>

      <JwoJobWorkerLookupModal
        open={workerOpen}
        supplierRows={suppliers}
        selectedSupplierId={form.jobWorkerId}
        onClose={() => setWorkerOpen(false)}
        onApply={(row) => {
          const id = String(row._id || row.id);
          patchForm({
            jobWorkerId: id,
            jobWorkerCode: row.supplierCode || "",
            jobWorkerName: row.supplierName || "",
            jwoTerms: {
              ...form.jwoTerms,
              paymentTerms: row.supplierPaymentTerms || form.jwoTerms?.paymentTerms || "",
            },
          });
          loadItemsForWorker(id);
          setWorkerOpen(false);
        }}
      />

      <JwoJwiLinePickerModal
        open={itemPickerOpen}
        itemRows={itemCatalog}
        onClose={() => setItemPickerOpen(false)}
        onApply={handleAddItems}
      />

      <JwoTermsModal
        open={termsOpen}
        terms={form.jwoTerms}
        onClose={() => setTermsOpen(false)}
        onSave={(terms) => patchForm({ jwoTerms: terms })}
      />

      <JwoRemarksModal
        open={remarksOpen}
        value={form.jwoRemarks}
        onClose={() => setRemarksOpen(false)}
        onSave={(text) => patchForm({ jwoRemarks: text })}
      />
    </div>
  );
}
