import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalSearchBar from "../common/ModalSearchBar.jsx";
import InputField from "../subcomponents/InputField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import modalStyles from "./SupplierChildModal.module.css";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

export default function LogisticsVehicleDetailsModal({ open, rows = [], onClose, onSave }) {
  const [vehicleNo, setVehicleNo] = useState("");
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  useEffect(() => {
    if (open) setItems(rows);
  }, [open, rows]);

  if (!open) return null;

  const filtered = items.filter((r) =>
    String(r.vehicleNo || "").toLowerCase().includes(query.trim().toLowerCase())
  );

  function addVehicle() {
    if (!vehicleNo.trim()) return;
    setItems((prev) => [...prev, { vehicleNo: vehicleNo.trim().toUpperCase() }]);
    setVehicleNo("");
  }

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", maxHeight: "78vh" }} role="dialog" aria-modal="true">
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Logistics Vehicle Details</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body" style={{ gap: "1.5vh" }}>
          <div className={modalStyles.addRow} style={{ gridTemplateColumns: "1fr auto" }}>
            <InputField label="Vehicle No." required value={vehicleNo} onChange={setVehicleNo} placeholder="Enter vehicle number" />
            <button type="button" className={modalStyles.btnAdd} onClick={addVehicle} aria-label="Add vehicle">+</button>
          </div>
          <p className={modalStyles.sectionLabel}>Vehicle List</p>
          <ModalSearchBar value={query} onChange={setQuery} placeholder="Search vehicle..." aria-label="Search vehicle details" />
          <table className="im-table im-table--master">
            <thead><tr><th>Vehicle No.</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={2} style={{ textAlign: "center", color: "#94a3b8" }}>No vehicles added</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.vehicleNo}-${i}`}>
                    <td>{r.vehicleNo}</td>
                    <td style={{ textAlign: "center" }}>
                      <button type="button" className={modalStyles.btnRemove} onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="sc-modal-footer">
          <button type="button" className={modalStyles.btnSaveClose} onClick={() => { onSave?.(items); onClose?.(); }}>Save & Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
