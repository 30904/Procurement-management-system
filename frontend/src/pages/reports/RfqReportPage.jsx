import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import DateField from "../../components/subcomponents/DateField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import ErpMasterListFooter from "../../components/common/ErpMasterListFooter.jsx";
import ReportExportButtons from "../../components/reports/ReportExportButtons.jsx";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { appPath } from "../../config/navigation.js";
import { RFQ_PATHS } from "../../config/rfqPaths.js";
import { RFQ_STATUS_OPTIONS } from "../../config/rfqOptions.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { listRfqsRequest, listSupplierMasterRequest } from "../../services/api.js";
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
const REPORT_TITLE = "RFQ Register";

const EXPORT_COLUMNS = [
  { key: "rfqNo", label: "RFQ No.", align: "left" },
  { key: "rfqDate", label: "Date", align: "left" },
  { key: "rfqType", label: "RFQ Type", align: "left" },
  { key: "department", label: "Department", align: "left" },
  { key: "procurementCategory", label: "Procurement Category", align: "left" },
  { key: "referencePrNo", label: "Reference PR", align: "left" },
  { key: "vendorCount", label: "Vendor Count", align: "right" },
  { key: "closingDate", label: "Closing Date", align: "left" },
  { key: "buyer", label: "Buyer", align: "left" },
  { key: "status", label: "Status", align: "left" },
  { key: "totalQty", label: "Total Qty", align: "right" },
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
  return {
    ...doc,
    id,
    rfqNo: doc.rfqNo ?? "",
    rfqDate: doc.rfqDate ?? "",
    rfqType: doc.rfqType ?? "",
    department: doc.department ?? "",
    procurementCategory: doc.procurementCategory ?? "",
    referencePrNo: doc.referencePrNo ?? "",
    vendorCount: doc.vendorCount ?? (Array.isArray(doc.vendors) ? doc.vendors.length : 0),
    closingDate: doc.closingDate ?? "",
    buyer: doc.buyer ?? doc.createdByName ?? "",
    status: doc.displayStatus || doc.status || "",
    totalQty: Number(doc.totalQty) || 0,
  };
}

function exportCellValue(row, col) {
  switch (col.key) {
    case "rfqDate":
    case "closingDate":
      return formatDisplayDate(row[col.key]);
    case "totalQty":
      return formatReportQty(row.totalQty);
    default:
      return row[col.key] ?? "";
  }
}

export default function RfqReportPage() {
  const toast = useToast();
  const { activeLocation } = useLocationScope();
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [applied, setApplied] = useState({
    ...defaultRange,
    search: "",
    department: "",
    status: "",
    buyer: "",
    vendor: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRfqsRequest();
      setAllRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load RFQ register");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load, activeLocation?._id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listSupplierMasterRequest();
        if (!cancelled) {
          setVendorOptions(
            (Array.isArray(res?.data) ? res.data : []).map((s) => ({
              value: String(s._id || s.id),
              label: `${s.supplierCode || ""} · ${s.supplierName || ""}`.trim(),
            }))
          );
        }
      } catch {
        if (!cancelled) setVendorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.department).filter(Boolean));
    return [{ value: "", label: "All departments" }, ...Array.from(set).map((d) => ({ value: d, label: d }))];
  }, [allRows]);

  const buyerOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.buyer).filter(Boolean));
    return [{ value: "", label: "All buyers" }, ...Array.from(set).map((b) => ({ value: b, label: b }))];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const search = applied.search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (!inDateRange(row.rfqDate, applied.fromDate, applied.toDate)) return false;
      if (applied.department && row.department !== applied.department) return false;
      if (applied.status && row.status !== applied.status) return false;
      if (applied.buyer && row.buyer !== applied.buyer) return false;
      if (applied.vendor) {
        const vendors = row.vendors || [];
        if (!vendors.some((v) => String(v.supplierId) === applied.vendor)) return false;
      }
      if (!search) return true;
      const hay = [row.rfqNo, row.department, row.buyer, row.status, row.referencePrNo, row.procurementCategory]
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
    setApplied({
      fromDate,
      toDate,
      search: searchInput.trim(),
      department: departmentFilter,
      status: statusFilter,
      buyer: buyerFilter,
      vendor: vendorFilter,
    });
    setPage(1);
  }

  function handleResetFilter() {
    const range = currentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setDepartmentFilter("");
    setStatusFilter("");
    setBuyerFilter("");
    setVendorFilter("");
    setSearchInput("");
    setApplied({ ...range, search: "", department: "", status: "", buyer: "", vendor: "" });
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
        sheetName: "RFQ Register",
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
        <div className={styles.filterField}>
          <SelectField
            hideLabel
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={departmentOptions}
          />
        </div>
        <div className={styles.filterField}>
          <SelectField
            hideLabel
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "", label: "All statuses" }, ...RFQ_STATUS_OPTIONS]}
          />
        </div>
        <div className={styles.filterField}>
          <SelectField
            hideLabel
            label="Buyer"
            value={buyerFilter}
            onChange={setBuyerFilter}
            options={buyerOptions}
          />
        </div>
        <div className={styles.filterField}>
          <SelectField
            hideLabel
            label="Vendor"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[{ value: "", label: "All vendors" }, ...vendorOptions]}
          />
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
              placeholder="Search RFQ no., department, buyer…"
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
                <th>RFQ No.</th>
                <th>Date</th>
                <th>Type</th>
                <th>Department</th>
                <th>Reference PR</th>
                <th className={styles.num}>Vendors</th>
                <th>Closing Date</th>
                <th>Buyer</th>
                <th>Status</th>
                <th className={styles.num}>Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10}>Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10}>No records for the selected criteria.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="erp-link-btn"
                        onClick={() => openAuthenticatedAppTab(appPath(RFQ_PATHS.printPath(row.id)))}
                      >
                        {row.rfqNo}
                      </button>
                    </td>
                    <td>{formatDisplayDate(row.rfqDate)}</td>
                    <td>{row.rfqType || "—"}</td>
                    <td>{row.department || "—"}</td>
                    <td>{row.referencePrNo || "—"}</td>
                    <td className={styles.num}>{row.vendorCount}</td>
                    <td>{formatDisplayDate(row.closingDate)}</td>
                    <td>{row.buyer || "—"}</td>
                    <td>
                      <DocumentStatusBadge status={row.status} />
                    </td>
                    <td className={styles.num}>{formatReportQty(row.totalQty)}</td>
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
