import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function SpoServiceProviderLookupModal({
  open,
  providerRows = [],
  selectedProviderId = "",
  onClose,
  onApply,
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedId(selectedProviderId || "");
    setPage(1);
  }, [open, selectedProviderId]);

  const activeRows = useMemo(
    () =>
      (providerRows || []).filter((row) => String(row.isLspActive || "").toUpperCase() === "A"),
    [providerRows]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter((row) =>
      [row.lspCode, row.lspNameLegalEntity, row.lspNickName].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [activeRows, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!open) return null;

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

  const selectedRow =
    activeRows.find((row) => String(row.id || row._id) === String(selectedId)) || null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "72vw", minWidth: 760, maxWidth: 1100, maxHeight: "82vh" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Service Provider</span>
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
                placeholder="Search provider..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", fontSize: "0.85vw", color: "#64748b" }}>
              <button
                type="button"
                className="sc-input"
                style={{ ...pagerBtnStyle, cursor: page <= 1 ? "not-allowed" : "pointer" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="sc-input"
                style={{ ...pagerBtnStyle, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>LSP Code</th>
                  <th style={{ width: "36%" }}>Legal Name</th>
                  <th style={{ width: "20%" }}>Nick Name</th>
                  <th style={{ width: "8%" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={4} className="im-empty-cell">
                      <span className="im-no-records__text">No service providers found</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const key = row.id || row._id;
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: "center" }}>{row.lspCode || "—"}</td>
                        <td>{row.lspNameLegalEntity || "—"}</td>
                        <td style={{ textAlign: "center" }}>{row.lspNickName || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="radio"
                            name="spo-provider-choice"
                            checked={String(selectedId) === String(key)}
                            onChange={() => setSelectedId(String(key))}
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
            disabled={!selectedRow}
            style={{
              width: "auto",
              minWidth: "9.25rem",
              padding: "0 1rem",
              background: "var(--brand-primary)",
              color: "#fff",
              borderColor: "var(--brand-primary)",
              opacity: selectedRow ? 1 : 0.55,
              cursor: selectedRow ? "pointer" : "not-allowed",
            }}
            onClick={() => selectedRow && onApply?.(selectedRow)}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
