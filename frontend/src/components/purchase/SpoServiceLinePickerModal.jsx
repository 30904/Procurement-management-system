import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function SpoServiceLinePickerModal({
  open,
  serviceRows = [],
  onClose,
  onApply,
}) {
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
    let rows = serviceRows || [];
    if (q) {
      rows = rows.filter((row) =>
        [row.serviceNo, row.serviceDescription, row.sacCode].some((v) =>
          String(v ?? "").toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [serviceRows, query]);

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

  const selectedRows = (serviceRows || []).filter((row) =>
    selectedIds.includes(String(row._id || row.id))
  );

  const pagerBtnStyle = {
    width: 32,
    height: 32,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
        style={{ ...modalStyle, width: "78vw", minWidth: 800, maxWidth: 1150, maxHeight: "85vh" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Purchase Service Master</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.2vh" }}>
          <div className="sc-modal-search" style={{ maxWidth: "28vw" }}>
            <SearchIcon className="sc-modal-search__icon" />
            <input
              type="text"
              className="sc-modal-search__input"
              placeholder="Search service no, description, SAC..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Service No.</th>
                  <th style={{ width: "34%" }}>Description</th>
                  <th style={{ width: "12%" }}>SAC</th>
                  <th style={{ width: "10%" }}>GST %</th>
                  <th style={{ width: "8%" }}>Add</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={5} className="im-empty-cell">
                      <span className="im-no-records__text">No active services found</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const key = String(row._id || row.id);
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: "center" }}>{row.serviceNo}</td>
                        <td>{row.serviceDescription}</td>
                        <td style={{ textAlign: "center" }}>{row.sacCode}</td>
                        <td style={{ textAlign: "center" }}>{Number(row.gstRate || 0).toFixed(2)}</td>
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
          <button type="button" onClick={onClose} className="sc-input" style={{ cursor: "pointer", width: "auto", minWidth: "7.5rem", padding: "0 1rem" }}>
            Cancel
          </button>
          <button
            type="button"
            className="sc-input"
            disabled={!selectedRows.length}
            style={{
              width: "auto",
              minWidth: "9.25rem",
              padding: "0 1rem",
              background: "var(--brand-primary)",
              color: "#fff",
              borderColor: "var(--brand-primary)",
              opacity: selectedRows.length ? 1 : 0.55,
              cursor: selectedRows.length ? "pointer" : "not-allowed",
            }}
            onClick={() => selectedRows.length && onApply?.(selectedRows)}
          >
            Add selected ({selectedRows.length})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
