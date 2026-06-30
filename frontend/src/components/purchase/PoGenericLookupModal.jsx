import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function PoGenericLookupModal({
  open,
  title = "Lookup",
  searchPlaceholder = "Search…",
  columns = [],
  rows = [],
  selectedId = "",
  getRowId = (row) => String(row._id || row.id || ""),
  onClose,
  onApply,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(selectedId || "");
    setPage(1);
  }, [open, selectedId]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!open) return null;

  const selectedRow = rows.find((row) => getRowId(row) === String(selected)) || null;

  const pagerBtnStyle = {
    width: 32,
    height: 32,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    fontSize: "1rem",
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "52vw", minWidth: 520, maxWidth: 860 }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">{title}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          <div className="sc-modal-search" style={{ marginBottom: "1rem" }}>
            <SearchIcon className="sc-modal-search__icon" />
            <input
              type="text"
              className="sc-modal-search__input"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="im-table-scroll" style={{ maxHeight: "42vh" }}>
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th style={{ width: 40 }} aria-label="Select" />
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={columns.length + 1} className="im-empty-cell">
                      No matching records.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const id = getRowId(row);
                    return (
                      <tr
                        key={id}
                        onClick={() => setSelected(id)}
                        style={{ cursor: "pointer" }}
                        className={selected === id ? "im-row-selected" : undefined}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input type="radio" checked={selected === id} readOnly aria-label="Select row" />
                        </td>
                        {columns.map((col) => (
                          <td key={col.key}>{row[col.key] ?? "—"}</td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.75rem" }}>
              <button type="button" style={pagerBtnStyle} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹
              </button>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                style={pagerBtnStyle}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
        <div className="sc-modal-footer">
          <button type="button" className="sc-modal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="sc-modal-btn-primary"
            disabled={!selectedRow}
            onClick={() => selectedRow && onApply?.(selectedRow)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
