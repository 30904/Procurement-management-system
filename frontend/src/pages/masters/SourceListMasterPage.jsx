import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  deleteSourceListMasterRequest,
  listSourceListMasterRequest,
} from "../../services/api.js";
import {
  MATERIAL_SERVICE_CODE,
  MATERIAL_SERVICE_NAME,
} from "../../config/materialLabels.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN");
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const isActive = doc.status === "Active";
  return {
    ...doc,
    _id: id,
    id,
    sourceListCode: doc.sourceListCode ?? "",
    itemType: doc.itemType ?? "",
    itemCode: doc.itemCode ?? "",
    itemName: doc.itemName ?? "",
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    sourceType: doc.sourceType ?? "",
    isPreferredVendor: doc.isPreferredVendor ?? "",
    validFrom: formatDate(doc.validFrom),
    validTo: formatDate(doc.validTo),
    statusLabel: isActive ? "Active" : "Inactive",
    statusInactive: !isActive,
  };
}

function StatusCell({ row }) {
  return (
    <span className="im-status" style={{ justifyContent: "center" }}>
      <span className={`im-status-dot ${row.statusInactive ? "im-status-dot--inactive" : ""}`} />
      {row.statusLabel}
    </span>
  );
}

const COLUMNS = [
  {
    key: "sourceListCode",
    label: "Source List Code",
    width: "11%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "itemType",
    label: "Type",
    width: "8%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "itemCode",
    label: MATERIAL_SERVICE_CODE,
    width: "10%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "itemName",
    label: MATERIAL_SERVICE_NAME,
    width: "16%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "supplierName",
    label: "Vendor",
    width: "14%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "sourceType",
    label: "Source Type",
    width: "9%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "isPreferredVendor",
    label: "Preferred",
    width: "8%",
    align: "center",
    sortable: true,
  },
  {
    key: "validFrom",
    label: "Valid From",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "validTo",
    label: "Valid To",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "statusLabel",
    label: "Status",
    width: "7%",
    align: "center",
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "7%", align: "center" },
];

export default function SourceListMasterPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSourceListMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load source list records");
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
      await deleteSourceListMasterRequest(row._id || row.id);
      toast.success("Source list record deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete source list record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const ACTION_OPTIONS = [
    {
      label: "View",
      icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
      variant: "muted",
      onClick: (row) => navigateWithHubReturn(`masters/purchase/source-list/${row.id}/edit`),
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => navigateWithHubReturn(`masters/purchase/source-list/${row.id}/edit`),
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
      <MasterBreadcrumbToolbar
        defaultHubReturn="masters/purchase"
        summaryTitle="Source List Summary"
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search source list code or material/service..."
        pageSize={10}
        onNew={() => navigateWithHubReturn("masters/purchase/source-list/new")}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Source List"
        message={
          confirmTarget
            ? `Delete ${confirmTarget.sourceListCode} (${confirmTarget.itemName || confirmTarget.itemCode})? This cannot be undone.`
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
