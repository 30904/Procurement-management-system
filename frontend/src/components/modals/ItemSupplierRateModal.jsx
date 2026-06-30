import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MinusCircle, PlusCircle } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

function normalizeRows(rows = [], fallbackUom = "") {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ moq: 1, uom: fallbackUom || "", rate: 0 }];
  }
  return rows.map((r) => ({
    moq: Number(r?.moq ?? 1),
    uom: String(r?.uom ?? fallbackUom ?? "").trim(),
    rate: Number(r?.rate ?? 0),
  }));
}

export default function ItemSupplierRateModal({ open, value = [], defaultUom = "", uomOptions = [], onClose, onSave }) {
  const [rows, setRows] = useState([{ moq: 1, uom: "", rate: 0 }]);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setRows(normalizeRows(value, defaultUom));
  }, [open, value, defaultUom]);

  if (!open) return null;

  const canSave = rows.length > 0 && rows.every((r) => r.uom && Number(r.moq) >= 0 && Number(r.rate) >= 0);
  const setRow = (idx, key, next) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: next } : r)));

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "56vw", minWidth: "700px", maxWidth: "960px", maxHeight: "80vh" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Purchase Rate/Unit</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body">
          <table className="im-table im-table--master">
            <thead><tr><th style={{ width: "26%" }}>MOQ *</th><th style={{ width: "30%" }}>UoM *</th><th style={{ width: "34%" }}>Rate/Unit *</th><th style={{ width: "10%" }}>Act</th></tr></thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`rate-${idx}`}>
                  <td><input className="sc-input" type="number" min="0" value={row.moq} onChange={(e) => setRow(idx, "moq", e.target.value)} /></td>
                  <td>
                    <select className="sc-select" value={row.uom} onChange={(e) => setRow(idx, "uom", e.target.value)}>
                      <option value="">Select UoM</option>
                      {uomOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </td>
                  <td><input className="sc-input" type="number" min="0" step="0.01" value={row.rate} onChange={(e) => setRow(idx, "rate", e.target.value)} /></td>
                  <td style={{ textAlign: "center" }}>
                    {rows.length > 1 && <button type="button" className="im-action-dots" onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}><MinusCircle size={16} color="#0c84b5" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1vh" }}>
            <button type="button" className="im-action-dots" onClick={() => setRows((p) => [...p, { moq: 1, uom: defaultUom || "", rate: 0 }])}><PlusCircle size={17} color="#0c84b5" /></button>
          </div>
        </div>
        <div className="sc-modal-footer">
          <button type="button" onClick={onClose} className="sc-input" style={{ width: "7vw", minWidth: 90, cursor: "pointer", justifyContent: "center" }}>Cancel</button>
          <button type="button" className="sc-input" disabled={!canSave} style={{ width: "9vw", minWidth: 120, cursor: canSave ? "pointer" : "not-allowed", justifyContent: "center", background: "var(--brand-primary)", color: "#fff", borderColor: "var(--brand-primary)", opacity: canSave ? 1 : 0.55 }} onClick={() => canSave && onSave?.(rows.map((r) => ({ moq: Number(r.moq), uom: r.uom, rate: Number(r.rate) })))}>Save & Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
