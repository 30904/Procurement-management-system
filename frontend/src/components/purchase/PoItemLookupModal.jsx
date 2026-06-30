import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { emptyPoLineFromItem } from "../../utils/purchaseOrderFormState.js";
import "../../styles/subcomponents.css";

export default function PoItemLookupModal({ open, itemRows = [], existingIds = [], onClose, onApply }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(new Set());
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = itemRows.filter((row) => !existingIds.includes(String(row._id || row.id)));
    if (!q) return available;
    return available.filter((row) =>
      [row.itemNo, row.itemName, row.itemDescription, row.uom].some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [itemRows, query, existingIds]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!open) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "72vw", minWidth: 760, maxWidth: 1100, maxHeight: "80vh" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Add Materials</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          <div className="sc-modal-search" style={{ maxWidth: "100%", marginBottom: "1vh" }}>
            <Search className="sc-modal-search__icon" size={18} />
            <input
              type="text"
              className="sc-modal-search__input"
              placeholder="Search material code or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th style={{ width: "12%" }}>Material Code</th>
                  <th style={{ width: "22%" }}>Material Name</th>
                  <th>Description</th>
                  <th style={{ width: "8%" }}>UoM</th>
                  <th style={{ width: "8%" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={5} className="im-empty-cell">
                      <span className="im-no-records__text">No materials found</span>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const id = String(row._id || row.id);
                    return (
                      <tr key={id}>
                        <td style={{ textAlign: "center" }}>{row.itemNo}</td>
                        <td>{row.itemName}</td>
                        <td>{row.itemDescription}</td>
                        <td style={{ textAlign: "center" }}>{row.uom}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => toggle(id)}
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
              disabled={!selected.size}
              onClick={() => {
                const picked = itemRows
                  .filter((r) => selected.has(String(r._id || r.id)))
                  .map((r) => emptyPoLineFromItem(r));
                onApply?.(picked);
              }}
            >
              Add Selected{selected.size ? ` (${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
