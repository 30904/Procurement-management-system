import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Eye, Pencil, Printer, XCircle } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { PURCHASE_INDENT_PATHS } from "../../config/purchaseIndentPaths.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import { listPurchaseIndentsRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatDisplayDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const status = doc.status || "Draft";
  const proc = doc.procurementInfo || {};
  const tracking = doc.approvalTracking || {};
  return {
    ...doc,
    _id: id,
    id,
    indentNo: doc.indentNo ?? "",
    indentDate: doc.indentDate ?? "",
    department: doc.department ?? "",
    requestedBy: doc.requestedBy ?? "",
    priority: doc.priority ?? "Normal",
    totalQty: Number(doc.totalQty) || 0,
    status,
    statusInactive: status === "Cancelled",
    requisitionType: proc.requisitionType ?? "",
    procurementCategory: proc.procurementCategory ?? "",
    mpbcdcApprovalStatus: tracking.approvalStatus ?? "",
  };
}

function isDraft(row) {
  return String(row?.status || "") === "Draft";
}

function StatusCell({ row }) {
  return <DocumentStatusBadge status={row.status} />;
}

const COLUMNS = [
  {
    key: "indentNo",
    label: "Indent No.",
    width: "11%",
    minWidth: "5.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "indentDate",
    label: "Indent Date",
    width: "9%",
    minWidth: "5rem",
    align: "center",
    type: "date",
    sortable: true,
    render: (val) => formatDisplayDate(val),
  },
  {
    key: "department",
    label: "Department",
    width: "11%",
    minWidth: "5.5rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "requisitionType",
    label: "Requisition Type",
    width: "10%",
    minWidth: "5rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "procurementCategory",
    label: "Procurement Category",
    width: "10%",
    minWidth: "5rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "mpbcdcApprovalStatus",
    label: "Approval Status",
    width: "9%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
    render: (val) => val || "—",
  },
  {
    key: "requestedBy",
    label: "Requested By",
    width: "11%",
    minWidth: "5.5rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "priority",
    label: "Priority",
    width: "8%",
    minWidth: "4rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "totalQty",
    label: "Total Qty",
    width: "9%",
    minWidth: "4.5rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  {
    key: "status",
    label: "Status",
    width: "9%",
    minWidth: "4.5rem",
    align: "center",
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "7%", minWidth: "3.5rem", align: "center" },
];

export default function PurchaseIndentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPurchaseIndentsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase requisitions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, activeLocationId]);

  useEffect(() => {
    if (!location.state?.refresh) return;
    fetchRows();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.refresh, fetchRows, navigate, location.pathname]);

  DataTable.useRecordCount(rows, setFooterContent);

  const openDetail = useCallback(
    (row, intent = "view") => {
      const id = row._id || row.id;
      if (!id) return;
      const q = intent === "view" ? "" : `?intent=${intent}`;
      navigate(appPath(`${PURCHASE_INDENT_PATHS.detailPath(id)}${q}`));
    },
    [navigate]
  );

  const openEdit = useCallback(
    (row) => {
      const id = row._id || row.id;
      if (!id) return;
      navigate(appPath(PURCHASE_INDENT_PATHS.editPath(id)));
    },
    [navigate]
  );

  const ACTION_OPTIONS = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
        variant: "muted",
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "view"),
      },
      {
        label: "Edit",
        icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openEdit(row),
      },
      {
        label: "Approve",
        icon: <CheckCircle size={15} color="#16a34a" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "approve"),
      },
      {
        label: "Cancel",
        icon: <XCircle size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "cancel"),
      },
    ],
    [openDetail, openEdit]
  );

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.hubPath))} ariaLabel="Back to Purchase" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.hubPath))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{PURCHASE_INDENT_PATHS.title}</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search indent no., department, requester…"
        pageSize={10}
        onNew={() => navigate(appPath(PURCHASE_INDENT_PATHS.newPath))}
        onRowClick={(row) => isDraft(row) && openDetail(row, "view")}
      />
    </div>
  );
}
