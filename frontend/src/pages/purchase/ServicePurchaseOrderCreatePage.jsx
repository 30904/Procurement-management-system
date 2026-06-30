import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Search, Trash2 } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SearchIcon from "../../assets/search-icon.svg?react";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import SpoServiceProviderLookupModal from "../../components/purchase/SpoServiceProviderLookupModal.jsx";
import SpoServiceLinePickerModal from "../../components/purchase/SpoServiceLinePickerModal.jsx";
import { appPath } from "../../config/navigation.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import {
  createServicePurchaseOrderRequest,
  getServicePurchaseOrderRequest,
  listLogisticsMasterRequest,
  listPaymentTermsMasterRequest,
  listServicePurchaseOrderServicesRequest,
  previewServicePurchaseOrderNoRequest,
  submitServicePurchaseOrderAmendmentRequest,
  updateServicePurchaseOrderAmendmentRequest,
  updateServicePurchaseOrderRequest,
} from "../../services/api.js";
import { normalizeSpoLine } from "../../utils/spoCalculations.js";
import {
  AMEND_SPO_LIST_PATH,
  SPO_CATEGORY_OPTIONS,
  SPO_LIST_PATH,
  computeFormSpoValue,
  emptyServicePurchaseOrderForm,
  emptySpoLineFromService,
  servicePurchaseOrderDocToForm,
  servicePurchaseOrderFormToPayload,
} from "../../utils/servicePurchaseOrderFormState.js";
import formStyles from "./ServicePurchaseOrderCreatePage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paymentTermsMasterToOptions(rows) {
  return (rows || [])
    .filter((r) => String(r.status || "Active") === "Active")
    .sort(
      (a, b) =>
        (Number(a.displayOrder ?? a.order) || 0) - (Number(b.displayOrder ?? b.order) || 0) ||
        String(a.description ?? "").localeCompare(String(b.description ?? ""))
    )
    .map((r) => {
      const label = String(r.description ?? r.paymentTermsCode ?? "").trim();
      return { value: label, label };
    })
    .filter((o) => o.value);
}

function validateForm(form, locationId) {
  const errors = {};
  if (!form.serviceProviderId) errors.serviceProviderId = "Service provider is required";
  if (!locationId) errors.location = "Select a location from the header";
  if (!form.spoValidity) errors.spoValidity = "SPO validity is required";
  const hasQty = form.lines.some((row) => Number(row.qty) > 0);
  if (!hasQty) errors.lines = "Add at least one line with quantity";
  return errors;
}

export default function ServicePurchaseOrderCreatePage({ amendMode = false }) {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const listPath = amendMode ? AMEND_SPO_LIST_PATH : SPO_LIST_PATH;
  const toast = useToast();
  const { activeLocation, activeLocationId } = useLocationScope();
  const [form, setForm] = useState(emptyServicePurchaseOrderForm);
  const [saving, setSaving] = useState(false);
  const [spoNoLoading, setSpoNoLoading] = useState(!isEditMode);
  const [editLoading, setEditLoading] = useState(isEditMode);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([]);
  const [providerOpen, setProviderOpen] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [lineQuery, setLineQuery] = useState("");
  const [errors, setErrors] = useState({});
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const [amendPending, setAmendPending] = useState(false);

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchLine = useCallback((key, patch) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((row) => {
        if (row.key !== key) return row;
        const merged = { ...row, ...patch };
        return { ...merged, ...normalizeSpoLine(merged, 0) };
      }),
    }));
  }, []);

  const removeLine = useCallback((key) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((row) => row.key !== key) }));
  }, []);

  const spoValue = useMemo(() => computeFormSpoValue(form), [form]);

  const headerLocationId = useMemo(
    () => String(activeLocation?._id || activeLocationId || ""),
    [activeLocation, activeLocationId]
  );

  const paymentSelectOptions = useMemo(
    () => [{ value: "", label: "Select Payment Terms" }, ...paymentTermsOptions],
    [paymentTermsOptions]
  );

  const filteredLines = useMemo(() => {
    const q = lineQuery.trim().toLowerCase();
    if (!q) return form.lines;
    return form.lines.filter((row) =>
      [row.serviceNo, row.sacCode, row.description, row.serviceDetails].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [form.lines, lineQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [provRes, svcRes, ptRes] = await Promise.all([
          listLogisticsMasterRequest(),
          listServicePurchaseOrderServicesRequest(),
          listPaymentTermsMasterRequest(),
        ]);
        if (cancelled) return;
        setProviders(Array.isArray(provRes?.data) ? provRes.data : []);
        setServices(Array.isArray(svcRes?.data) ? svcRes.data : []);
        setPaymentTermsOptions(paymentTermsMasterToOptions(ptRes?.data));
      } catch {
        if (!cancelled) {
          setProviders([]);
          setServices([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode || amendMode) return;
    let cancelled = false;
    (async () => {
      setSpoNoLoading(true);
      try {
        const res = await previewServicePurchaseOrderNoRequest({
          serviceCategory: form.serviceCategory,
        });
        if (!cancelled) patchForm({ spoNo: res?.data?.code || "" });
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "SPO number preview unavailable");
      } finally {
        if (!cancelled) setSpoNoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, amendMode, form.serviceCategory, patchForm, toast]);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    let cancelled = false;
    (async () => {
      setEditLoading(true);
      try {
        const res = await getServicePurchaseOrderRequest(editId);
        const doc = res?.data;
        if (!cancelled) {
          if (amendMode) {
            if (!doc || doc.status !== "Approved") {
              toast.error("Only approved SPOs can be amended.");
              navigate(appPath(listPath), { replace: true });
              return;
            }
            if (String(doc.receiptStatus || "") !== "Not Started") {
              toast.error("SPO cannot be amended after service receipt has started.");
              navigate(appPath(listPath), { replace: true });
              return;
            }
          } else if (doc?.status !== "Draft") {
            toast.error("Only draft SPOs can be edited.");
            navigate(appPath(listPath), { replace: true });
            return;
          }
          const amendSource =
            amendMode && doc.amendStatus === "Pending" && doc.pendingAmendment
              ? {
                  ...doc,
                  ...doc.pendingAmendment,
                  spoNo: doc.spoNo,
                  status: doc.status,
                  serviceProviderId: doc.serviceProviderId,
                  serviceProviderName: doc.serviceProviderName,
                  locationId: doc.locationId,
                }
              : doc;
          setForm(servicePurchaseOrderDocToForm(amendSource));
          if (amendMode) setAmendPending(doc.amendStatus === "Pending");
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load SPO");
          navigate(appPath(listPath), { replace: true });
        }
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate, toast]);

  const handleAddServices = (selected) => {
    const existingIds = new Set(form.lines.map((row) => String(row.serviceId || "")));
    const additions = [];
    for (const svc of selected) {
      const sid = String(svc._id || svc.id);
      if (existingIds.has(sid)) continue;
      existingIds.add(sid);
      additions.push(emptySpoLineFromService(svc));
    }
    if (!additions.length) {
      toast.info("Selected services are already on this SPO.");
      return;
    }
    setForm((prev) => ({ ...prev, lines: [...prev.lines, ...additions] }));
    setServicePickerOpen(false);
  };

  const handleReset = () => {
    setForm(emptyServicePurchaseOrderForm());
    setErrors({});
    setHasTriedSave(false);
    setLineQuery("");
  };

  const handleSave = async () => {
    setHasTriedSave(true);
    const nextErrors = validateForm(form, headerLocationId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Please complete required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = servicePurchaseOrderFormToPayload({
        ...form,
        locationId: headerLocationId,
      });
      if (amendMode && isEditMode) {
        const res = amendPending
          ? await updateServicePurchaseOrderAmendmentRequest(editId, payload)
          : await submitServicePurchaseOrderAmendmentRequest(editId, payload);
        toast.success(
          res?.data?.spoNo
            ? `Amendment submitted for ${res.data.spoNo}. Approve from Amend SPO summary.`
            : "Amendment submitted."
        );
      } else if (isEditMode) {
        await updateServicePurchaseOrderRequest(editId, payload);
        toast.success("Service purchase order updated.");
      } else {
        await createServicePurchaseOrderRequest(payload);
        toast.success("Service purchase order saved.");
      }
      navigate(appPath(listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to save SPO");
    } finally {
      setSaving(false);
    }
  };

  if (editLoading || (!amendMode && spoNoLoading)) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p style={{ padding: "1rem" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(listPath))} ariaLabel="Back to SPO summary" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(listPath))}>
            {amendMode ? "Amend SPO" : "Generate SPO"}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">
            {amendMode ? (isEditMode ? "Amend" : "New") : isEditMode ? "Edit SPO" : "Create SPO"}
          </span>
        </h1>
      </header>

      <div className={formStyles.pageWrap}>
      <section className={formStyles.formShell}>
        <div className={formStyles.formHeaderBar}>
          <h2>
            {amendMode
              ? isEditMode
                ? "Amend Service Purchase Order"
                : "Amend SPO"
              : isEditMode
                ? "Edit Service Purchase Order"
                : "Create Service Purchase Order"}
          </h2>
        </div>

        <div className={formStyles.headerGrid}>
          <SelectField
            label={
              <>
                Service Category <span className={formStyles.required}>*</span>
              </>
            }
            options={SPO_CATEGORY_OPTIONS}
            value={form.serviceCategory}
            onChange={(v) => patchForm({ serviceCategory: v })}
            disabled={isEditMode || amendMode}
          />
          <div>
            <label className="sc-label">SPO No.</label>
            <input className="sc-input sc-input--locked" value={form.spoNo} disabled />
          </div>
          <DateField label="SPO Date" value={form.spoDate} onChange={(v) => patchForm({ spoDate: v })} />
          <div className={formStyles.providerField}>
            <label className="sc-label">
              Service Provider Name <span className={formStyles.required}>*</span>
            </label>
            <div className={formStyles.providerRow}>
              <input
                className="sc-input sc-input--locked"
                value={form.serviceProviderName}
                readOnly
                placeholder="Select provider"
              />
              <button
                type="button"
                className={formStyles.lookupBtn}
                aria-label="Lookup service provider"
                onClick={() => setProviderOpen(true)}
              >
                <Search size={16} />
              </button>
            </div>
            {hasTriedSave && errors.serviceProviderId ? (
              <span className={formStyles.fieldError}>{errors.serviceProviderId}</span>
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
              onClick={() => setServicePickerOpen(true)}
            >
              Add from Service Master
            </button>
          </div>

          <div className={formStyles.linesTableWrap}>
            <table className={`im-table ${formStyles.spoLinesTable}`}>
              <thead>
                <tr>
                  <th className={formStyles.colSn}>SN.</th>
                  <th className={formStyles.colServiceNo}>Service No.</th>
                  <th className={formStyles.colSac}>SAC Code</th>
                  <th className={formStyles.colDesc}>Description of Services</th>
                  <th className={formStyles.colDetails}>Service Details</th>
                  <th className={formStyles.colGst}>GST%</th>
                  <th className={formStyles.colQty}>Qty</th>
                  <th className={formStyles.colRate}>Rate/Unit</th>
                  <th className={formStyles.colDisc}>Disc %</th>
                  <th className={formStyles.colNetRate}>Net Rate</th>
                  <th className={formStyles.colLineValue}>Line Value</th>
                  <th className={formStyles.colSchedule}>Sched. Date</th>
                  <th className={formStyles.colAction} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredLines.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                      {hasTriedSave && errors.lines ? errors.lines : "Add services from Purchase Service Master"}
                    </td>
                  </tr>
                ) : (
                  filteredLines.map((row, idx) => (
                    <tr key={row.key}>
                      <td className={formStyles.cellCenter}>{idx + 1}</td>
                      <td className={`${formStyles.cellCenter} ${formStyles.cellEllipsis}`} title={row.serviceNo}>
                        {row.serviceNo || "—"}
                      </td>
                      <td className={`${formStyles.cellCenter} ${formStyles.cellEllipsis}`} title={row.sacCode}>
                        {row.sacCode}
                      </td>
                      <td className={formStyles.colDesc}>
                        <span className={formStyles.descText} title={row.description}>
                          {row.description}
                        </span>
                      </td>
                      <td className={formStyles.colDetails}>
                        <input
                          className={formStyles.lineInput}
                          value={row.serviceDetails}
                          onChange={(e) => patchLine(row.key, { serviceDetails: e.target.value })}
                        />
                      </td>
                      <td className={formStyles.cellNum}>{Number(row.gstRate || 0).toFixed(2)}</td>
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
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          className={`${formStyles.lineInput} ${formStyles.lineInputNum}`}
                          value={row.discPercent}
                          onChange={(e) => patchLine(row.key, { discPercent: e.target.value })}
                        />
                      </td>
                      <td className={formStyles.cellNum}>{formatMoney(row.netRate)}</td>
                      <td className={formStyles.cellNum}>{formatMoney(row.lineValue)}</td>
                      <td>
                        <input
                          type="date"
                          className={`${formStyles.lineInput} ${formStyles.lineInputDate}`}
                          value={row.serviceScheduleDate || ""}
                          onChange={(e) => patchLine(row.key, { serviceScheduleDate: e.target.value })}
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

        <div className={formStyles.footerGrid}>
          <div>
            <label className="sc-label">SPO Remarks</label>
            <input
              className="sc-input"
              value={form.spoRemarks}
              onChange={(e) => patchForm({ spoRemarks: e.target.value })}
            />
          </div>
          <DateField
            label={
              <>
                SPO Validity <span className={formStyles.required}>*</span>
              </>
            }
            value={form.spoValidity}
            onChange={(v) => patchForm({ spoValidity: v })}
          />
          {hasTriedSave && errors.spoValidity ? (
            <span className={formStyles.fieldError}>{errors.spoValidity}</span>
          ) : null}
          <SelectField
            label="Payment Terms"
            options={paymentSelectOptions}
            value={form.paymentTerms}
            onChange={(v) => patchForm({ paymentTerms: v })}
          />
          <div className={formStyles.footerTotal}>
            Total SPO Value : {form.currency} {formatMoney(spoValue.totalSpoValue)}
          </div>
        </div>

        <div className={formStyles.formActions}>
          <button
            type="button"
            className={`${formStyles.btnAction} ${formStyles.btnSecondary}`}
            onClick={handleReset}
            disabled={saving}
            title="Clear form"
          >
            Reset
          </button>
          <button
            type="button"
            className={`${formStyles.btnAction} ${formStyles.btnPrimary}`}
            disabled={saving}
            title={
              amendMode
                ? "Submit amendment for approval"
                : isEditMode
                  ? "Update service purchase order"
                  : "Save service purchase order"
            }
            onClick={handleSave}
          >
            {saving ? "Saving…" : amendMode ? "Submit Amendment" : "Save"}
          </button>
        </div>
      </section>
      </div>

      <SpoServiceProviderLookupModal
        open={providerOpen}
        providerRows={providers}
        selectedProviderId={form.serviceProviderId}
        onClose={() => setProviderOpen(false)}
        onApply={(row) => {
          patchForm({
            serviceProviderId: String(row._id || row.id),
            serviceProviderName: row.lspNameLegalEntity || row.lspNickName || "",
          });
          setProviderOpen(false);
        }}
      />

      <SpoServiceLinePickerModal
        open={servicePickerOpen}
        serviceRows={services}
        onClose={() => setServicePickerOpen(false)}
        onApply={handleAddServices}
      />
    </div>
  );
}
