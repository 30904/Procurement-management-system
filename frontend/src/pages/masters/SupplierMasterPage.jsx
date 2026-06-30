import { useCallback, useEffect, useState } from "react";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import SupplierRevisionHistoryModal from "../../components/modals/SupplierRevisionHistoryModal.jsx";
import {
  listSupplierMasterRequest,
  deleteSupplierMasterRequest,
} from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function primaryBilling(row) {
  const list = row?.supplierBillingAddress;
  return Array.isArray(list) && list.length ? list[0] : null;
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const billing = primaryBilling(doc);
  const isActive = String(doc.isSupplierActive || "").toUpperCase() === "A";

  return {
    ...doc,
    _id: id,
    id,
    supplierCode: doc.supplierCode ?? "",
    supplierName: doc.supplierName ?? "",
    country: billing?.country || doc.countryOfOrigin || "",
    stateProvince: billing?.state || "",
    gstClassification: doc.gstClassification ?? "",
    gstin: doc.gstin ?? "",
    supplierCurrency: doc.supplierCurrency ?? "",
    isSupplierActive: doc.isSupplierActive ?? "A",
    statusLabel: isActive ? "Active" : "Inactive",
    statusInactive: !isActive,
    revNumber: doc.revNumber ?? 0,
    revisionHistory: doc.revisionHistory ?? [],
    msmeEligible: doc.msmeEligible ?? "",
    gemRegistered: doc.gemRegistered ?? "",
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
    key: "supplierCode",
    label: "Vendor Code",
    width: "9%",
    minWidth: "5.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "supplierName",
    label: "Vendor Name",
    width: "16%",
    minWidth: "8rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "country",
    label: "Country",
    width: "8%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "stateProvince",
    label: "State/Province",
    width: "9%",
    minWidth: "5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "gstClassification",
    label: "GST Class.",
    width: "10%",
    minWidth: "5.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "gstin",
    label: "GSTIN",
    width: "15%",
    minWidth: "10.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "supplierCurrency",
    label: "Ccy",
    width: "5%",
    minWidth: "2.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "revNumber",
    label: "Rev #",
    width: "5%",
    minWidth: "3rem",
    align: "center",
    sortable: true,
    render: (val) => `Rev ${Number(val || 0)}`,
  },
  {
    key: "msmeEligible",
    label: "MSME",
    width: "6%",
    minWidth: "3rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "gemRegistered",
    label: "GeM Reg.",
    width: "7%",
    minWidth: "3.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "statusLabel",
    label: "Status",
    width: "8%",
    minWidth: "4.5rem",
    align: "center",
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "7%", minWidth: "3.5rem", align: "center" },
];

export default function SupplierMasterPage() {
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
      const res = await listSupplierMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load suppliers");
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
      await deleteSupplierMasterRequest(row._id || row.id);
      toast.success("Vendor deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete supplier");
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
      onClick: (row) => {
        navigateWithHubReturn(`masters/purchase/supplier/${row.id}/edit`);
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => {
        navigateWithHubReturn(`masters/purchase/supplier/${row.id}/edit`);
      },
    },
    {
      label: "Revision Log",
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
      <MasterBreadcrumbToolbar defaultHubReturn="masters/purchase" summaryTitle="Vendor Summary" />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search vendor code or name..."
        pageSize={10}
        onNew={() => navigateWithHubReturn("masters/purchase/supplier/new")}
      />

      <SupplierRevisionHistoryModal
        open={!!revisionLogRow}
        sourceRow={revisionLogRow}
        onClose={() => setRevisionLogRow(null)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Vendor"
        message={
          confirmTarget
            ? `Are you sure you want to delete ${confirmTarget.supplierName} (${confirmTarget.supplierCode})? This action cannot be undone.`
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
