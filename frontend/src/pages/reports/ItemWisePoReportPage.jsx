import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import ErpMasterListFooter from "../../components/common/ErpMasterListFooter.jsx";
import ReportExportButtons from "../../components/reports/ReportExportButtons.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { listItemMasterRequest, listItemWisePoReportRequest } from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import { downloadReportPdf } from "../../utils/reportPdfExport.js";
import {
  currentMonthRange,
  formatDisplayDate,
  formatReportMoney,
  formatReportQty,
} from "../../utils/reportPageUtils.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./PurchaseOrderReportPage.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";

const PAGE_SIZE = 25;
const REPORT_TITLE = "Material Wise Purchase Orders";

const EXPORT_COLUMNS = [
  { key: "poNo", label: "PO #", align: "left" },
  { key: "poDate", label: "PO Date", align: "left" },
  { key: "deliveryDate", label: "Delivery Date", align: "left" },
  { key: "supplierName", label: "Vendor Name", align: "left" },
  { key: "itemNo", label: "Material Code", align: "left" },
  { key: "itemName", label: "Material Name", align: "left" },
  { key: "itemDescription", label: "Material Description", align: "left" },
  { key: "uom", label: "UoM", align: "center" },
  { key: "poQty", label: "PO Qty", align: "right" },
  { key: "poRate", label: "PO Rate", align: "right" },
];

const defaultRange = currentMonthRange();

function exportCellValue(row, col) {
  switch (col.key) {
    case "poDate":
    case "deliveryDate":
      return formatDisplayDate(row[col.key]);
    case "poQty":
      return formatReportQty(row.poQty);
    case "poRate":
      return formatReportMoney(row.poRate);
    default:
      return row[col.key] ?? "";
  }
}

export default function ItemWisePoReportPage() {
  const toast = useToast();
  const { activeLocation } = useLocationScope();
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [applied, setApplied] = useState({ ...defaultRange, itemId: "", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listItemMasterRequest();
        if (!cancelled) {
          setItems(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const itemOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select Material Name" }];
    const sorted = [...items].sort((a, b) =>
      String(a.itemName || "").localeCompare(String(b.itemName || ""), undefined, { sensitivity: "base" })
    );
    for (const row of sorted) {
      const id = row._id != null ? String(row._id) : String(row.id || "");
      const name = String(row.itemName || row.itemNo || "").trim();
      if (id && name) opts.push({ value: id, label: name });
    }
    return opts;
  }, [items]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listItemWisePoReportRequest({
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        itemId: applied.itemId || undefined,
        search: applied.search || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      const data = res?.data || {};
      setRows(
        (data.items || []).map((row) => ({
          ...row,
          id: String(row._id),
        }))
      );
      setPagination(data.pagination || { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err?.message || "Failed to load item wise PO report");
      setRows([]);
      setPagination({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [applied, page, toast]);

  useEffect(() => {
    load();
  }, [load, activeLocation?._id]);

  function handleApplyFilter() {
    setApplied({
      fromDate,
      toDate,
      itemId,
      search: searchInput.trim(),
    });
    setPage(1);
  }

  function handleResetFilter() {
    const range = currentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setItemId("");
    setSearchInput("");
    setApplied({ ...range, itemId: "", search: "" });
    setPage(1);
  }

  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: setPage,
  });

  async function fetchAllExportRows() {
    const res = await listItemWisePoReportRequest({
      fromDate: applied.fromDate,
      toDate: applied.toDate,
      itemId: applied.itemId || undefined,
      search: applied.search || undefined,
      export: true,
    });
    return res?.data?.items || [];
  }

  function reportExportSubtitle() {
    const parts = [];
    if (applied.fromDate && applied.toDate) {
      parts.push(`Period: ${formatDisplayDate(applied.fromDate)} to ${formatDisplayDate(applied.toDate)}`);
    }
    if (applied.itemId) {
      const label = itemOptions.find((o) => o.value === applied.itemId)?.label;
      if (label) parts.push(`Material: ${label}`);
    }
    return parts.join("  |  ");
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      const exportRows = await fetchAllExportRows();
      if (!exportRows.length) {
        toast.error("No rows to export for the selected filters.");
        return;
      }
      await downloadMasterWorkbook({
        sheetName: "Material Wise PO",
        fileName: `item-wise-po-report-${applied.fromDate}-${applied.toDate}.xlsx`,
        columns: EXPORT_COLUMNS,
        rows: exportRows,
        getCellValue: exportCellValue,
      });
      toast.success("Excel file downloaded.");
    } catch (err) {
      toast.error(err?.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setPdfExporting(true);
    try {
      const exportRows = await fetchAllExportRows();
      if (!exportRows.length) {
        toast.error("No rows to export for the selected filters.");
        return;
      }
      downloadReportPdf({
        title: REPORT_TITLE,
        subtitle: reportExportSubtitle(),
        fileName: `item-wise-po-report-${applied.fromDate}-${applied.toDate}.pdf`,
        columns: EXPORT_COLUMNS,
        rows: exportRows,
        getCellValue: exportCellValue,
      });
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error(err?.message || "PDF export failed");
    } finally {
      setPdfExporting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>{REPORT_TITLE}</h1>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Material Name</label>
          <SelectField hideLabel value={itemId} onChange={(v) => setItemId(v)} options={itemOptions} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>From Date</label>
          <DateField hideLabel type="date" value={fromDate} onChange={(v) => setFromDate(v)} />
        </div>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>To Date</label>
          <DateField hideLabel type="date" value={toDate} onChange={(v) => setToDate(v)} />
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
              <Search size={16} strokeWidth={2} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search PO no., supplier, material…"
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

        <div className={styles.tableSection}>
        <div className={styles.tableWrap}>
          <table className={`im-table ${styles.table}`}>
            <thead>
              <tr>
                <th>PO #</th>
                <th>PO Date</th>
                <th>Delivery Date</th>
                <th>Vendor Name</th>
                <th>Material Code</th>
                <th>Material Name</th>
                <th>Material Description</th>
                <th>UoM</th>
                <th className={styles.num}>PO Qty</th>
                <th className={styles.num}>PO Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyCell}>
                    No PO lines found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.poNo}</td>
                    <td>{formatDisplayDate(row.poDate)}</td>
                    <td>{formatDisplayDate(row.deliveryDate)}</td>
                    <td className={styles.supplierCell}>{row.supplierName}</td>
                    <td>{row.itemNo || "—"}</td>
                    <td>{row.itemName || "—"}</td>
                    <td className={styles.supplierCell}>{row.itemDescription || "—"}</td>
                    <td>{row.uom || "—"}</td>
                    <td className={styles.num}>{formatReportQty(row.poQty)}</td>
                    <td className={styles.num}>{formatReportMoney(row.poRate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooterBar}>
          <ReportExportButtons
            onExcel={handleExportExcel}
            onPdf={handleExportPdf}
            exporting={exporting}
            pdfExporting={pdfExporting}
          />
        </div>
        </div>
      </section>
    </div>
  );
}
