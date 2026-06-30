import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SearchIcon from "../../assets/search-icon.svg?react";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

export default function ItemSupplierLookupModal({ open, supplierRows = [], selectedSupplierId = "", onClose, onApply }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(selectedSupplierId || "");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedId(selectedSupplierId || "");
  }, [open, selectedSupplierId]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return supplierRows;
    return supplierRows.filter((row) =>
      [row.supplierCode, row.supplierName, row.categoryType, row.supplierPurchaseType, row.isSupplierActive].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [supplierRows, query]);

  if (!open) return null;
  const selectedRow = supplierRows.find((row) => String(row.id || row._id) === String(selectedId)) || null;
  return createPortal(
    <div className="sc-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()} style={overlayStyle}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "70vw", minWidth: "760px", maxWidth: "1080px", maxHeight: "78vh" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Vendor Details</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body" style={{ paddingTop: "1.2vh", gap: "1.2vh" }}>
          <div className="sc-modal-search" style={{ maxWidth: "24vw" }}>
            <SearchIcon className="sc-modal-search__icon" />
            <input type="text" className="sc-modal-search__input" placeholder="Search vendor..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead><tr><th style={{ width: "16%" }}>Vendor Code</th><th style={{ width: "30%" }}>Vendor Name</th><th style={{ width: "17%" }}>Category</th><th style={{ width: "14%" }}>City</th><th style={{ width: "13%" }}>PIN</th><th style={{ width: "10%" }}>Select</th></tr></thead>
              <tbody>
                {filteredRows.length === 0 ? <tr className="im-empty-row"><td colSpan={6} className="im-empty-cell"><span className="im-no-records__text">No vendors found</span></td></tr> : filteredRows.map((row) => {
                  const primaryAddress = row?.supplierBillingAddress?.[0] || row?.supplierAddress?.[0] || {};
                  const key = row.id || row._id;
                  return (
                    <tr key={key}>
                      <td style={{ textAlign: "center" }}>{row.supplierCode}</td>
                      <td>{row.supplierName}</td>
                      <td style={{ textAlign: "center" }}>{row.categoryType || row.supplierPurchaseType || "—"}</td>
                      <td style={{ textAlign: "center" }}>{primaryAddress.city || "—"}</td>
                      <td style={{ textAlign: "center" }}>{primaryAddress.pinCode || "—"}</td>
                      <td style={{ textAlign: "center" }}><input type="radio" name="item-supplier-choice" checked={String(selectedId) === String(key)} onChange={() => setSelectedId(String(key))} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sc-modal-footer">
          <button type="button" onClick={onClose} className="sc-input" style={{ width: "7vw", minWidth: 90, cursor: "pointer", justifyContent: "center" }}>Cancel</button>
          <button type="button" className="sc-input" disabled={!selectedRow} style={{ width: "9vw", minWidth: 120, cursor: selectedRow ? "pointer" : "not-allowed", justifyContent: "center", background: "var(--brand-primary)", color: "#fff", borderColor: "var(--brand-primary)", opacity: selectedRow ? 1 : 0.55 }} onClick={() => selectedRow && onApply?.(selectedRow)}>Save & Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
