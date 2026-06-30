import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

function normalizeLocation(row) {
  const id = row._id != null ? String(row._id) : String(row.id);
  return {
    ...row,
    id,
    locationId: row.locationId ?? row.locationCode ?? "",
    name: row.name ?? "",
    addressLine1: row.addressLine1 ?? "",
    addressLine2: row.addressLine2 ?? "",
    country: row.country ?? "India",
    state: row.state ?? "",
    cityDistrict: row.cityDistrict ?? "",
    pinCode: row.pinCode ?? "",
    isActive: row.isActive !== false && String(row.status ?? "Active") === "Active",
  };
}

export default function PoShipToLocationLookupModal({
  open,
  locationRows = [],
  selectedLocationId = "",
  onClose,
  onApply,
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedId(selectedLocationId || "");
    setPage(1);
  }, [open, selectedLocationId]);

  const activeRows = useMemo(
    () => locationRows.map(normalizeLocation).filter((row) => row.isActive),
    [locationRows]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter((row) =>
      [
        row.locationId,
        row.name,
        row.addressLine1,
        row.addressLine2,
        row.cityDistrict,
        row.state,
        row.pinCode,
      ].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [activeRows, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!open) return null;

  const selectedRow = activeRows.find((row) => String(row.id) === String(selectedId)) || null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "78vw", minWidth: 820, maxWidth: 1180, maxHeight: "82vh" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Select Ship To Location</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.2vh" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1vw" }}>
            <div className="sc-modal-search" style={{ maxWidth: "28vw", flex: 1 }}>
              <Search className="sc-modal-search__icon" size={18} />
              <input
                type="text"
                className="sc-modal-search__input"
                placeholder="Search plant location..."
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
                style={{ width: 32, height: 32, padding: 0, cursor: page <= 1 ? "not-allowed" : "pointer" }}
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
                style={{ width: 32, height: 32, padding: 0, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
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
                  <th style={{ width: "11%" }}>Plant Location ID</th>
                  <th style={{ width: "16%" }}>Address Line 1</th>
                  <th style={{ width: "14%" }}>Address Line 2</th>
                  <th style={{ width: "8%" }}>Country</th>
                  <th style={{ width: "11%" }}>State/Province</th>
                  <th style={{ width: "11%" }}>City/District</th>
                  <th style={{ width: "8%" }}>PIN Code</th>
                  <th style={{ width: "7%" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr className="im-empty-row">
                    <td colSpan={8} className="im-empty-cell">
                      <span className="im-no-records__text">No locations found</span>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: "center" }}>{row.locationId}</td>
                      <td>{row.addressLine1 || "—"}</td>
                      <td>{row.addressLine2 || "—"}</td>
                      <td style={{ textAlign: "center" }}>{row.country || "—"}</td>
                      <td style={{ textAlign: "center" }}>{row.state || "—"}</td>
                      <td style={{ textAlign: "center" }}>{row.cityDistrict || "—"}</td>
                      <td style={{ textAlign: "center" }}>{row.pinCode || "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name="po-ship-to-location"
                          checked={String(selectedId) === String(row.id)}
                          onChange={() => setSelectedId(String(row.id))}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sc-modal-footer">
          <button type="button" onClick={onClose} className="sc-input" style={{ cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            className="sc-input"
            disabled={!selectedRow}
            style={{
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
