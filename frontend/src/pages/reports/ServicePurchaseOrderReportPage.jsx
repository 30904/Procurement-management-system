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
  listLogisticsMasterRequest,
  listServicePurchaseOrderReportRequest,
} from "../../services/api.js";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./PurchaseOrderReportPage.module.css";
import spoStyles from "./ServicePurchaseOrderReportPage.module.css";
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

export default function ServicePurchaseOrderReportPage() {
  const toast = useToast();
  const { activeLocation } = useLocationScope();
  const [providers, setProviders] = useState([]);
  const [serviceProviderId, setServiceProviderId] = useState("");
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [applied, setApplied] = useState({ ...defaultRange, serviceProviderId: "", search: "" });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ totalTaxable: 0, totalGst: 0, totalSpoValue: 0 });
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listLogisticsMasterRequest();
        if (!cancelled) {
          setProviders(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const providerOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Service Providers" }];
    for (const p of providers) {
      if (String(p.isLspActive || "").toUpperCase() !== "A") continue;
      const id = p._id != null ? String(p._id) : String(p.id || "");
      const name = String(p.lspNameLegalEntity || p.lspNickName || "").trim();
      if (id && name) opts.push({ value: id, label: name });
    }
    return opts;
  }, [providers]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listServicePurchaseOrderReportRequest({
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        serviceProviderId: applied.serviceProviderId || undefined,
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
      setTotals(data.totals || { totalTaxable: 0, totalGst: 0, totalSpoValue: 0 });
      setPagination(data.pagination || { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err?.message || "Failed to load service purchase order report");
      setRows([]);
      setTotals({ totalTaxable: 0, totalGst: 0, totalSpoValue: 0 });
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
      serviceProviderId,
      search: searchInput.trim(),
    });
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleResetFilter() {
    const range = currentMonthRange();
    setFromDate(range.from);
    setToDate(range.to);
    setServiceProviderId("");
    setSearchInput("");
    setSearch("");
    setApplied({ ...range, serviceProviderId: "", search: "" });
    setPage(1);
  }

  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    onPageChange: setPage,
  });

  function openSpoPdf(row) {
    const id = row.id || row._id;
    if (!id) return;
    openAuthenticatedAppTab(appPath(`reports/purchase/service-purchase-order/${id}/print`));
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleBar}>
        <h1 className={styles.title}>Service Purchase Order Register</h1>
      </header>

      <section className={styles.filters}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel}>Service Provider</label>
          <SelectField
            hideLabel
            value={serviceProviderId}
            onChange={(v) => setServiceProviderId(v)}
            options={providerOptions}
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
              placeholder="Search SPO no., provider, reference…"
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
          <table className={`im-table ${styles.table} ${spoStyles.table}`}>
            <thead>
              <tr>
                <th>SPO #</th>
                <th>SPO Date</th>
                <th>Service Provider</th>
                <th>Currency</th>
                <th className={styles.num}>Taxable Amount</th>
                <th className={styles.num}>GST Amount</th>
                <th className={styles.num}>Total SPO Value</th>
                <th>Order Reference</th>
                <th>Status</th>
                <th className={styles.actionCol}>Action</th>
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
                    No service purchase orders found for the selected filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.spoNo}</td>
                    <td>{formatDisplayDate(row.spoDate)}</td>
                    <td className={`${styles.supplierCell} ${spoStyles.providerCell}`} title={row.serviceProviderName}>
                      {row.serviceProviderName}
                    </td>
                    <td>{row.currency}</td>
                    <td className={styles.num}>{formatMoney(row.taxableAmount)}</td>
                    <td className={styles.num}>{formatMoney(row.gstAmount)}</td>
                    <td className={styles.num}>{formatMoney(row.totalSpoValue)}</td>
                    <td>{row.orderReferenceNo || "—"}</td>
                    <td>{row.status}</td>
                    <td className={styles.actionCol}>
                      <button
                        type="button"
                        className={styles.pdfBtn}
                        title="Open SPO print preview"
                        aria-label={`PDF for ${row.spoNo}`}
                        onClick={() => openSpoPdf(row)}
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))
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
            <span className={styles.totalLabel}>Total SPO Value</span>
            <div className={styles.totalValueWrap}>
              <span className={styles.currencyBadge}>₹</span>
              <span className={styles.totalValue}>{formatMoney(totals.totalSpoValue)}</span>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
