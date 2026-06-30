import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import SelectField from "../subcomponents/SelectField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

export default function PoSupplierLookupModal({
  open,
  supplierRows = [],
  categoryOptions = [],
  selectedSupplierId = "",
  title = "Vendor Details",
  codeColumnLabel = "Vendor Code",
  searchPlaceholder = "Search vendor...",
  onClose,
  onApply,
}) {
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setCategory("");
    setQuery("");
    setSelectedId(selectedSupplierId || "");
    setPage(1);
  }, [open, selectedSupplierId]);

  const filteredRows = useMemo(() => {
    let rows = supplierRows;
    if (category) {
      rows = rows.filter((row) => String(row.categoryType || "") === category);
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.supplierCode, row.supplierName, row.categoryType].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [supplierRows, category, query]);

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
    supplierRows.find((row) => String(row.id || row._id) === String(selectedId)) || null;

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
          <span className="sc-modal-title">{title}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.2vh" }}>
          <SelectField
            label="Vendor Category"
            options={[{ value: "", label: "Select Vendor Category" }, ...categoryOptions]}
            value={category}
            onChange={setCategory}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1vw" }}>
            <div className="sc-modal-search" style={{ maxWidth: "24vw", flex: 1 }}>
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
                  <th style={{ width: "14%" }}>{codeColumnLabel}</th>
                  <th style={{ width: "28%" }}>Vendor Name</th>
                  <th style={{ width: "16%" }}>State/Province</th>
                  <th style={{ width: "16%" }}>City/District</th>
                  <th style={{ width: "10%" }}>PIN Code</th>
                  <th style={{ width: "8%" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={6} className="im-empty-cell">
                      <span className="im-no-records__text">No vendors found</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const primaryAddress =
                      row?.supplierBillingAddress?.[0] || row?.supplierAddress?.[0] || {};
                    const key = row.id || row._id;
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: "center" }}>{row.supplierCode}</td>
                        <td>{row.supplierName}</td>
                        <td style={{ textAlign: "center" }}>{primaryAddress.state || "—"}</td>
                        <td style={{ textAlign: "center" }}>{primaryAddress.city || "—"}</td>
                        <td style={{ textAlign: "center" }}>{primaryAddress.pinCode || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="radio"
                            name="po-supplier-choice"
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
          <button
            type="button"
            onClick={onClose}
            className="sc-input"
            style={{
              cursor: "pointer",
              width: "auto",
              minWidth: "7.5rem",
              padding: "0 1rem",
              flex: "0 0 auto",
            }}
          >
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
              flex: "0 0 auto",
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
