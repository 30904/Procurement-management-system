import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { computeExcessThreshold } from "../../utils/purchaseOrderFormState.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

export default function PoExcessQuantityThresholdModal({ open, line, onClose, onSave }) {
  const [percent, setPercent] = useState("");
  const [threshold, setThreshold] = useState("");
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const poQty = useMemo(() => {
    const q = Number(line?.qty);
    return Number.isFinite(q) ? String(q) : "";
  }, [line?.qty]);

  useEffect(() => {
    if (!open || !line) return;
    setPercent(line.eqtPercent != null && line.eqtPercent !== "" ? String(line.eqtPercent) : "");
    setThreshold(line.eqt != null && line.eqt !== "" ? String(line.eqt) : "");
  }, [open, line]);

  useEffect(() => {
    if (!open) return;
    const computed = computeExcessThreshold(poQty, percent);
    if (computed !== "") setThreshold(computed);
  }, [open, poQty, percent]);

  if (!open || !line) return null;

  const handleSave = () => {
    onSave?.({
      eqtPercent: percent,
      eqt: threshold,
    });
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "36vw", minWidth: 420, maxWidth: 520 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Excess Quantity Threshold</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
          <div className={styles.arrowRow}>
            <span className={styles.arrowLabel}>Purchase Order Quantity</span>
            <span className={styles.arrow}>→</span>
            <input className="sc-input" value={poQty} readOnly tabIndex={-1} />
          </div>
          <div className={styles.arrowRow}>
            <span className={styles.arrowLabel}>Excess Quantity (%)</span>
            <span className={styles.arrow}>→</span>
            <div className={styles.percentField}>
              <input
                type="number"
                min={0}
                step="any"
                className="sc-input"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
              <span className={styles.percentSuffix}>%</span>
            </div>
          </div>
          <div className={styles.arrowRow}>
            <span className={styles.arrowLabel}>Excess Quantity Threshold</span>
            <span className={styles.arrow}>→</span>
            <input
              type="number"
              min={0}
              step="any"
              className="sc-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
        </div>
        <ModalFooterActions onCancel={onClose} onSave={handleSave} />
      </div>
    </div>,
    document.body
  );
}
