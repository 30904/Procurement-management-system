import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import SearchIcon from "../../assets/search-icon.svg?react";
import NewBtnIcon from "../../assets/new-btn.svg?react";
import NoRecordsIcon from "../../assets/no_records.svg";
import ActionPinkIcon from "../../assets/action-pink.svg";
import FilterInactiveIcon from "../../assets/filter-inactive.svg?react";
import FilterActiveIcon from "../../assets/filter-active.svg?react";
import { useFooter } from "../../context/FooterContext.jsx";
import ActionDropdown from "./ActionDropdown.jsx";
import ErpMasterListFooter from "./ErpMasterListFooter.jsx";
import "../../styles/theme.css";
import { usePageNavClickHandlers } from "../../utils/paginationNavHandlers.js";

/**
 * Generic reusable data table matching the framework's master-list design.
 *
 * @param {Object}   props
 * @param {Array}    props.columns        - Column definitions: { key, label, width, align, filterable?, sortable?, render? }
 * @param {Array}    props.rows           - Data rows (each must have a unique `id` or `_id`)
 * @param {boolean}  [props.loading]      - Show nothing while loading
 * @param {string}   [props.searchPlaceholder] - Placeholder for the search box
 * @param {boolean}  [props.showSearch]   - Show search bar (default true)
 * @param {boolean}  [props.showNewBtn]   - Show "+ New" button (default true)
 * @param {Function} [props.onNew]        - Called when "+ New" is clicked
 * @param {Array}    [props.actions]      - Action dropdown options: [{ label, onClick(row) }]
 * @param {Function} [props.onRowClick]   - Called when a row is clicked (receives row)
 * @param {string}   [props.emptyMessage] - Text when no records
 * @param {React.ReactNode} [props.toolbarRight] - Custom content on right side of toolbar
 * @param {string}   [props.className]    - Extra class on the wrapper
 * @param {string[]} [props.stableSortKeys] - When sorting a column, tie-break using these keys (asc) in order
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  searchPlaceholder = "Search...",
  showSearch = true,
  showNewBtn = true,
  onNew,
  actions,
  onRowClick,
  emptyMessage = "No records found",
  toolbarRight,
  className = "",
  pageSize = null,
  alwaysShowPagination = false,
  paginationAtTop = false,
  hideBottomPagination = false,
  tableClassName = "",
  disableInnerScroll = false,
  hidePaginationTotalRecords = false,
  stableSortKeys = [],
  syncPaginationToAppFooter = true,
}) {
  const footerCtx = useFooter();
  const setFooterContent = footerCtx?.setFooterContent;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filterPopover, setFilterPopover] = useState(null);
  const [headerTooltip, setHeaderTooltip] = useState(null);
  const [page, setPage] = useState(1);
  const tableWrapRef = useRef(null);

  const rowId = (row) => row._id || row.id || String(row);

  const handleToggleFilter = useCallback((key, value) => {
    setActiveFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleSelectAll = useCallback((key, allValues) => {
    setActiveFilters((prev) => {
      const current = prev[key] || [];
      const next = current.length === allValues.length ? [] : allValues;
      return { ...prev, [key]: next };
    });
  }, []);

  useEffect(() => {
    if (!filterPopover) return;
    const close = () => setFilterPopover(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [filterPopover]);

  const handleSort = useCallback(
    (key) => {
      setSortConfig((prev) => {
        if (prev.key === key) {
          if (prev.direction === "asc") return { key, direction: "desc" };
          if (prev.direction === "desc") return { key: null, direction: null };
        }
        return { key, direction: "asc" };
      });
    },
    []
  );

  const filteredAndSortedRows = useMemo(() => {
    let result = rows || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          if (col.key === "action") return false;
          return String(row[col.key] ?? "")
            .toLowerCase()
            .includes(q);
        })
      );
    }

    result = result.filter((row) =>
      Object.entries(activeFilters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(row[key]);
      })
    );

    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      const compareAsc = (aVal, bVal) =>
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal ?? "").localeCompare(String(bVal ?? ""), undefined, {
              numeric: true,
              sensitivity: "base",
            });

      result = [...result].sort((a, b) => {
        let cmp = compareAsc(a[key], b[key]);
        if (cmp !== 0) return direction === "desc" ? -cmp : cmp;

        for (const tieKey of stableSortKeys) {
          if (tieKey === key) continue;
          cmp = compareAsc(a[tieKey], b[tieKey]);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }

    return result;
  }, [rows, columns, searchQuery, activeFilters, sortConfig, stableSortKeys]);

  const paginationEnabled = pageSize != null && Number(pageSize) > 0;
  const totalPages = paginationEnabled
    ? Math.max(1, Math.ceil((filteredAndSortedRows?.length || 0) / Number(pageSize)))
    : 1;
  const safePage = paginationEnabled ? Math.min(page, totalPages) : 1;
  const pagedRows = paginationEnabled
    ? filteredAndSortedRows.slice((safePage - 1) * Number(pageSize), safePage * Number(pageSize))
    : filteredAndSortedRows;

  const { onPrevPageClick, onNextPageClick } = usePageNavClickHandlers(setPage, totalPages);

  useEffect(() => {
    if (!paginationEnabled) return;
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationEnabled, searchQuery, sortConfig, JSON.stringify(activeFilters), rows]);

  const hasToolbar =
    showSearch || showNewBtn || toolbarRight || (paginationAtTop && paginationEnabled);
  const useAppFooterPagination = paginationEnabled && syncPaginationToAppFooter && setFooterContent;

  useEffect(() => {
    if (!useAppFooterPagination) return undefined;

    setFooterContent(
      <ErpMasterListFooter
        currentPage={safePage}
        totalPages={totalPages}
        totalRecords={filteredAndSortedRows.length}
        onPrevPageClick={onPrevPageClick}
        onNextPageClick={onNextPageClick}
      />
    );

    return () => setFooterContent(null);
  }, [
    useAppFooterPagination,
    safePage,
    totalPages,
    filteredAndSortedRows.length,
    onPrevPageClick,
    onNextPageClick,
    setFooterContent,
  ]);

  const showBottomPagination =
    paginationEnabled &&
    !hideBottomPagination &&
    !useAppFooterPagination &&
    !paginationAtTop &&
    filteredAndSortedRows.length > 0 &&
    (alwaysShowPagination || totalPages > 1);

  const renderCellContent = (col, row) => {
    if (col.key === "action" && actions?.length) {
      return (
        <ActionDropdown
          icon={ActionPinkIcon}
          options={actions}
          row={row}
          onOpenChange={(open) => {
            if (open) setFilterPopover(null);
          }}
        />
      );
    }

    if (col.render) {
      const rendered = col.render(row[col.key], row);
      if (rendered != null && typeof rendered !== "object") {
        const text = String(rendered);
        return (
          <div
            className={`tooltip-container ${col.align === "left" ? "im-table-name-column" : ""}`}
          >
            <div className="truncated-text">{text}</div>
            <div className="custom-tooltip">
              {text}
              <div className="tooltip-arrow" />
            </div>
          </div>
        );
      }
      return rendered;
    }

    if (col.type === "status") {
      const val = row[col.key];
      const display = val === "Approved" ? "Active" : val;
      const isInactive =
        String(val).toLowerCase() === "inactive" ||
        String(val).toLowerCase() === "disabled";
      return (
        <span
          className={`im-status ${col.align === "left" ? "im-table-name-column" : ""}`}
        >
          <span
            className={`im-status-dot ${isInactive ? "im-status-dot--inactive" : ""}`}
          />
          {display}
        </span>
      );
    }

    if (col.type === "date") {
      const val = row[col.key];
      if (!val) return "";
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
      return (
        <div className="tooltip-container">
          <div className="truncated-text">{formatted}</div>
          <div className="custom-tooltip">
            {val}
            <div className="tooltip-arrow" />
          </div>
        </div>
      );
    }

    if (col.type === "password") {
      return (
        <div className="tooltip-container">
          <div className="truncated-text">*******</div>
          <div className="custom-tooltip">
            {row[col.key]}
            <div className="tooltip-arrow" />
          </div>
        </div>
      );
    }

    const value = row[col.key];
    return (
      <div
        className={`tooltip-container ${col.align === "left" ? "im-table-name-column" : ""}`}
      >
        <div className="truncated-text">{value}</div>
        <div className="custom-tooltip">
          {value}
          <div className="tooltip-arrow" />
        </div>
      </div>
    );
  };

  const openFilterPopover = useCallback((colKey, anchorEl) => {
    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = window.innerWidth * 0.16;
    const x =
      rect.left + popoverWidth > window.innerWidth
        ? window.innerWidth - popoverWidth - 8
        : rect.left;
    setFilterPopover({ key: colKey, x, y: rect.bottom + 5 });
  }, []);

  const renderSortIcon = (key) => {
    const size = 11;
    if (sortConfig.key !== key) return <ArrowUpDown size={size} strokeWidth={2.2} aria-hidden />;
    if (sortConfig.direction === "asc") return <ArrowUp size={size} strokeWidth={2.4} aria-hidden />;
    return <ArrowDown size={size} strokeWidth={2.4} aria-hidden />;
  };

  if (loading) return null;

  return (
    <>
      {hasToolbar && (
        <div className="im-toolbar">
          {showSearch && (
            <div className="erp-search-wrap">
              <SearchIcon className="erp-search-icon" />
              <input
                type="text"
                className="erp-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {paginationAtTop &&
          paginationEnabled &&
          (alwaysShowPagination || filteredAndSortedRows.length > 0) ? (
            <div className="im-toolbar-pagination">
              <ErpMasterListFooter
                currentPage={safePage}
                totalPages={totalPages}
                totalRecords={filteredAndSortedRows.length}
                onPrevPageClick={onPrevPageClick}
                onNextPageClick={onNextPageClick}
                hideTotalRecords={hidePaginationTotalRecords}
              />
            </div>
          ) : null}
          {toolbarRight}
          {showNewBtn && onNew && (
            <NewBtnIcon
              className="im-new-btn erp-action-svg-btn"
              onClick={onNew}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>
      )}

      <div ref={tableWrapRef} className={`im-page-wrap ${className}`}>
        <div className={disableInnerScroll ? "im-table-scroll im-table-scroll--fit" : "im-table-scroll"}>
          <table className={`im-table im-table--master ${tableClassName}`.trim()}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const isLeft = col.align === "left";
                  const sortActive = sortConfig.key === col.key;
                  const filterActive = (activeFilters[col.key]?.length ?? 0) > 0;

                  const showHeaderTooltip = (e) => {
                    const el = e.currentTarget;
                    if (el.scrollWidth > el.clientWidth + 1) {
                      const rect = el.getBoundingClientRect();
                      setHeaderTooltip({
                        label: col.label,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      });
                    }
                  };

                  const labelEl = (
                    <span
                      className={`im-header-label${isLeft ? " im-table-name-column" : ""}`}
                      title={col.label}
                      onMouseEnter={showHeaderTooltip}
                      onMouseLeave={() => setHeaderTooltip(null)}
                    >
                      {col.label}
                    </span>
                  );

                  return (
                    <th
                      key={col.key}
                      className={`im-header-relative im-th-inline${isLeft ? " im-th-inline--left" : ""}`}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      <div className={`im-header-inline${isLeft ? " im-header-inline--left" : ""}`}>
                        {col.sortable ? (
                          <button
                            type="button"
                            className={`im-header-sort-zone${sortActive ? " is-active" : ""}`}
                            aria-label={`Sort by ${col.label}`}
                            title={`Sort by ${col.label}`}
                            onClick={() => handleSort(col.key)}
                          >
                            {labelEl}
                            <span className="im-header-sort-ico">{renderSortIcon(col.key)}</span>
                          </button>
                        ) : (
                          labelEl
                        )}
                        {col.filterable ? (
                          <button
                            type="button"
                            className={`im-header-filter-btn${filterActive ? " is-active" : ""}`}
                            aria-label={`Filter ${col.label}`}
                            title={`Filter ${col.label}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (filterPopover?.key === col.key) {
                                setFilterPopover(null);
                                return;
                              }
                              openFilterPopover(col.key, e.currentTarget);
                            }}
                          >
                            {filterActive ? (
                              <FilterActiveIcon className="im-filter-ico" aria-hidden />
                            ) : (
                              <FilterInactiveIcon className="im-filter-ico" aria-hidden />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.length === 0 ? (
                <tr className="im-empty-row">
                  <td colSpan={columns.length} className="im-empty-cell">
                    <div className="im-no-records">
                      <img
                        src={NoRecordsIcon}
                        alt="No records"
                        className="im-no-records__icon"
                      />
                      <span className="im-no-records__text">
                        {emptyMessage}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr
                    key={rowId(row)}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align, minWidth: col.minWidth }}
                      >
                        {renderCellContent(col, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {showBottomPagination ? (
          <div className="erp-footer-pagination" style={{ marginTop: "0.6vh", flexShrink: 0 }}>
            <ErpMasterListFooter
              currentPage={safePage}
              totalPages={totalPages}
              totalRecords={filteredAndSortedRows.length}
              onPrevPageClick={onPrevPageClick}
              onNextPageClick={onNextPageClick}
              hideTotalRecords={hidePaginationTotalRecords}
            />
          </div>
        ) : null}
      </div>

      {filterPopover &&
        createPortal(
          <div
            className="im-filter-popover"
            style={{ top: filterPopover.y, left: filterPopover.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const allValues = Array.from(
                new Set(rows.map((r) => r[filterPopover.key]))
              )
                .filter(Boolean)
                .sort();
              const selectedValues =
                activeFilters[filterPopover.key] || [];
              const isAllSelected =
                selectedValues.length === allValues.length &&
                allValues.length > 0;

              return (
                <>
                  <div className="im-filter-popover-item">
                    <div
                      className="im-checkbox-row"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectAll(filterPopover.key, allValues);
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ display: "none" }}
                        checked={isAllSelected}
                        readOnly
                      />
                      <label
                        className={`im-checkbox-box${isAllSelected ? " im-checkbox-box--checked" : ""}`}
                      />
                      <span className="im-checkbox-label im-checkbox-label--emphasis">
                        Select All
                      </span>
                    </div>
                  </div>
                  <div className="im-filter-popover-scroll">
                    {allValues.map((val) => (
                      <div
                        key={val}
                        className="im-checkbox-row"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleFilter(filterPopover.key, val);
                        }}
                      >
                        <input
                          type="checkbox"
                          style={{ display: "none" }}
                          checked={selectedValues.includes(val)}
                          readOnly
                        />
                        <label
                          className={`im-checkbox-box${selectedValues.includes(val) ? " im-checkbox-box--checked" : ""}`}
                        />
                        <span className="im-checkbox-label">{val}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>,
          document.body
        )}

      {headerTooltip &&
        createPortal(
          <div
            className="custom-tooltip custom-tooltip--header custom-tooltip--header-portal"
            style={{
              left: `${headerTooltip.x}px`,
              top: `${headerTooltip.y}px`,
            }}
            aria-hidden="true"
          >
            {headerTooltip.label}
            <div className="tooltip-arrow" />
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * @deprecated DataTable syncs pagination to the app footer when `pageSize` is set.
 * Keep only on pages that do not use DataTable pagination.
 */
DataTable.useRecordCount = function useRecordCount(rows, setFooterContent) {
  useEffect(() => {
    if (!setFooterContent) return undefined;
    setFooterContent(`Total Records  ->  ${rows?.length ?? 0}`);
    return () => setFooterContent(null);
  }, [rows?.length, setFooterContent]);
};
