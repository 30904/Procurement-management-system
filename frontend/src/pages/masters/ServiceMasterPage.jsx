import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import ServiceSacLookupModal from "../../components/modals/ServiceSacLookupModal.jsx";
import ServiceRevisionHistoryModal from "../../components/modals/ServiceRevisionHistoryModal.jsx";
import { getUserDisplayName } from "../../utils/authStorage.js";
import {
  listServiceMasterRequest,
  getServiceMasterRequest,
  createServiceMasterRequest,
  updateServiceMasterRequest,
  deleteServiceMasterRequest,
  previewServiceCodeRequest,
  listSacPMasterRequest,
} from "../../services/api.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ServiceMasterPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const STATUS_OPTIONS = ["Active", "Inactive"];

function formatRate(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function normalizeServiceRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
    serviceNo: doc?.serviceNo ?? doc?.serviceCode ?? doc?.code ?? "",
    serviceDescription: doc?.serviceDescription ?? doc?.description ?? "",
    sacCode: doc?.sacCode ?? "",
    gstRate: Number(doc?.gstRate ?? 0),
    status: doc?.status || "Active",
    revNumber: Number(doc?.revNumber ?? 0),
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

const COLUMNS = [
  { key: "serviceNo", label: "Service No.", width: "14%", align: "center", sortable: true, filterable: true },
  {
    key: "serviceDescription",
    label: "Service Description",
    width: "30%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  { key: "sacCode", label: "SAC Code", width: "12%", align: "center", sortable: true, filterable: true },
  {
    key: "gstRate",
    label: "GST Rate %",
    width: "11%",
    align: "center",
    sortable: true,
    render: (v) => formatRate(v),
  },
  {
    key: "status",
    label: "Status",
    width: "12%",
    align: "center",
    filterable: true,
    render: (_, row) => {
      const isInactive = row.status === "Inactive";
      return (
        <span className={`im-status ${isInactive ? pageStyles.statusInactiveText : ""}`} style={{ justifyContent: "center" }}>
          <span className={`im-status-dot ${isInactive ? "im-status-dot--inactive" : ""}`} />
          {row.status}
        </span>
      );
    },
  },
  { key: "action", label: "Action", width: "9%", align: "center" },
];

const INITIAL_FORM = {
  serviceNo: "",
  serviceDescription: "",
  sacCode: "",
  gstRate: "",
  status: "Active",
};

export default function ServiceMasterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [sacRows, setSacRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionLogRow, setRevisionLogRow] = useState(null);
  const [lookupOpen, setLookupOpen] = useState(false);

  const sacMap = useMemo(() => {
    const map = new Map();
    sacRows.forEach((row) => map.set(String(row.sacCode), row));
    return map;
  }, [sacRows]);

  const refreshPreviewCode = useCallback(async () => {
    if (editRow) return;
    try {
      const res = await previewServiceCodeRequest("purchase");
      const code = res?.data?.serviceNo || res?.data?.previewCode || res?.data?.code || "";
      setForm((prev) => ({ ...prev, serviceNo: code }));
    } catch {
      setForm((prev) => ({ ...prev, serviceNo: prev.serviceNo || "" }));
    }
  }, [editRow]);

  const fetchSacOptions = useCallback(async () => {
    try {
      const res = await listSacPMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setSacRows(data.map(normalizeSacRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load SAC list");
      setSacRows([]);
    }
  }, [toast]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listServiceMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.map((item) => {
          const normalized = normalizeServiceRow(item);
          return normalized;
        })
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load service records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
    fetchSacOptions();
    refreshPreviewCode();
  }, [fetchRows, fetchSacOptions, refreshPreviewCode]);

  useEffect(() => {
    if (editRow) return;
    refreshPreviewCode();
  }, [editRow, refreshPreviewCode]);

  DataTable.useRecordCount(rows, setFooterContent);

  const resetForm = useCallback(async () => {
    setForm(INITIAL_FORM);
    setEditRow(null);
    await refreshPreviewCode();
  }, [refreshPreviewCode]);

  const applySacSelection = (sacRow) => {
    const gstRate = Number(sacRow?.gstRate ?? 0);
    setForm((prev) => ({
      ...prev,
      sacCode: sacRow?.sacCode || "",
      gstRate: gstRate.toFixed(2),
    }));
  };

  const handleSacChange = (nextSacCode) => {
    const sac = sacMap.get(String(nextSacCode));
    setForm((prev) => ({
      ...prev,
      sacCode: nextSacCode,
      gstRate: sac ? Number(sac.gstRate || 0).toFixed(2) : "",
    }));
  };

  const validateForm = () => {
    if (!form.serviceDescription.trim()) {
      toast.error("Service Description is required.");
      return false;
    }
    if (!form.sacCode) {
      toast.error("Please select a SAC code.");
      return false;
    }
    if (!form.status) {
      toast.error("Please select a status.");
      return false;
    }
    return true;
  };

  const saveRecord = async (payload) => {
    if (editRow) {
      if (!payload?.revisionInfo) {
        setPendingEditPayload(payload);
        setRevisionModalOpen(true);
        return { deferred: true };
      }
      await updateServiceMasterRequest(editRow._id || editRow.id, payload);
      toast.success("Service master updated.");
    } else {
      await createServiceMasterRequest(payload);
      toast.success("Service master created.");
    }
    await fetchRows();
    await fetchSacOptions();
    await resetForm();
  };

  const handleSave = async () => {
    if (saving) return;
    if (!validateForm()) return;
    const payload = {
      serviceNo: form.serviceNo,
      serviceDescription: form.serviceDescription.trim(),
      sacCode: form.sacCode,
      gstRate: Number(form.gstRate || 0),
      status: form.status,
    };
    setSaving(true);
    try {
      await saveRecord(payload);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save service record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row) return;
    setDeleting(true);
    try {
      await deleteServiceMasterRequest(row._id || row.id);
      toast.success("Service master deleted.");
      await fetchRows();
      if (editRow && (editRow._id || editRow.id) === (row._id || row.id)) {
        await resetForm();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const startEdit = async (row) => {
    try {
      const id = row._id || row.id;
      const res = await getServiceMasterRequest(id);
      const doc = normalizeServiceRow(res?.data || row);
      setEditRow(doc);
      setForm({
        serviceNo: doc.serviceNo,
        serviceDescription: doc.serviceDescription,
        sacCode: doc.sacCode,
        gstRate: Number(doc.gstRate || 0).toFixed(2),
        status: doc.status || "Active",
      });
    } catch {
      const doc = normalizeServiceRow(row);
      setEditRow(doc);
      setForm({
        serviceNo: doc.serviceNo,
        serviceDescription: doc.serviceDescription,
        sacCode: doc.sacCode,
        gstRate: Number(doc.gstRate || 0).toFixed(2),
        status: doc.status || "Active",
      });
    }
  };

  const actionOptions = [
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => startEdit(row),
    },
    {
      label: "Revision Info",
      icon: <FileClock size={15} color="#22c55e" strokeWidth={1.9} />,
      disabled: (row) => Number(row?.revNumber || 0) === 0,
      onClick: (row) => setRevisionLogRow(row),
    },
    {
      label: "Delete",
      icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />,
      variant: "danger",
      onClick: (row) => setConfirmTarget(row),
    },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>
            Masters
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Service Master</span>
        </h1>
      </header>

      <section className={pageStyles.formCard}>
        <div className={pageStyles.headerRow}>
          <h2 className="erp-title-lg">{editRow ? "Edit Service" : "Add Service"}</h2>
          <button type="button" className={pageStyles.saveBtn} onClick={handleSave} disabled={saving}>
            {editRow ? <>{saving ? "Saving..." : "Save"}</> : <><Plus size={16} />{saving ? "Adding..." : "Add"}</>}
          </button>
        </div>
        <div className={pageStyles.formGrid}>
          <div className={pageStyles.field}>
            <label className={pageStyles.label}>Service No.</label>
            <input className="sc-input sc-input--locked" value={form.serviceNo} disabled />
          </div>

          <div className={pageStyles.field}>
            <label className={pageStyles.label}>Service Description</label>
            <input
              className="sc-input"
              value={form.serviceDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceDescription: e.target.value }))}
              placeholder="Enter service description"
            />
          </div>

          <div className={pageStyles.field}>
            <label className={pageStyles.label}>6-digit SAC</label>
            <div className={pageStyles.sacFieldWrap}>
              <select
                className="sc-select"
                value={form.sacCode}
                onChange={(e) => handleSacChange(e.target.value)}
              >
                <option value="">Select SAC</option>
                {sacRows.map((sac) => (
                  <option key={sac.id} value={sac.sacCode}>
                    {sac.sacCode}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={pageStyles.lookupBtn}
                aria-label="Lookup SAC"
                onClick={() => setLookupOpen(true)}
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className={pageStyles.field}>
            <label className={pageStyles.label}>GST Rate %</label>
            <input className="sc-input sc-input--locked" value={form.gstRate} disabled />
          </div>

          <div className={pageStyles.field}>
            <label className={pageStyles.label}>Status</label>
            <select
              className="sc-select"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actionOptions}
        showNewBtn={false}
        searchPlaceholder="Search service no, description, or SAC code..."
        pageSize={10}
      />

      <ServiceSacLookupModal
        open={lookupOpen}
        sacRows={sacRows}
        selectedSacCode={form.sacCode}
        onClose={() => setLookupOpen(false)}
        onApply={(row) => {
          applySacSelection(row);
          setLookupOpen(false);
        }}
      />

      <ServiceRevisionHistoryModal
        open={!!revisionLogRow}
        sourceRow={revisionLogRow}
        onClose={() => setRevisionLogRow(null)}
      />

      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={Number(editRow?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          setRevisionModalOpen(false);
          setPendingEditPayload(null);
        }}
        onSave={async (revisionInfo) => {
          if (!editRow || !pendingEditPayload) {
            setRevisionModalOpen(false);
            return;
          }
          try {
            await saveRecord({ ...pendingEditPayload, revisionInfo });
            setPendingEditPayload(null);
            setRevisionModalOpen(false);
          } catch (err) {
            toast.error(err?.data?.message || err?.message || "Failed to save revision");
          }
        }}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Service Master"
        message={
          confirmTarget
            ? `Are you sure you want to delete Service ${confirmTarget.serviceNo}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />
    </div>
  );
}
