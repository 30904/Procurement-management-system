import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { sumIncidental } from "../../utils/purchaseOrderFormState.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

function formatMoney(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PoIncidentalExpensesModal({ open, rows = [], currency = "INR", onClose, onSave }) {
  const [localRows, setLocalRows] = useState([]);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setLocalRows(rows.map((r) => ({ ...r })));
  }, [open, rows]);

  const total = useMemo(() => sumIncidental(localRows), [localRows]);

  if (!open) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", minWidth: 520, maxWidth: 720 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Incidental Expenses</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          {localRows.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
              No active incidental expenses configured. Add them under Settings → Data Management → Incidental Expenses.
            </p>
          ) : (
            <div className="im-table-scroll">
              <table className="im-table im-table--master">
                <thead>
                  <tr>
                    <th>Expense Description</th>
                    <th style={{ width: "12%" }}>Ccy</th>
                    <th style={{ width: "22%" }}>Expense Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {localRows.map((row, index) => (
                    <tr key={row.masterDataId || row.description || index}>
                      <td>{row.description}</td>
                      <td style={{ textAlign: "center" }}>{currency}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className="sc-input"
                          value={row.amount}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLocalRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, amount: v } : r))
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>Total Incidental Expenses</span>
            <span className={styles.totalArrow}>→</span>
            <span className={styles.totalValue}>
              {currency} {formatMoney(total)}
            </span>
          </div>
        </div>
        <ModalFooterActions onCancel={onClose} onSave={() => onSave?.(localRows)} />
      </div>
    </div>,
    document.body
  );
}
