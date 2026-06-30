import { useCallback, useEffect, useState } from "react";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import LogisticsRevisionHistoryModal from "../../components/modals/LogisticsRevisionHistoryModal.jsx";
import { listLogisticsMasterRequest, deleteLogisticsMasterRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const isActive = String(doc.isLspActive || "").toUpperCase() === "A";
  return {
    ...doc,
    _id: id,
    id,
    categoryType: doc.categoryType ?? "",
    lspCode: doc.lspCode ?? "",
    lspNameLegalEntity: doc.lspNameLegalEntity ?? "",
    freightServiceType: doc.freightServiceType ?? "",
    lspCurrency: doc.lspCurrency ?? "",
    gstin: doc.gstin ?? "",
    rcmApplicability: doc.rcmApplicability ?? "",
    gemRegistered: doc.gemRegistered ?? "",
    statusLabel: isActive ? "Active" : "Inactive",
    statusInactive: !isActive,
    revNumber: doc.revNumber ?? 0,
    revisionHistory: doc.revisionHistory ?? [],
  };
}

const COLUMNS = [
  { key: "categoryType", label: "Category", width: "13%", minWidth: "8rem", align: "center", sortable: true, filterable: true },
  { key: "lspCode", label: "LSP Code", width: "10%", minWidth: "7rem", align: "center", sortable: true, filterable: true },
  { key: "lspNameLegalEntity", label: "LSP Name", width: "20%", minWidth: "11rem", align: "left", sortable: true, filterable: true },
  { key: "freightServiceType", label: "Freight Type", width: "14%", minWidth: "8.5rem", align: "center", sortable: true, filterable: true },
  { key: "lspCurrency", label: "Ccy", width: "6%", minWidth: "4rem", align: "center", sortable: true, filterable: true },
  { key: "gstin", label: "GSTIN", width: "15%", minWidth: "10rem", align: "center", sortable: true, filterable: true },
  { key: "rcmApplicability", label: "RCM", width: "7%", minWidth: "5.5rem", align: "center", sortable: true, filterable: true },
  { key: "gemRegistered", label: "GeM Reg.", width: "7%", minWidth: "4.5rem", align: "center", sortable: true, filterable: true },
  { key: "statusLabel", label: "Status", width: "7%", minWidth: "4.75rem", align: "center", filterable: true },
  { key: "action", label: "Action", width: "7%", minWidth: "4.5rem", align: "center" },
];

export default function LogisticsMasterPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [revisionLogRow, setRevisionLogRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLogisticsMasterRequest();
      setRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load logistics");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const actions = [
    { label: "View", icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />, variant: "muted", onClick: (row) => navigateWithHubReturn(`masters/purchase/logistics/${row.id}/edit`) },
    { label: "Edit", icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />, onClick: (row) => navigateWithHubReturn(`masters/purchase/logistics/${row.id}/edit`) },
    { label: "Revision Log", icon: <FileClock size={15} color="#22c55e" strokeWidth={1.9} />, disabled: (row) => Number(row?.revNumber || 0) === 0, onClick: (row) => setRevisionLogRow(row) },
    { label: "Delete", icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />, variant: "danger", onClick: (row) => setConfirmTarget(row) },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <MasterBreadcrumbToolbar defaultHubReturn="masters/purchase" summaryTitle="Logistics Summary" />
      <DataTable columns={COLUMNS} rows={rows} loading={loading} actions={actions} searchPlaceholder="Search by LSP code or name..." pageSize={10} onNew={() => navigateWithHubReturn("masters/purchase/logistics/new")} />
      <LogisticsRevisionHistoryModal open={!!revisionLogRow} sourceRow={revisionLogRow} onClose={() => setRevisionLogRow(null)} />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Logistics"
        message={confirmTarget ? `Are you sure you want to delete ${confirmTarget.lspNameLegalEntity} (${confirmTarget.lspCode})? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          if (!confirmTarget) return;
          setDeleting(true);
          try {
            await deleteLogisticsMasterRequest(confirmTarget._id || confirmTarget.id);
            toast.success("Logistics deleted.");
            await fetchRows();
          } catch (err) {
            toast.error(err?.message || "Failed to delete logistics");
          } finally {
            setDeleting(false);
            setConfirmTarget(null);
          }
        }}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />
    </div>
  );
}
