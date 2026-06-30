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
  approveServicePurchaseOrderRequest,
  deleteServicePurchaseOrderRequest,
  listServicePurchaseOrdersRequest,
} from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import { SPO_LIST_PATH } from "../../utils/servicePurchaseOrderFormState.js";
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
    spoNo: doc.spoNo ?? "",
    spoDate: doc.spoDate ?? "",
    serviceCategory: doc.serviceCategory || "Domestic",
    serviceProviderName: doc.serviceProviderName ?? "",
    currency: doc.currency || "INR",
    totalSpoValue: Number(doc.totalSpoValue ?? 0),
    status: doc.status || "Draft",
  };
}

const EXPORT_COLUMNS = [
  { key: "spoNo", label: "SPO #", align: "center" },
  { key: "spoDate", label: "SPO Date", align: "center" },
  { key: "serviceCategory", label: "Purchase Category", align: "center" },
  { key: "serviceProviderName", label: "Vendor Name", align: "left" },
  { key: "currency", label: "Currency", align: "center" },
  { key: "totalSpoValue", label: "SPO Value", align: "right" },
];

export default function ServicePurchaseOrderListPage() {
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
      const res = await listServicePurchaseOrdersRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load service purchase orders");
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
        sheetName: "SPO Summary",
        fileName: "service-purchase-orders.xlsx",
        columns: EXPORT_COLUMNS,
        rows,
        getCellValue: (row, col) => {
          if (col.key === "spoDate") return formatDisplayDate(row.spoDate);
          if (col.key === "totalSpoValue") return formatMoney(row.totalSpoValue);
          return row[col.key] ?? "";
        },
      });
    } catch (err) {
      toast.error(err?.message || "Export failed");
    }
  };

  const handleApprove = async (row) => {
    try {
      await approveServicePurchaseOrderRequest(row.id);
      toast.success(`SPO ${row.spoNo} approved.`);
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to approve SPO");
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?.id || deleting) return;
    setDeleting(true);
    try {
      await deleteServicePurchaseOrderRequest(deleteRow.id);
      toast.success(`Deleted ${deleteRow.spoNo}`);
      setDeleteRow(null);
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete SPO");
    } finally {
      setDeleting(false);
    }
  };

  const COLUMNS = useMemo(
    () => [
      { key: "spoNo", label: "SPO #", width: "11%", align: "center", sortable: true, filterable: true },
      {
        key: "spoDate",
        label: "SPO Date",
        width: "9%",
        align: "center",
        sortable: true,
        render: (val) => formatDisplayDate(val),
      },
      {
        key: "serviceCategory",
        label: "Purchase Category",
        width: "11%",
        align: "center",
        sortable: true,
        filterable: true,
      },
      {
        key: "serviceProviderName",
        label: "Vendor Name",
        width: "22%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      { key: "currency", label: "Currency", width: "7%", align: "center", sortable: true },
      {
        key: "totalSpoValue",
        label: "SPO Value",
        width: "11%",
        align: "right",
        sortable: true,
        render: (val) => formatMoney(val),
      },
      { key: "action", label: "Action", width: "8%", align: "center" },
    ],
    []
  );

  const handleApproveRow = useCallback(
    async (row) => {
      try {
        await approveServicePurchaseOrderRequest(row.id);
        toast.success(`SPO ${row.spoNo} approved.`);
        await fetchRows();
      } catch (err) {
        toast.error(err?.message || "Failed to approve SPO");
      }
    },
    [fetchRows, toast]
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
        onClick: (row) => navigate(appPath(`${SPO_LIST_PATH}/${row.id}/edit`)),
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

  const toolbarRight = (
    <button type="button" className={spoStyles.excelBtn} onClick={handleExport} aria-label="Export to Excel" title="Export to Excel">
      <FileSpreadsheet size={18} color="#16a34a" strokeWidth={2} />
    </button>
  );

  return (
    <div className={`erp-page ${styles.page} ${pageStyles.pageFill}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("purchase/service-po"))} ariaLabel="Back to Service PO" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase/service-po"))}>
            Service PO
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Generate SPO</span>
        </h1>
      </header>

      <section className={`${pageStyles.panel} ${pageStyles.panelFill}`}>
        <div className={pageStyles.panelHeader}>
          <h2 className={pageStyles.panelTitle}>Service Purchase Order[SPO] Summary</h2>
        </div>
        <div className={spoStyles.centerAction}>
          <button
            type="button"
            className={spoStyles.btnCreateSpo}
            onClick={() => navigate(appPath(`${SPO_LIST_PATH}/new`))}
          >
            <Plus size={18} strokeWidth={2.4} />
            Service Purchase Order [SPO]
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
            searchPlaceholder="Search SPO no. or supplier…"
            pageSize={10}
            paginationAtTop
            hideBottomPagination
            hidePaginationTotalRecords
            disableInnerScroll
            alwaysShowPagination
            toolbarRight={toolbarRight}
          />
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteRow)}
        title="Delete draft SPO"
        message={deleteRow ? `Delete draft ${deleteRow.spoNo}? This cannot be undone.` : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteRow(null)}
      />
    </div>
  );
}
