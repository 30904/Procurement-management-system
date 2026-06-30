import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import DateField from "../../components/subcomponents/DateField.jsx";
import ErpMasterListFooter from "../../components/common/ErpMasterListFooter.jsx";
import ReportExportButtons from "../../components/reports/ReportExportButtons.jsx";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { appPath } from "../../config/navigation.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { listPurchaseIndentsRequest } from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import {
  currentMonthRange,
  formatDisplayDate,
  formatReportQty,
} from "../../utils/reportPageUtils.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./PurchaseOrderReportPage.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";

const PAGE_SIZE = 25;
const REPORT_TITLE = "Purchase Requisition Register";

const EXPORT_COLUMNS = [
  { key: "indentNo", label: "Requisition No.", align: "left" },
  { key: "indentDate", label: "Date", align: "left" },
  { key: "department", label: "Department", align: "left" },
  { key: "requestedBy", label: "Requested By", align: "left" },
  { key: "priority", label: "Priority", align: "left" },
  { key: "status", label: "Status", align: "left" },
  { key: "totalQty", label: "Total Qty", align: "right" },
  { key: "procurementCategory", label: "Procurement Category", align: "left" },
  { key: "mpbcdcApprovalStatus", label: "Approval Status", align: "left" },
];

const defaultRange = currentMonthRange();

function parseDay(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inDateRange(value, from, to) {
  const d = parseDay(value);
  if (!d) return false;
  const fromD = from ? parseDay(from) : null;
  const toD = to ? parseDay(`${to}T23:59:59`) : null;
  if (fromD && d < fromD) return false;
  if (toD && d > toD) return false;
  return true;
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const proc = doc.procurementInfo || {};
  const tracking = doc.approvalTracking || {};
  return {
    ...doc,
    id,
    indentNo: doc.indentNo ?? "",
    indentDate: doc.indentDate ?? "",
    department: doc.department ?? "",
    requestedBy: doc.requestedBy ?? "",
    priority: doc.priority ?? "",
    status: doc.status ?? "",
    totalQty: Number(doc.totalQty) || 0,
    procurementCategory: proc.procurementCategory ?? "",
    mpbcdcApprovalStatus: tracking.approvalStatus ?? "",
  };
}

function exportCellValue(row, col) {
  switch (col.key) {
    case "indentDate":
      return formatDisplayDate(row.indentDate);
    case "totalQty":
      return formatReportQty(row.totalQty);
    default:
      return row[col.key] ?? "";
  }
}

export default function PurchaseIndentReportPage() {
  const toast = useToast();
  const { activeLocation } = useLocationScope();
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [applied, setApplied] = useState({ ...defaultRange, search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPurchaseIndentsRequest();
      setAllRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase requisition register");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load, activeLocation?._id]);

  const filteredRows = useMemo(() => {
    const search = applied.search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (!inDateRange(row.indentDate, applied.fromDate, applied.toDate)) return false;
      if (!search) return true;
      const hay = [row.indentNo, row.department, row.requestedBy, row.status, row.procurementCategory]
        .join(" ")
        .toLowerCase();
      return hay.includes(search);
    });
  }, [allRows, applied]);

  const pagination = useMemo(() => {
    const total = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    return { page: safePage, pageSize: PAGE_SIZE, total, totalPages };
  }, [filteredRows.length, page]);

  const rows = useMemo(() => {
    const start = (pagination.page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, pagination.page]);

  function handleApplyFilter() {
    setApplied({ fromDate, toDate, search: searchInput.trim() });
    setPage(1);
  }

  function handleResetFilter() {
    const range = currentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setSearchInput("");
    setApplied({ ...range, search: "" });
    setPage(1);
  }

  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: setPage,
  });

  async function handleExcelExport() {
    setExporting(true);
    try {
      await downloadMasterWorkbook({
        sheetName: "PR Register",
        title: REPORT_TITLE,
        columns: EXPORT_COLUMNS,
        rows: filteredRows,
        cellValue: exportCellValue,
      });
    } catch (err) {
      toast.error(err?.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>{REPORT_TITLE}</h1>
        <ReportExportButtons onExcel={handleExcelExport} excelLoading={exporting} />
      </header>

      <section className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>From Date</label>
          <DateField hideLabel type="date" value={fromDate} onChange={setFromDate} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>To Date</label>
          <DateField hideLabel type="date" value={toDate} onChange={setToDate} />
        </div>
        <div className={styles.filterActions}>
          <button type="button" className={styles.btnPrimary} onClick={handleApplyFilter}>
            Apply Filter
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleResetFilter}>
            <RotateCcw size={16} aria-hidden />
            Reset Filter
          </button>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>
              <Search size={16} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search requisition no., department, requester…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyFilter();
              }}
            />
          </div>
          <div className={styles.toolbarRight}>
            <ErpMasterListFooter
              totalRecords={pagination.total}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPrevPageClick={onPrevPageClick}
              onNextPageClick={onNextPageClick}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={`im-table ${styles.table}`}>
            <thead>
              <tr>
                <th>Requisition No.</th>
                <th>Date</th>
                <th>Department</th>
                <th>Requested By</th>
                <th>Priority</th>
                <th>Status</th>
                <th className={styles.num}>Total Qty</th>
                <th>Procurement Category</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9}>No records for the selected criteria.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="erp-link-btn"
                        onClick={() =>
                          openAuthenticatedAppTab(
                            appPath(`purchase/purchase-indent/${row.id}/print`)
                          )
                        }
                      >
                        {row.indentNo}
                      </button>
                    </td>
                    <td>{formatDisplayDate(row.indentDate)}</td>
                    <td>{row.department || "—"}</td>
                    <td>{row.requestedBy || "—"}</td>
                    <td>{row.priority || "—"}</td>
                    <td>
                      <DocumentStatusBadge status={row.status} />
                    </td>
                    <td className={styles.num}>{formatReportQty(row.totalQty)}</td>
                    <td>{row.procurementCategory || "—"}</td>
                    <td>{row.mpbcdcApprovalStatus || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
