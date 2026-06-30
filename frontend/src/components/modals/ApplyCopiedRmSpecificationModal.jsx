import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import SearchIcon from "../../assets/search-icon.svg?react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ErpMasterListFooter from "../common/ErpMasterListFooter.jsx";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";
import styles from "./ApplyCopiedRmSpecificationModal.module.css";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "itemNo", label: "Material Code" },
  { value: "itemName", label: "Material Name" },
  { value: "itemCategory", label: "Product Code" },
  { value: "uom", label: "UoM" },
];

const RM_FILTER_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "with", label: "With RM specification" },
  { value: "without", label: "Without RM specification" },
];

function compareValues(a, b) {
  const sa = String(a ?? "").toLowerCase();
  const sb = String(b ?? "").toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

export default function ApplyCopiedRmSpecificationModal({
  open,
  sourceRow,
  allRows = [],
  loading = false,
  applying = false,
  onClose,
  onApply,
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [draftSortBy, setDraftSortBy] = useState("itemNo");
  const [draftRmFilter, setDraftRmFilter] = useState("all");
  const [draftCategory, setDraftCategory] = useState("");

  const [sortBy, setSortBy] = useState("itemNo");
  const [rmFilter, setRmFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setSearchQuery("");
    setPage(1);
    setDraftSortBy("itemNo");
    setDraftRmFilter("all");
    setDraftCategory("");
    setSortBy("itemNo");
    setRmFilter("all");
    setCategoryFilter("");
  }, [open, sourceRow?.id]);

  const categories = useMemo(() => {
    const set = new Set(allRows.map((r) => r.itemCategory).filter(Boolean));
    return Array.from(set).sort();
  }, [allRows]);

  const targetRows = useMemo(() => {
    const sourceId = String(sourceRow?.id ?? "");
    return allRows.filter((r) => String(r.id) !== sourceId);
  }, [allRows, sourceRow?.id]);

  const filtered = useMemo(() => {
    let rows = targetRows;
    if (rmFilter === "with") rows = rows.filter((r) => r.rmSpecConfigured);
    if (rmFilter === "without") rows = rows.filter((r) => !r.rmSpecConfigured);
    if (categoryFilter) rows = rows.filter((r) => r.itemCategory === categoryFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.itemNo, r.itemName, r.itemDescription, r.uom, r.itemCategory].some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        )
      );
    }

    return [...rows].sort((a, b) => compareValues(a[sortBy], b[sortBy]));
  }, [targetRows, rmFilter, categoryFilter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers({
    setPage,
    totalPages,
  });

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));

  const togglePageAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) {
        pageRows.forEach((r) => next.delete(r.id));
      } else {
        pageRows.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const handleApplyFilter = () => {
    setSortBy(draftSortBy);
    setRmFilter(draftRmFilter);
    setCategoryFilter(draftCategory);
    setPage(1);
  };

  const handleResetFilter = () => {
    setDraftSortBy("itemNo");
    setDraftRmFilter("all");
    setDraftCategory("");
    setSortBy("itemNo");
    setRmFilter("all");
    setCategoryFilter("");
    setSearchQuery("");
    setPage(1);
  };

  const handleApply = () => {
    const ids = Array.from(selectedIds);
    onApply?.(ids);
  };

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={applying ? undefined : onClose}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-labelledby="apply-rm-copy-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="apply-rm-copy-title" className={styles.title}>
            Apply Copied RM Specifications
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={applying}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sort By</span>
            <select
              className={styles.filterSelect}
              value={draftSortBy}
              onChange={(e) => setDraftSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>RM Spec</span>
            <select
              className={styles.filterSelect}
              value={draftRmFilter}
              onChange={(e) => setDraftRmFilter(e.target.value)}
            >
              {RM_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Product Code</span>
            <select
              className={styles.filterSelect}
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterActions}>
            <button type="button" className={styles.btnPinkSolid} onClick={handleApplyFilter}>
              Apply Filter
            </button>
            <button type="button" className={styles.btnPinkSolid} onClick={handleResetFilter}>
              Reset Filter
            </button>
          </div>
        </div>

        {sourceRow ? (
          <p className={styles.sourceHint}>
            Copying specification from <strong>{sourceRow.itemNo}</strong> — {sourceRow.itemName}
            {selectedIds.size > 0 ? ` · ${selectedIds.size} item(s) selected` : ""}
          </p>
        ) : null}

        <div className={styles.toolbar}>
          <div className="erp-search-wrap">
            <SearchIcon className="erp-search-icon" />
            <input
              type="text"
              className="erp-search-input"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="im-toolbar-pagination">
            <ErpMasterListFooter
              currentPage={safePage}
              totalPages={totalPages}
              totalRecords={filtered.length}
              onPrevPageClick={onPrevPageClick}
              onNextPageClick={onNextPageClick}
              hideTotalRecords
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "8%" }}>
                  <input
                    type="checkbox"
                    checked={pageAllSelected}
                    onChange={togglePageAll}
                    aria-label="Select all on page"
                    style={{ accentColor: "var(--brand-primary, #0f7c94)" }}
                  />
                </th>
                <th>Material Code</th>
                <th>Material Name</th>
                <th>Material Description</th>
                <th>UoM</th>
                <th>Product Code</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    Loading items…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    No materials match your filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        aria-label={`Select ${row.itemNo}`}
                      />
                    </td>
                    <td>{row.itemNo}</td>
                    <td>{row.itemName}</td>
                    <td>{row.itemDescription}</td>
                    <td>{row.uom}</td>
                    <td>{row.itemCategory}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnApplyOutline}
            disabled={applying || selectedIds.size === 0}
            onClick={handleApply}
          >
            {applying ? "Applying…" : "Apply Copied RM Specifications"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
