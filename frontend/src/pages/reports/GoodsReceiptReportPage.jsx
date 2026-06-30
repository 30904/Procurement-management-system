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
import { listGoodsReceiptsRequest } from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import {
  currentMonthRange,
  formatDisplayDate,
  formatReportMoney,
} from "../../utils/reportPageUtils.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./PurchaseOrderReportPage.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";

const PAGE_SIZE = 25;
const REPORT_TITLE = "Goods Receipt Register";

const EXPORT_COLUMNS = [
  { key: "grnNo", label: "GRN No.", align: "left" },
  { key: "grnDate", label: "GRN Date", align: "left" },
  { key: "poNo", label: "PO No.", align: "left" },
  { key: "supplierName", label: "Vendor", align: "left" },
  { key: "status", label: "Status", align: "left" },
  { key: "totalAmount", label: "Total Amount", align: "right" },
  { key: "procurementCategory", label: "Procurement Category", align: "left" },
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
  const proc = doc.procurementReference || {};
  return {
    ...doc,
    id,
    grnNo: doc.grnNo ?? "",
    grnDate: doc.grnDate ?? "",
    poNo: doc.poNo ?? "",
    supplierName: doc.supplierName ?? "",
    status: doc.status ?? "",
    totalAmount: Number(doc.totalAmount) || 0,
    procurementCategory: proc.procurementCategory ?? "",
  };
}

function exportCellValue(row, col) {
  switch (col.key) {
    case "grnDate":
      return formatDisplayDate(row.grnDate);
    case "totalAmount":
      return formatReportMoney(row.totalAmount);
    default:
      return row[col.key] ?? "";
  }
}

export default function GoodsReceiptReportPage() {
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
      const res = await listGoodsReceiptsRequest();
      setAllRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load goods receipt register");
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
      if (!inDateRange(row.grnDate, applied.fromDate, applied.toDate)) return false;
      if (!search) return true;
      const hay = [row.grnNo, row.poNo, row.supplierName, row.status, row.procurementCategory]
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
        sheetName: "GRN Register",
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
              placeholder="Search GRN no., PO, vendor…"
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
                <th>GRN No.</th>
                <th>GRN Date</th>
                <th>PO No.</th>
                <th>Vendor</th>
                <th>Status</th>
                <th className={styles.num}>Total Amount</th>
                <th>Procurement Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No records for the selected criteria.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="erp-link-btn"
                        onClick={() =>
                          openAuthenticatedAppTab(appPath(`stores/grn/${row.id}/print`))
                        }
                      >
                        {row.grnNo}
                      </button>
                    </td>
                    <td>{formatDisplayDate(row.grnDate)}</td>
                    <td>{row.poNo || "—"}</td>
                    <td>{row.supplierName || "—"}</td>
                    <td>
                      <DocumentStatusBadge status={row.status} />
                    </td>
                    <td className={styles.num}>{formatReportMoney(row.totalAmount)}</td>
                    <td>{row.procurementCategory || "—"}</td>
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
