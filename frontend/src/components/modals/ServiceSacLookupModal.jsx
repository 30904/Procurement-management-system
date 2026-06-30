import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

function formatRate(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

export default function ServiceSacLookupModal({
  open,
  sacRows = [],
  selectedSacCode = "",
  onClose,
  onApply,
}) {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState(selectedSacCode || "");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedCode(selectedSacCode || "");
  }, [open, selectedSacCode]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sacRows;
    return sacRows.filter((row) =>
      [row.sacCode, row.description, row.status].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [sacRows, query]);

  if (!open) return null;

  const selectedRow =
    sacRows.find((row) => String(row.sacCode) === String(selectedCode)) || null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{
          ...modalStyle,
          width: "64vw",
          minWidth: "720px",
          maxWidth: "980px",
          maxHeight: "78vh",
        }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">SAC Lookup</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ paddingTop: "1.2vh", gap: "1.2vh" }}>
          <div className="sc-modal-search" style={{ maxWidth: "24vw" }}>
            <SearchIcon className="sc-modal-search__icon" />
            <input
              type="text"
              className="sc-modal-search__input"
              placeholder="Search SAC code or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>
                    <div className="im-header-content" style={{ justifyContent: "center" }}>
                      Select
                    </div>
                  </th>
                  <th style={{ width: "18%" }}>
                    <div className="im-header-content" style={{ justifyContent: "center" }}>
                      SAC Code
                    </div>
                  </th>
                  <th style={{ width: "44%" }}>
                    <div className="im-header-content im-table-name-column" style={{ justifyContent: "flex-start" }}>
                      Description
                    </div>
                  </th>
                  <th style={{ width: "15%" }}>
                    <div className="im-header-content" style={{ justifyContent: "center" }}>
                      GST Rate %
                    </div>
                  </th>
                  <th style={{ width: "15%" }}>
                    <div className="im-header-content" style={{ justifyContent: "center" }}>
                      Status
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={5} className="im-empty-cell">
                      <span className="im-no-records__text">No SAC records found</span>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row._id || row.id || row.sacCode}
                      onClick={() => setSelectedCode(row.sacCode)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name="service-sac-choice"
                          checked={String(selectedCode) === String(row.sacCode)}
                          onChange={() => setSelectedCode(row.sacCode)}
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>{row.sacCode}</td>
                      <td style={{ textAlign: "left" }} className="im-table-name-column">
                        {row.description || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>{formatRate(row.gstRate)}</td>
                      <td style={{ textAlign: "center" }}>{row.status || "Active"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sc-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="sc-input"
            style={{ width: "7vw", minWidth: 90, cursor: "pointer", justifyContent: "center" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="sc-input"
            disabled={!selectedRow}
            style={{
              width: "9vw",
              minWidth: 120,
              cursor: selectedRow ? "pointer" : "not-allowed",
              justifyContent: "center",
              background: "var(--brand-primary)",
              color: "#fff",
              borderColor: "var(--brand-primary)",
              opacity: selectedRow ? 1 : 0.55,
            }}
            onClick={() => {
              if (!selectedRow) return;
              onApply?.(selectedRow);
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
