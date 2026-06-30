import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Eye, Pencil, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  listProspectSupplierMasterRequest,
  deleteProspectSupplierMasterRequest,
  convertProspectToSupplierRequest,
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
    registrationNo: doc.registrationNo ?? "",
    registrationDate: doc.registrationDate
      ? new Date(doc.registrationDate).toLocaleDateString("en-IN")
      : "",
    categoryType: doc.categoryType ?? "",
    supplierName: doc.supplierName ?? "",
    gstin: doc.gstin ?? "",
    city: billing?.city ?? "",
    stateProvince: billing?.state ?? "",
    assessmentStatus: doc.assessmentStatus ?? "Pending",
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
    key: "registrationNo",
    label: "Reg. No.",
    width: "10%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "registrationDate",
    label: "Reg. Date",
    width: "9%",
    align: "center",
    sortable: true,
  },
  {
    key: "supplierName",
    label: "Vendor Name",
    width: "18%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "categoryType",
    label: "Category",
    width: "10%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "gstin",
    label: "GSTIN",
    width: "14%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "city",
    label: "City",
    width: "9%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "assessmentStatus",
    label: "Assessment",
    width: "11%",
    align: "center",
    sortable: true,
    filterable: true,
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

export default function ProspectSupplierMasterPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/purchase");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProspectSupplierMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load prospect suppliers");
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
      await deleteProspectSupplierMasterRequest(row._id || row.id);
      toast.success("Prospect supplier deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete prospect supplier");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const handleConvert = async (row) => {
    if (!row) return;
    setConverting(true);
    try {
      const res = await convertProspectToSupplierRequest(row._id || row.id);
      const supplierId = res?.data?._id || res?.data?.id;
      toast.success("Converted to approved supplier.");
      setConvertTarget(null);
      if (supplierId) {
        navigateWithHubReturn(`masters/purchase/supplier/${supplierId}/edit`);
      } else {
        await fetchRows();
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to convert prospect supplier");
    } finally {
      setConverting(false);
    }
  };

  const ACTION_OPTIONS = [
    {
      label: "View",
      icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
      variant: "muted",
      onClick: (row) => {
        navigateWithHubReturn(`masters/purchase/prospect-supplier/${row.id}/edit`);
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => {
        navigateWithHubReturn(`masters/purchase/prospect-supplier/${row.id}/edit`);
      },
    },
    {
      label: "Convert",
      icon: <ArrowRightLeft size={15} color="#22c55e" strokeWidth={1.9} />,
      disabled: (row) => row.assessmentStatus !== "Approved",
      onClick: (row) => setConvertTarget(row),
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
        summaryTitle="Prospect Vendor Summary"
      />

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search registration no. or vendor name..."
        pageSize={10}
        onNew={() => navigateWithHubReturn("masters/purchase/prospect-supplier/new")}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Prospect Vendor"
        message={
          confirmTarget
            ? `Delete ${confirmTarget.supplierName} (${confirmTarget.registrationNo})? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />

      <ConfirmDialog
        open={!!convertTarget}
        title="Convert to Vendor"
        message={
          convertTarget
            ? `Convert ${convertTarget.supplierName} to an approved vendor master record?`
            : ""
        }
        confirmLabel="Convert"
        cancelLabel="Cancel"
        loading={converting}
        onConfirm={() => handleConvert(convertTarget)}
        onCancel={() => (!converting ? setConvertTarget(null) : null)}
      />
    </div>
  );
}
