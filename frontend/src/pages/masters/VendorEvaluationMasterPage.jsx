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
  deleteVendorEvaluationMasterRequest,
  listVendorEvaluationMasterRequest,
} from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const isActive = doc.status === "Active";
  return {
    ...doc,
    _id: id,
    id,
    evaluationCode: doc.evaluationCode ?? "",
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    priceWeight: doc.priceWeight ?? 25,
    deliveryWeight: doc.deliveryWeight ?? 25,
    qualityWeight: doc.qualityWeight ?? 25,
    complianceWeight: doc.complianceWeight ?? 25,
    minimumScore: doc.minimumScore ?? 0,
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
    key: "evaluationCode",
    label: "Evaluation Code",
    width: "12%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "supplierName",
    label: "Vendor",
    width: "18%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "priceWeight",
    label: "Price Wt.",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "deliveryWeight",
    label: "Delivery Wt.",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "qualityWeight",
    label: "Quality Wt.",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "complianceWeight",
    label: "Compliance Wt.",
    width: "10%",
    align: "center",
    sortable: true,
  },
  {
    key: "minimumScore",
    label: "Min. Score",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "statusLabel",
    label: "Status",
    width: "8%",
    align: "center",
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "7%", align: "center" },
];

export default function VendorEvaluationMasterPage() {
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
      const res = await listVendorEvaluationMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load vendor evaluation records");
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
      await deleteVendorEvaluationMasterRequest(row._id || row.id);
      toast.success("Vendor evaluation record deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete vendor evaluation record");
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
      onClick: (row) => navigateWithHubReturn(`masters/purchase/vendor-evaluation/${row.id}/edit`),
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => navigateWithHubReturn(`masters/purchase/vendor-evaluation/${row.id}/edit`),
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
        summaryTitle="Vendor Evaluation Summary"
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search evaluation code or vendor..."
        pageSize={10}
        onNew={() => navigateWithHubReturn("masters/purchase/vendor-evaluation/new")}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Vendor Evaluation"
        message={
          confirmTarget
            ? `Delete ${confirmTarget.evaluationCode} (${confirmTarget.supplierName})? This cannot be undone.`
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
