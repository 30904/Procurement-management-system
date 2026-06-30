import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RotateCcw, Search } from "lucide-react";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import ErpMasterListFooter from "../../components/common/ErpMasterListFooter.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { appPath } from "../../config/navigation.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import {
  listPurchaseOrderReportRequest,
  listSupplierMasterRequest,
} from "../../services/api.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./PurchaseOrderReportPage.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";

const PAGE_SIZE = 25;

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

function toInputDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toInputDate(from), to: toInputDate(to) };
}

const defaultRange = currentMonthRange();

export default function PurchaseOrderReportPage() {
  const toast = useToast();
  const { activeLocation } = useLocationScope();
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [applied, setApplied] = useState({ ...defaultRange, supplierId: "", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ totalTaxable: 0, totalGst: 0, totalPoValue: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listSupplierMasterRequest();
        if (!cancelled) {
          setSuppliers(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setSuppliers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const supplierOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Vendors" }];
    for (const s of suppliers) {
      const id = s._id != null ? String(s._id) : String(s.id || "");
      const name = String(s.supplierName || s.lspNameLegalEntity || "").trim();
      if (id && name) opts.push({ value: id, label: name });
    }
    return opts;
  }, [suppliers]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPurchaseOrderReportRequest({
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        supplierId: applied.supplierId || undefined,
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
      setTotals(data.totals || { totalTaxable: 0, totalGst: 0, totalPoValue: 0 });
      setPagination(data.pagination || { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase order report");
      setRows([]);
      setTotals({ totalTaxable: 0, totalGst: 0, totalPoValue: 0 });
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
      supplierId,
      search: searchInput.trim(),
    });
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleResetFilter() {
    const range = currentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setSupplierId("");
    setSearchInput("");
    setSearch("");
    setApplied({ ...range, supplierId: "", search: "" });
    setPage(1);
  }

  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: setPage,
  });

  function openPoPdf(row) {
    const id = row.id || row._id;
    if (!id) return;
    openAuthenticatedAppTab(appPath(`purchase/purchase-order/generate-po/${id}/print`));
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>Purchase Order Register</h1>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Vendor Name</label>
          <SelectField
            hideLabel
            value={supplierId}
            onChange={(v) => setSupplierId(v)}
            options={supplierOptions}
          />
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
              <Search size={16} />
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search PO no., supplier, reference…"
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
            <colgroup>
              <col className={styles.colPoNo} />
              <col className={styles.colPoDate} />
              <col className={styles.colVendor} />
              <col className={styles.colCurrency} />
              <col className={styles.colMoney} />
              <col className={styles.colMoney} />
              <col className={styles.colMoney} />
              <col className={styles.colRef} />
              <col className={styles.colAction} />
            </colgroup>
            <thead>
              <tr>
                <th>PO #</th>
                <th>PO Date</th>
                <th>Vendor Name</th>
                <th>Currency</th>
                <th className={styles.num}>Taxable Amount</th>
                <th className={styles.num}>GST Amount</th>
                <th className={styles.num}>Total PO Value</th>
                <th>Order Reference</th>
                <th className={styles.actionCol}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyCell}>
                    No purchase orders found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const vendorName = row.supplierName || "—";
                  const orderRef = row.orderReferenceNo || "—";
                  return (
                  <tr key={row.id}>
                    <td className={styles.cellTruncate} title={row.poNo}>
                      {row.poNo}
                    </td>
                    <td>{formatDisplayDate(row.poDate)}</td>
                    <td className={styles.cellTruncate} title={vendorName}>
                      {vendorName}
                    </td>
                    <td className={styles.currencyCell}>{row.currency || "—"}</td>
                    <td className={styles.num}>{formatMoney(row.taxableAmount)}</td>
                    <td className={styles.num}>{formatMoney(row.gstAmount)}</td>
                    <td className={styles.num}>{formatMoney(row.totalPoValue)}</td>
                    <td className={styles.cellTruncate} title={orderRef}>
                      {orderRef}
                    </td>
                    <td className={styles.actionCol}>
                      <button
                        type="button"
                        className={styles.pdfBtn}
                        title="Open PO print preview"
                        aria-label={`PDF for ${row.poNo}`}
                        onClick={() => openPoPdf(row)}
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.totals}>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Total Taxable Amount</span>
            <div className={styles.totalValueWrap}>
              <span className={styles.currencyBadge}>₹</span>
              <span className={styles.totalValue}>{formatMoney(totals.totalTaxable)}</span>
            </div>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Total GST Amount</span>
            <div className={styles.totalValueWrap}>
              <span className={styles.currencyBadge}>₹</span>
              <span className={styles.totalValue}>{formatMoney(totals.totalGst)}</span>
            </div>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Total PO Value</span>
            <div className={styles.totalValueWrap}>
              <span className={styles.currencyBadge}>₹</span>
              <span className={styles.totalValue}>{formatMoney(totals.totalPoValue)}</span>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
