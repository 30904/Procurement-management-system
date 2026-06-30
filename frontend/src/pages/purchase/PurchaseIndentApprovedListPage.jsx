import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { PURCHASE_INDENT_PATHS } from "../../config/purchaseIndentPaths.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import { listApprovedPurchaseIndentsRequest } from "../../services/api.js";
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
    procurementStatus: doc.procurementStatus ?? "Awaiting PO",
    linkedPoSummary: doc.linkedPoSummary ?? "—",
    status: doc.status || "Approved",
  };
}

function ProcurementCell({ row }) {
  return (
    <span className="im-status" style={{ justifyContent: "center" }}>
      <span className="im-status-dot" />
      {row.procurementStatus}
    </span>
  );
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
    width: "12%",
    minWidth: "6rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "requestedBy",
    label: "Requested By",
    width: "12%",
    minWidth: "6rem",
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
    width: "8%",
    minWidth: "4rem",
    align: "right",
    sortable: true,
    render: (val) => formatQty(val),
  },
  {
    key: "procurementStatus",
    label: "Procurement",
    width: "11%",
    minWidth: "5.5rem",
    align: "center",
    sortable: true,
    filterable: true,
    render: (_, row) => <ProcurementCell row={row} />,
  },
  {
    key: "linkedPoSummary",
    label: "Linked PO",
    width: "14%",
    minWidth: "6rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  { key: "action", label: "Action", width: "7%", minWidth: "3.5rem", align: "center" },
];

export default function PurchaseIndentApprovedListPage() {
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
      const res = await listApprovedPurchaseIndentsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load approved requisitions");
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

  const openView = useCallback(
    (row) => {
      const id = row._id || row.id;
      if (!id) return;
      navigate(appPath(`${PURCHASE_INDENT_PATHS.detailPath(id)}?from=approved`));
    },
    [navigate]
  );

  const ACTION_OPTIONS = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
        variant: "muted",
        onClick: openView,
      },
    ],
    [openView]
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
          <span className="erp-breadcrumb-item">{PURCHASE_INDENT_PATHS.approvedTitle}</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        showNewBtn={false}
        searchPlaceholder="Search indent no., department, PO no…"
        pageSize={10}
        onRowClick={openView}
      />
    </div>
  );
}
