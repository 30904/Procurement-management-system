import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  approveJobWorkOrderRequest,
  deleteJobWorkOrderRequest,
  listJobWorkOrdersRequest,
} from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import { JWO_LIST_PATH } from "../../utils/jobWorkOrderFormState.js";
import pageStyles from "../planning/ItemInventoryLevelListPage.module.css";
import spoStyles from "./ServicePurchaseOrderListPage.module.css";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    jwoNo: doc.jwoNo ?? "",
    jwoDate: doc.jwoDate ?? "",
    jwoType: doc.jwoType || "Standard",
    jobWorkerName: doc.jobWorkerName ?? "",
    currency: doc.currency || "INR",
    totalJwoValue: Number(doc.totalJwoValue ?? 0),
    status: doc.status || "Draft",
  };
}

const EXPORT_COLUMNS = [
  { key: "jwoNo", label: "JWO #", align: "center" },
  { key: "jwoDate", label: "JWO Date", align: "center" },
  { key: "jwoType", label: "JWO Type", align: "center" },
  { key: "jobWorkerName", label: "Job Worker", align: "left" },
  { key: "currency", label: "Currency", align: "center" },
  { key: "totalJwoValue", label: "JWO Value", align: "right" },
];

export default function JobWorkOrderListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listJobWorkOrdersRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load job work orders");
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

  const handleExport = async () => {
    try {
      await downloadMasterWorkbook({
        sheetName: "JWO Summary",
        fileName: "job-work-orders.xlsx",
        columns: EXPORT_COLUMNS,
        rows,
        getCellValue: (row, col) => {
          if (col.key === "jwoDate") return formatDisplayDate(row.jwoDate);
          if (col.key === "totalJwoValue") return formatMoney(row.totalJwoValue);
          return row[col.key] ?? "";
        },
      });
    } catch (err) {
      toast.error(err?.message || "Export failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?.id || deleting) return;
    setDeleting(true);
    try {
      await deleteJobWorkOrderRequest(deleteRow.id);
      toast.success(`Deleted ${deleteRow.jwoNo}`);
      setDeleteRow(null);
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete JWO");
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveRow = useCallback(
    async (row) => {
      try {
        await approveJobWorkOrderRequest(row.id);
        toast.success(`JWO ${row.jwoNo} approved.`);
        await fetchRows();
      } catch (err) {
        toast.error(err?.message || "Failed to approve JWO");
      }
    },
    [fetchRows, toast]
  );

  const COLUMNS = useMemo(
    () => [
      { key: "jwoNo", label: "JWO #", width: "12%", align: "center", sortable: true, filterable: true },
      {
        key: "jwoDate",
        label: "JWO Date",
        width: "10%",
        align: "center",
        sortable: true,
        render: (val) => formatDisplayDate(val),
      },
      { key: "jwoType", label: "JWO Type", width: "10%", align: "center", sortable: true, filterable: true },
      {
        key: "jobWorkerName",
        label: "Job Worker",
        width: "24%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      { key: "currency", label: "Currency", width: "8%", align: "center", sortable: true },
      {
        key: "totalJwoValue",
        label: "JWO Value",
        width: "12%",
        align: "right",
        sortable: true,
        render: (val) => formatMoney(val),
      },
      { key: "status", label: "Status", width: "10%", align: "center", sortable: true, filterable: true },
      { key: "action", label: "Action", width: "8%", align: "center" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: "Approve",
        icon: <CheckCircle size={15} color="#16a34a" strokeWidth={1.9} />,
        disabled: (row) => row.status !== "Draft",
        onClick: (row) => handleApproveRow(row),
      },
      {
        label: "Edit",
        icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
        disabled: (row) => row.status !== "Draft",
        onClick: (row) => navigate(appPath(`${JWO_LIST_PATH}/${row.id}/edit`)),
      },
      {
        label: "Delete",
        icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        disabled: (row) => row.status !== "Draft",
        onClick: (row) => setDeleteRow(row),
      },
    ],
    [navigate, handleApproveRow]
  );

  return (
    <div className={`erp-page ${styles.page} ${pageStyles.pageFill}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("purchase/job-work"))} ariaLabel="Back to Job Work" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase/job-work"))}>
            Job Work
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Generate JWO</span>
        </h1>
      </header>

      <section className={`${pageStyles.panel} ${pageStyles.panelFill}`}>
        <div className={pageStyles.panelHeader}>
          <h2 className={pageStyles.panelTitle}>Job Work Order [JWO] Summary</h2>
        </div>
        <div className={spoStyles.centerAction}>
          <button
            type="button"
            className={spoStyles.btnCreateSpo}
            onClick={() => navigate(appPath(`${JWO_LIST_PATH}/new`))}
          >
            <Plus size={18} strokeWidth={2.4} />
            Job Work Order [JWO]
          </button>
        </div>
        <div className={pageStyles.panelBody}>
          <DataTable
            className={pageStyles.tableWrap}
            tableClassName="im-table--inl-compact"
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            actions={actions}
            showNewBtn={false}
            searchPlaceholder="Search JWO no. or job worker…"
            pageSize={10}
            paginationAtTop
            hideBottomPagination
            hidePaginationTotalRecords
            disableInnerScroll
            alwaysShowPagination
            toolbarRight={
              <button
                type="button"
                className={spoStyles.excelBtn}
                onClick={handleExport}
                aria-label="Export to Excel"
                title="Export to Excel"
              >
                <FileSpreadsheet size={18} color="#16a34a" strokeWidth={2} />
              </button>
            }
          />
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteRow)}
        title="Delete draft JWO"
        message={deleteRow ? `Delete draft ${deleteRow.jwoNo}? This cannot be undone.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteRow(null)}
      />
    </div>
  );
}
