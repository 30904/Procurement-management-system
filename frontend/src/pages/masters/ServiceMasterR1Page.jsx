import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import ServiceMasterR1RevisionHistoryModal from "../../components/modals/ServiceMasterR1RevisionHistoryModal.jsx";
import { listServiceMasterR1Request, deleteServiceMasterR1Request } from "../../services/api.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ItemMasterPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function normalizeRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  const isInactive = String(doc?.status || "").toLowerCase() === "inactive";
  return {
    ...doc,
    _id: id,
    id,
    serviceId: doc?.serviceId ?? "",
    serviceName: doc?.serviceName ?? "",
    sacCode: doc?.sacCode ?? "",
    gstRate: doc?.gstRate ?? "",
    rcm: doc?.rcmApplicability ?? "",
    itcAllowed: doc?.itcAllowed ?? "",
    tdsSection: doc?.tdsSection ?? "",
    tdsRate: doc?.tdsRate ?? "",
    costCenter: doc?.costCenter ?? "—",
    status: doc?.status || "Active",
    statusInactive: isInactive,
    revNumber: Number(doc?.revNumber ?? 0),
  };
}

const COLUMNS = [
  { key: "serviceId", label: "Service ID", width: "10%", align: "center", sortable: true, filterable: true },
  { key: "serviceName", label: "Service Name", width: "18%", align: "left", sortable: true, filterable: true },
  { key: "sacCode", label: "SAC Code", width: "9%", align: "center", sortable: true, filterable: true },
  { key: "gstRate", label: "GST Rate%", width: "8%", align: "center", sortable: true },
  { key: "rcm", label: "RCM", width: "7%", align: "center", sortable: true, filterable: true },
  { key: "itcAllowed", label: "ITC Allowed", width: "8%", align: "center", sortable: true, filterable: true },
  { key: "tdsSection", label: "TDS Section", width: "9%", align: "center", sortable: true, filterable: true },
  { key: "tdsRate", label: "TDS Rate%", width: "8%", align: "center", sortable: true },
  { key: "costCenter", label: "Cost Center", width: "11%", align: "center", sortable: true, filterable: true },
  {
    key: "status",
    label: "Status",
    width: "8%",
    align: "center",
    filterable: true,
    render: (_, row) => (
      <span className={`im-status ${row.statusInactive ? pageStyles.statusInactiveText : ""}`} style={{ justifyContent: "center" }}>
        <span className={`im-status-dot ${row.statusInactive ? "im-status-dot--inactive" : ""}`} />
        {row.status}
      </span>
    ),
  },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function ServiceMasterR1Page() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revisionLogRow, setRevisionLogRow] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listServiceMasterR1Request();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load service records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!row) return;
    setDeleting(true);
    try {
      await deleteServiceMasterR1Request(row._id || row.id);
      toast.success("Service deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const actionOptions = [
    { label: "View", icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />, onClick: (row) => navigate(appPath(`masters/purchase/service-master-r1/${row.id}/edit`)) },
    { label: "Edit", icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />, onClick: (row) => navigate(appPath(`masters/purchase/service-master-r1/${row.id}/edit`)) },
    {
      label: "Revision Info",
      icon: <FileClock size={15} color="#22c55e" strokeWidth={1.9} />,
      disabled: (row) => Number(row?.revNumber || 0) === 0,
      onClick: (row) => setRevisionLogRow(row),
    },
    { label: "Delete", icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />, variant: "danger", onClick: (row) => setConfirmTarget(row) },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("masters/purchase"))} ariaLabel="Back to Purchase" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>Masters</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters/purchase"))}>Purchase</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Service Summary</span>
        </h1>
      </header>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actionOptions}
        searchPlaceholder="Search service id, name, sac, cost center..."
        pageSize={10}
        onNew={() => navigate(appPath("masters/purchase/service-master-r1/new"))}
      />

      <ServiceMasterR1RevisionHistoryModal open={!!revisionLogRow} sourceRow={revisionLogRow} onClose={() => setRevisionLogRow(null)} />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Service"
        message={confirmTarget ? `Delete service ${confirmTarget.serviceId}? This cannot be undone.` : ""}
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
