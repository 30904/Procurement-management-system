import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import { appPath } from "../../config/navigation.js";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import ServiceSacLookupModal from "../../components/modals/ServiceSacLookupModal.jsx";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  createServiceMasterR1Request,
  getServiceMasterR1Request,
  listSacPMasterRequest,
  previewServiceR1CodeRequest,
  updateServiceMasterR1Request,
} from "../../services/api.js";
import {
  EMPTY_SERVICE_MPBCDC,
  SERVICE_APPROVAL_STATUS_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/mpbcdcMasterOptions.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ItemMasterPage.module.css";
import sectionStyles from "./SupplierCreatePage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const STATUS_OPTIONS = ["Active", "Inactive"];

function buildInitialForm() {
  return {
    serviceId: "",
    serviceCategory: "",
    serviceName: "",
    serviceDescription: "",
    uom: "",
    gstRegimeApplicability: "",
    sacCode: "",
    taxabilityType: "",
    gstRate: "",
    rcmApplicability: "",
    itcAllowed: "",
    tdsApplicability: "",
    tdsSection: "",
    tdsRate: "",
    costCenter: "",
    status: "Active",
    mpbcdcService: { ...EMPTY_SERVICE_MPBCDC },
  };
}

function mapMpbcdcService(doc) {
  const s = doc?.mpbcdcService || {};
  return {
    serviceType: s.serviceType ?? "",
    gemApplicable: s.gemApplicable ?? "",
    approvalStatus: s.approvalStatus ?? "Draft",
  };
}

function formatRate(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function normalizeRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
    serviceId: doc?.serviceId ?? "",
    serviceCategory: doc?.serviceCategory ?? "",
    serviceName: doc?.serviceName ?? "",
    serviceDescription: doc?.serviceDescription ?? "",
    uom: doc?.uom ?? "",
    gstRegimeApplicability: doc?.gstRegimeApplicability ?? "",
    sacCode: doc?.sacCode ?? "",
    taxabilityType: doc?.taxabilityType ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    rcmApplicability: doc?.rcmApplicability ?? "",
    itcAllowed: doc?.itcAllowed ?? "",
    tdsApplicability: doc?.tdsApplicability ?? "",
    tdsSection: doc?.tdsSection ?? "",
    tdsRate: doc?.tdsRate != null ? String(doc.tdsRate) : "",
    costCenter: doc?.costCenter ?? "",
    status: doc?.status || "Active",
    revNumber: Number(doc?.revNumber ?? 0),
    mpbcdcService: mapMpbcdcService(doc),
  };
}

function normalizeSacRow(doc) {
  return {
    ...doc,
    _id: doc?._id != null ? String(doc._id) : String(doc?.id ?? doc?.sacCode ?? ""),
    id: doc?._id != null ? String(doc._id) : String(doc?.id ?? doc?.sacCode ?? ""),
    sacCode: doc?.sacCode ?? "",
    description: doc?.description ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    status: doc?.status || "Active",
  };
}

function formToPayload(form) {
  return {
    serviceCategory: form.serviceCategory,
    serviceName: form.serviceName.trim(),
    serviceDescription: form.serviceDescription.trim(),
    uom: form.uom,
    gstRegimeApplicability: form.gstRegimeApplicability,
    sacCode: form.sacCode,
    taxabilityType: form.taxabilityType,
    gstRate: Number(form.gstRate || 0),
    rcmApplicability: form.rcmApplicability,
    itcAllowed: form.itcAllowed,
    tdsApplicability: form.tdsApplicability,
    tdsSection: form.tdsSection,
    tdsRate: Number(form.tdsRate || 0),
    costCenter: form.costCenter,
    status: form.status,
    mpbcdcService: {
      serviceType: form.mpbcdcService?.serviceType || "",
      gemApplicable: form.mpbcdcService?.gemApplicable || "",
      approvalStatus: form.mpbcdcService?.approvalStatus || "Draft",
    },
  };
}

export default function ServiceMasterR1UpsertPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();
  const [form, setForm] = useState(buildInitialForm);
  const [editRow, setEditRow] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [sacLookupOpen, setSacLookupOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [sacRows, setSacRows] = useState([]);

  const { options: serviceCategoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.SERVICE_CATEGORY);
  const { options: uomOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.UOM);
  const { options: gstRegimeOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.GST_REGIME_APPLICABILITY);
  const { options: taxabilityOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.TAXABILITY_TYPE);
  const { options: rcmOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.RCM_APPLICABILITY);
  const { options: itcOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.ITC_ALLOWED);
  const { options: tdsApplicabilityOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.TDS_APPLICABILITY);
  const { options: tdsSectionOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.TDS_SECTION);
  const { options: tdsRateOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.TDS_RATE);
  const { options: costCenterOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.COST_CENTER);

  const sacMap = useMemo(() => {
    const map = new Map();
    sacRows.forEach((row) => map.set(String(row.sacCode), row));
    return map;
  }, [sacRows]);

  const fetchSac = useCallback(async () => {
    try {
      const res = await listSacPMasterRequest();
      setSacRows((Array.isArray(res?.data) ? res.data : []).map(normalizeSacRow));
    } catch {
      setSacRows([]);
    }
  }, []);

  useEffect(() => {
    fetchSac();
  }, [fetchSac]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getServiceMasterR1Request(id);
        if (cancelled) return;
        const doc = normalizeRow(res?.data || {});
        setEditRow(doc);
        setForm({ ...buildInitialForm(), ...doc, gstRate: formatRate(doc.gstRate || 0) });
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load service");
          navigate(appPath("masters/purchase/service-master-r1"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isEdit, id, navigate, toast]);

  useEffect(() => {
    if (isEdit || !form.serviceCategory) return;
    let cancelled = false;
    previewServiceR1CodeRequest(form.serviceCategory)
      .then((res) => {
        if (!cancelled) setForm((prev) => ({ ...prev, serviceId: res?.data?.code || "" }));
      })
      .catch(() => {
        if (!cancelled) setForm((prev) => ({ ...prev, serviceId: "" }));
      });
    return () => { cancelled = true; };
  }, [isEdit, form.serviceCategory]);

  const setCategory = async (serviceCategory) => {
    setForm((prev) => ({ ...prev, serviceCategory, serviceId: isEdit ? prev.serviceId : "" }));
    if (isEdit || !serviceCategory) return;
    try {
      const res = await previewServiceR1CodeRequest(serviceCategory);
      setForm((prev) => ({ ...prev, serviceCategory, serviceId: res?.data?.code || "" }));
    } catch {
      setForm((prev) => ({ ...prev, serviceCategory, serviceId: "" }));
    }
  };

  const handleSacChange = (sacCode) => {
    const sac = sacMap.get(String(sacCode));
    setForm((prev) => ({ ...prev, sacCode, gstRate: sac ? formatRate(sac.gstRate) : "" }));
  };

  const handleReset = () => {
    if (isEdit && editRow) {
      setForm({ ...buildInitialForm(), ...normalizeRow(editRow), gstRate: formatRate(editRow.gstRate || 0) });
    } else {
      setForm(buildInitialForm());
    }
    toast.info("Form reset.");
  };

  const validateForm = () => {
    if (!form.serviceCategory) return toast.error("Service Category is required"), false;
    if (!form.serviceName.trim()) return toast.error("Service Name is required"), false;
    if (!form.uom) return toast.error("UoM is required"), false;
    if (!form.gstRegimeApplicability) return toast.error("GST Regime Applicability is required"), false;
    if (!form.sacCode) return toast.error("SAC Code is required"), false;
    if (!form.taxabilityType) return toast.error("Taxability Type is required"), false;
    if (!form.rcmApplicability) return toast.error("RCM Applicability is required"), false;
    if (!form.itcAllowed) return toast.error("ITC Allowed is required"), false;
    if (!form.tdsApplicability) return toast.error("TDS Applicability is required"), false;
    if (!form.tdsSection) return toast.error("TDS Section is required"), false;
    if (form.tdsRate === "" || Number.isNaN(Number(form.tdsRate))) return toast.error("TDS Rate % is required"), false;
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
      await createServiceMasterR1Request(payload);
      toast.success("Service created.");
      navigate(appPath("masters/purchase/service-master-r1"));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateWithRevision = async (revisionInfo) => {
    if (!editRow || !pendingEditPayload) return;
    setSaving(true);
    try {
      await updateServiceMasterR1Request(editRow._id || editRow.id, { ...pendingEditPayload, revisionInfo });
      toast.success("Service updated.");
      setRevisionModalOpen(false);
      setPendingEditPayload(null);
      navigate(appPath("masters/purchase/service-master-r1"));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  useCreateModalDevFill({
    enabled: !isEdit,
    onFill: () => {
      const category = serviceCategoryOptions[0]?.value || "";
      const sac = sacRows[0];
      setForm((prev) => ({
        ...prev,
        serviceCategory: category,
        serviceName: "Industrial Machine Maintenance Service",
        serviceDescription: "Annual maintenance contract",
        uom: uomOptions[0]?.value || "",
        gstRegimeApplicability: gstRegimeOptions[0]?.value || "",
        sacCode: sac?.sacCode || "",
        taxabilityType: taxabilityOptions[0]?.value || "",
        gstRate: sac ? formatRate(sac.gstRate) : "",
        rcmApplicability: rcmOptions.find((o) => o.label === "No")?.value || rcmOptions[0]?.value || "",
        itcAllowed: itcOptions.find((o) => o.label === "Yes")?.value || itcOptions[0]?.value || "",
        tdsApplicability: tdsApplicabilityOptions.find((o) => o.label === "Yes")?.value || "",
        tdsSection: tdsSectionOptions.find((o) => o.label === "194C")?.value || tdsSectionOptions[0]?.value || "",
        tdsRate: tdsRateOptions.find((o) => o.value === "2")?.value || tdsRateOptions[0]?.value || "2",
        costCenter: costCenterOptions.find((o) => o.label === "Maintenance")?.value || "",
        status: "Active",
      }));
      if (category) {
        previewServiceR1CodeRequest(category)
          .then((res) => setForm((prev) => ({ ...prev, serviceId: res?.data?.code || prev.serviceId })))
          .catch(() => null);
      }
      toast.info("Sample data filled (Alt+F1).");
    },
  });

  if (loading) {
    return <div className={`erp-page ${toolbarStyles.page}`}><p className={pageStyles.linkHint}>Loading service...</p></div>;
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("masters/purchase/service-master-r1"))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>Masters</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase"))}>Purchase</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase/service-master-r1"))}>Service Summary</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{isEdit ? "Edit Service" : "New Service"}</span>
        </h1>
      </header>

      <section className={pageStyles.wrap}>
        <article className={pageStyles.card}>
          <div className="sc-modal-bar" />
          <div className={pageStyles.cardBody}>
            <div className={pageStyles.headerRow}>
              <h2 className="erp-title-lg">Service Master {isEdit ? "(Edit)" : "(Entry)"}</h2>
            </div>
            <div className={pageStyles.formGrid}>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Service Category *</label>
                <select className="sc-select" value={form.serviceCategory} onChange={(e) => setCategory(e.target.value)} disabled={isEdit}>
                  <option value="">Select Service Category</option>
                  {serviceCategoryOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Service ID *</label>
                <input className="sc-input sc-input--locked" value={form.serviceId} disabled />
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Service Name *</label>
                <input className="sc-input" placeholder="Enter Service Name" value={form.serviceName} onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))} />
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Service Description</label>
                <input className="sc-input" placeholder="Enter Service Description" value={form.serviceDescription} onChange={(e) => setForm((p) => ({ ...p, serviceDescription: e.target.value }))} />
              </div>

              <div className={pageStyles.field}>
                <label className={pageStyles.label}>UoM *</label>
                <select className="sc-select" value={form.uom} onChange={(e) => setForm((p) => ({ ...p, uom: e.target.value }))}>
                  <option value="">Select UoM</option>
                  {uomOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>GST Regime Applicability *</label>
                <select className="sc-select" value={form.gstRegimeApplicability} onChange={(e) => setForm((p) => ({ ...p, gstRegimeApplicability: e.target.value }))}>
                  <option value="">Select GST Regime Applicability</option>
                  {gstRegimeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>SAC Code (6 Digit) *</label>
                <div className={pageStyles.lookupWrap}>
                  <select className="sc-select" value={form.sacCode} onChange={(e) => handleSacChange(e.target.value)}>
                    <option value="">Select SAC Code (6 Digit)</option>
                    {sacRows.map((s) => <option key={s.id} value={s.sacCode}>{s.sacCode}</option>)}
                  </select>
                  <button type="button" className={pageStyles.lookupBtn} onClick={() => setSacLookupOpen(true)} aria-label="SAC lookup"><Search size={16} /></button>
                </div>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Taxability Type *</label>
                <select className="sc-select" value={form.taxabilityType} onChange={(e) => setForm((p) => ({ ...p, taxabilityType: e.target.value }))}>
                  <option value="">Select Taxability Type</option>
                  {taxabilityOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className={pageStyles.field}>
                <label className={pageStyles.label}>GST Rate %</label>
                <input className="sc-input sc-input--locked" value={form.gstRate} disabled />
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>RCM Applicability *</label>
                <select className="sc-select" value={form.rcmApplicability} onChange={(e) => setForm((p) => ({ ...p, rcmApplicability: e.target.value }))}>
                  <option value="">Select RCM Applicability</option>
                  {rcmOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>ITC Allowed *</label>
                <select className="sc-select" value={form.itcAllowed} onChange={(e) => setForm((p) => ({ ...p, itcAllowed: e.target.value }))}>
                  <option value="">Select ITC Allowed</option>
                  {itcOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>TDS Applicability *</label>
                <select className="sc-select" value={form.tdsApplicability} onChange={(e) => setForm((p) => ({ ...p, tdsApplicability: e.target.value }))}>
                  <option value="">Select TDS Applicability</option>
                  {tdsApplicabilityOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className={pageStyles.field}>
                <label className={pageStyles.label}>TDS Section *</label>
                <select className="sc-select" value={form.tdsSection} onChange={(e) => setForm((p) => ({ ...p, tdsSection: e.target.value }))}>
                  <option value="">Select TDS Section</option>
                  {tdsSectionOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>TDS Rate % *</label>
                <select className="sc-select" value={form.tdsRate} onChange={(e) => setForm((p) => ({ ...p, tdsRate: e.target.value }))}>
                  <option value="">Select TDS Rate %</option>
                  {tdsRateOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Cost Center</label>
                <select className="sc-select" value={form.costCenter} onChange={(e) => setForm((p) => ({ ...p, costCenter: e.target.value }))}>
                  <option value="">Select Cost Center</option>
                  {costCenterOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Status *</label>
                <select className="sc-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <hr className={sectionStyles.sectionRule} />
            <h2 className={sectionStyles.sectionTitle}>Service Classification</h2>
            <div
              className="sc-field-grid"
              style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
            >
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Service Type</label>
                <select
                  className="sc-select"
                  value={form.mpbcdcService?.serviceType || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mpbcdcService: { ...(p.mpbcdcService || EMPTY_SERVICE_MPBCDC), serviceType: e.target.value },
                    }))
                  }
                >
                  <option value="">Select Service Type</option>
                  {SERVICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>GeM Applicable</label>
                <select
                  className="sc-select"
                  value={form.mpbcdcService?.gemApplicable || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mpbcdcService: { ...(p.mpbcdcService || EMPTY_SERVICE_MPBCDC), gemApplicable: e.target.value },
                    }))
                  }
                >
                  <option value="">Select</option>
                  {YES_NO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={pageStyles.field}>
                <label className={pageStyles.label}>Approval Status</label>
                <select
                  className="sc-select"
                  value={form.mpbcdcService?.approvalStatus || "Draft"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      mpbcdcService: { ...(p.mpbcdcService || EMPTY_SERVICE_MPBCDC), approvalStatus: e.target.value },
                    }))
                  }
                >
                  {SERVICE_APPROVAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <footer className={pageStyles.footer}>
              <div className={pageStyles.footerLeft}>{!isEdit ? <span className={pageStyles.devHint}>Alt+F1 - fill sample data</span> : null}</div>
              <div className={pageStyles.footerRight}>
                <button type="button" className={pageStyles.btnCancel} onClick={() => navigate(appPath("masters/purchase/service-master-r1"))} disabled={saving}>Cancel</button>
                <button type="button" className={pageStyles.btnCancel} onClick={handleReset} disabled={saving}>Reset</button>
                <button type="button" className={pageStyles.btnSave} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </footer>
          </div>
        </article>
      </section>

      <ServiceSacLookupModal
        open={sacLookupOpen}
        sacRows={sacRows}
        selectedSacCode={form.sacCode}
        onClose={() => setSacLookupOpen(false)}
        onApply={(row) => {
          setForm((prev) => ({ ...prev, sacCode: row.sacCode, gstRate: formatRate(row.gstRate) }));
          setSacLookupOpen(false);
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
