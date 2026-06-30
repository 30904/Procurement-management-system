import { useCallback, useEffect, useState } from "react";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import ItemRevisionHistoryModal from "../../components/modals/ItemRevisionHistoryModal.jsx";
import {
  listItemMasterRequest,
  deleteItemMasterRequest,
} from "../../services/api.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ItemMasterPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function normalizeItemRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  const isInactive = String(doc?.status || "").toLowerCase() === "inactive";
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
    inventoryStore: doc?.inventoryStore ?? "",
    procurementCategory: doc?.procurementCategory ?? "",
    gemApplicable: doc?.gemApplicable ?? "",
    status: doc?.status || "Active",
    statusInactive: isInactive,
    revNumber: Number(doc?.revNumber ?? 0),
  };
}

const COLUMNS = [
  { key: "itemNo", label: "Material Code", width: "12%", align: "center", sortable: true, filterable: true },
  { key: "itemCategory", label: "Category", width: "10%", align: "center", sortable: true, filterable: true },
  { key: "itemName", label: "Material Name", width: "17%", align: "left", sortable: true, filterable: true },
  { key: "itemDescription", label: "Description", width: "19%", align: "left", sortable: true, filterable: true },
  { key: "uom", label: "UoM", width: "8%", align: "center", sortable: true, filterable: true },
  { key: "hsnCode", label: "HSN", width: "9%", align: "center", sortable: true, filterable: true },
  { key: "procurementCategory", label: "Procurement Category", width: "11%", align: "center", sortable: true, filterable: true },
  { key: "gemApplicable", label: "GeM", width: "6%", align: "center", sortable: true, filterable: true },
  { key: "inventoryStore", label: "Store", width: "10%", align: "center", sortable: true, filterable: true },
  {
    key: "status",
    label: "Status",
    width: "8%",
    align: "center",
    filterable: true,
    render: (_, row) => {
      return (
        <span className={`im-status ${row.statusInactive ? pageStyles.statusInactiveText : ""}`} style={{ justifyContent: "center" }}>
          <span className={`im-status-dot ${row.statusInactive ? "im-status-dot--inactive" : ""}`} />
          {row.status}
        </span>
      );
    },
  },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function ItemMasterPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
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
      const res = await listItemMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeItemRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load material records");
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
      await deleteItemMasterRequest(row._id || row.id);
      toast.success("Material master deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const actionOptions = [
    { label: "View", icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />, onClick: (row) => navigateWithHubReturn(`masters/purchase/item-master/${row.id}/edit`) },
    { label: "Edit", icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />, onClick: (row) => navigateWithHubReturn(`masters/purchase/item-master/${row.id}/edit`) },
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
      <MasterBreadcrumbToolbar defaultHubReturn="masters/purchase" summaryTitle="Material Summary" />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actionOptions}
        searchPlaceholder="Search material code, category, name, description..."
        pageSize={10}
        onNew={() => navigateWithHubReturn("masters/purchase/item-master/new")}
      />

      <ItemRevisionHistoryModal open={!!revisionLogRow} sourceRow={revisionLogRow} onClose={() => setRevisionLogRow(null)} />
      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Material Master"
        message={confirmTarget ? `Are you sure you want to delete Material ${confirmTarget.itemNo}? This action cannot be undone.` : ""}
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
