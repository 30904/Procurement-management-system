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
import AssetRevisionHistoryModal from "../../components/modals/AssetRevisionHistoryModal.jsx";
import { listAssetMasterRequest, deleteAssetMasterRequest } from "../../services/api.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ItemMasterPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function normalizeAssetRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  const isInactive = String(doc?.status || "").toLowerCase() === "inactive";
  return {
    ...doc,
    _id: id,
    id,
    assetNo: doc?.assetNo ?? "",
    assetName: doc?.assetName ?? "",
    assetDescription: doc?.assetDescription ?? "",
    uom: doc?.uom ?? "",
    hsnCode: doc?.hsnCode ?? "",
    assetUniqueId: doc?.assetUniqueId ?? "",
    lifeExpectancyYears: doc?.lifeExpectancyYears ?? "",
    assetLocation: doc?.assetLocation ?? "",
    assetClassification: doc?.procurementTracking?.assetClassification ?? "",
    procurementMode: doc?.procurementTracking?.procurementMode ?? "",
    status: doc?.status || "Active",
    statusInactive: isInactive,
    revNumber: Number(doc?.revNumber ?? 0),
  };
}

const COLUMNS = [
  { key: "assetNo", label: "Asset No.", width: "10%", align: "center", sortable: true, filterable: true },
  { key: "assetName", label: "Asset Name", width: "14%", align: "left", sortable: true, filterable: true },
  { key: "assetDescription", label: "Asset Description", width: "14%", align: "left", sortable: true, filterable: true },
  { key: "uom", label: "UoM", width: "6%", align: "center", sortable: true, filterable: true },
  { key: "hsnCode", label: "HSN Code", width: "8%", align: "center", sortable: true, filterable: true },
  { key: "assetUniqueId", label: "Asset Unique ID", width: "12%", align: "center", sortable: true, filterable: true },
  { key: "lifeExpectancyYears", label: "Life (Yrs)", width: "8%", align: "center", sortable: true, filterable: true },
  { key: "assetLocation", label: "Asset Location", width: "9%", align: "center", sortable: true, filterable: true },
  { key: "assetClassification", label: "Asset Class", width: "9%", align: "center", sortable: true, filterable: true },
  { key: "procurementMode", label: "Procurement Mode", width: "9%", align: "center", sortable: true, filterable: true },
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

export default function AssetMasterPage() {
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
      const res = await listAssetMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeAssetRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load asset records");
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
      await deleteAssetMasterRequest(row._id || row.id);
      toast.success("Asset master deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const actionOptions = [
    { label: "View", icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />, onClick: (row) => navigate(appPath(`masters/purchase/asset-master-capitalised/${row.id}/edit`)) },
    { label: "Edit", icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />, onClick: (row) => navigate(appPath(`masters/purchase/asset-master-capitalised/${row.id}/edit`)) },
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
          <span className="erp-breadcrumb-item">Asset Summary</span>
        </h1>
      </header>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actionOptions}
        searchPlaceholder="Search asset no, name, description, unique id..."
        pageSize={10}
        onNew={() => navigate(appPath("masters/purchase/asset-master-capitalised/new"))}
      />

      <AssetRevisionHistoryModal open={!!revisionLogRow} sourceRow={revisionLogRow} onClose={() => setRevisionLogRow(null)} />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Asset Master"
        message={confirmTarget ? `Are you sure you want to delete Asset ${confirmTarget.assetNo}? This action cannot be undone.` : ""}
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
