import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";

const INITIAL = { enabled: false, primaryUnit: "", secondaryUnit: "", conversionFactor: 1 };

export default function ItemDualUnitModal({ open, value, defaultPrimaryUnit = "", uomOptions = [], onClose, onSave }) {
  const [state, setState] = useState(INITIAL);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setState({ ...INITIAL, ...(value || {}), primaryUnit: value?.primaryUnit || defaultPrimaryUnit || "" });
  }, [open, value, defaultPrimaryUnit]);

  if (!open) return null;
  const valid = !state.enabled || (state.primaryUnit && state.secondaryUnit && Number(state.conversionFactor) > 0);

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", minWidth: "650px", maxWidth: "920px" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Dual Unit Set-up</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body">
          <div className="sc-field-grid sc-field-grid--2col">
            <div className="sc-field">
              <label className="sc-label">Primary Unit (U1)</label>
              <select className="sc-select" value={state.primaryUnit} onChange={(e) => setState((p) => ({ ...p, primaryUnit: e.target.value }))}>
                <option value="">Select Primary Unit</option>
                {uomOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="sc-field">
              <label className="sc-label">Secondary Unit (U2)</label>
              <select className="sc-select" value={state.secondaryUnit} onChange={(e) => setState((p) => ({ ...p, secondaryUnit: e.target.value }))}>
                <option value="">Select Secondary Unit</option>
                {uomOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="sc-field-grid sc-field-grid--2col" style={{ marginTop: "1.2vh" }}>
            <div className="sc-field">
              <label className="sc-label">U1 Quantity</label>
              <input className="sc-input" value={1} readOnly />
            </div>
            <div className="sc-field">
              <label className="sc-label">U2 Quantity</label>
              <input className="sc-input" value={state.conversionFactor} onChange={(e) => setState((p) => ({ ...p, conversionFactor: e.target.value }))} />
            </div>
          </div>
          <label className="sc-checkbox" style={{ marginTop: "1.2vh", display: "inline-flex", alignItems: "center", gap: "0.5vw" }}>
            <input type="checkbox" checked={Boolean(state.enabled)} onChange={(e) => setState((p) => ({ ...p, enabled: e.target.checked }))} />
            Enable Dual Unit Conversion
          </label>
        </div>
        <div className="sc-modal-footer">
          <button type="button" className="sc-input" style={{ width: "7vw", minWidth: 90, cursor: "pointer", justifyContent: "center" }} onClick={onClose}>Cancel</button>
          <button type="button" className="sc-input sc-modal-btn-primary" disabled={!valid} style={{ width: "9vw", minWidth: 120, opacity: valid ? 1 : 0.55 }} onClick={() => valid && onSave?.({ enabled: Boolean(state.enabled), primaryUnit: state.primaryUnit, secondaryUnit: state.enabled ? state.secondaryUnit : "", conversionFactor: state.enabled ? Number(state.conversionFactor || 1) : 1 })}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
