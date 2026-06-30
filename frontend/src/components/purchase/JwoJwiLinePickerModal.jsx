import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function JwoJwiLinePickerModal({ open, itemRows = [], onClose, onApply }) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIds([]);
    setPage(1);
  }, [open]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = itemRows || [];
    if (q) {
      rows = rows.filter((row) =>
        [row.itemNo, row.itemName, row.itemDescription, row.hsnCode].some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [itemRows, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!open) return null;

  const toggleId = (id) => {
    const key = String(id);
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const selectedRows = (itemRows || []).filter((row) =>
    selectedIds.includes(String(row._id || row.id))
  );

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "78vw", minWidth: 800, maxWidth: 1150, maxHeight: "85vh" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Select Job Work Items (JWI)</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.2vh" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1vw" }}>
            <div className="sc-modal-search" style={{ maxWidth: "24vw", flex: 1 }}>
              <SearchIcon className="sc-modal-search__icon" />
              <input
                type="text"
                className="sc-modal-search__input"
                placeholder="Search material code, name…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Page {page} of {totalPages}
            </div>
          </div>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th>JWI No.</th>
                  <th>Material Name</th>
                  <th>Description</th>
                  <th>HSN/SAC</th>
                  <th>UoM</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={6} className="im-empty-cell">
                      <span className="im-no-records__text">No materials found</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const key = String(row._id || row.id);
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: "center" }}>{row.itemNo}</td>
                        <td>{row.itemName}</td>
                        <td>{row.itemDescription}</td>
                        <td style={{ textAlign: "center" }}>{row.hsnCode}</td>
                        <td style={{ textAlign: "center" }}>{row.uom}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(key)}
                            onChange={() => toggleId(key)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sc-modal-footer">
          <div className="sc-modal-footer-actions">
            <button type="button" className="sc-modal-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="sc-modal-btn-primary"
              disabled={!selectedRows.length}
              onClick={() => {
                onApply?.(selectedRows);
                onClose?.();
              }}
            >
              Add Selected{selectedRows.length ? ` (${selectedRows.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
