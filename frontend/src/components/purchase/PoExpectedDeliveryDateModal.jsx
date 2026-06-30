import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import DateField from "../subcomponents/DateField.jsx";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import {
  buildDefaultEddSchedules,
  primaryEddFromSchedules,
} from "../../utils/purchaseOrderFormState.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextDate(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return toIsoDate(d);
}

function detectBaseDate(line, schedules = []) {
  const firstScheduleDate = schedules.find((r) => r?.deliveryDate)?.deliveryDate;
  const candidate = firstScheduleDate || line?.edd;
  if (candidate) {
    const d = new Date(candidate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function splitQtyAcrossSchedules(poQtyRaw, count) {
  const poQty = Number(poQtyRaw);
  if (!Number.isFinite(poQty) || poQty <= 0) return Array(count).fill("");
  const precision = Number.isInteger(poQty) ? 0 : 2;
  const factor = 10 ** precision;
  const scaledTotal = Math.round(poQty * factor);
  const scaledBase = Math.floor(scaledTotal / count);
  const result = new Array(count).fill(scaledBase);
  const remainder = scaledTotal - scaledBase * count;
  if (remainder > 0) {
    result[count - 1] += remainder;
  }
  return result.map((n) => String(n / factor));
}

function buildIntelligentSchedules({ line, poQty, delCount, existingSchedules = [] }) {
  const count = Math.max(1, Math.min(99, Number(delCount) || 1));
  const baseDate = detectBaseDate(line, existingSchedules);
  const qtyDistribution = splitQtyAcrossSchedules(poQty, count);
  const fallbackUom = line?.uom ?? "";
  return Array.from({ length: count }, (_, i) => {
    const prev = existingSchedules[i];
    return {
      scheduleNo: i + 1,
      qty: qtyDistribution[i],
      uom: prev?.uom || fallbackUom,
      deliveryDate: prev?.deliveryDate || nextDate(baseDate, i * 7),
    };
  });
}

export default function PoExpectedDeliveryDateModal({ open, line, onClose, onSave }) {
  const [delCount, setDelCount] = useState("1");
  const [schedules, setSchedules] = useState([]);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const poQty = useMemo(() => {
    const q = Number(line?.qty);
    return Number.isFinite(q) ? String(q) : "";
  }, [line?.qty]);

  useEffect(() => {
    if (!open || !line) return;
    const count = Math.max(1, Number(line.eddDelCount) || 1);
    const savedRows =
      Array.isArray(line.eddSchedules) && line.eddSchedules.length
        ? line.eddSchedules.map((r, i) => ({ ...r, scheduleNo: i + 1 }))
        : buildDefaultEddSchedules(line, count);
    const rows = buildIntelligentSchedules({
      line,
      poQty: line.qty,
      delCount: count,
      existingSchedules: savedRows,
    });
    setDelCount(String(count));
    setSchedules(rows);
  }, [open, line]);

  if (!open || !line) return null;

  const handleDelCountChange = (value) => {
    const nextCount = Math.max(1, Math.min(99, Number(value) || 1));
    setDelCount(String(nextCount));
    setSchedules((prev) =>
      buildIntelligentSchedules({
        line,
        poQty,
        delCount: nextCount,
        existingSchedules: prev,
      })
    );
  };

  const updateSchedule = (index, patch) => {
    setSchedules((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSave = () => {
    const scheduleQtyTotal = schedules.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
    const poQtyNum = Number(poQty);
    if (poQtyNum > 0 && scheduleQtyTotal > 0 && Math.abs(scheduleQtyTotal - poQtyNum) > 0.001) {
      // Allow save but parent can validate; keep UX simple
    }
    onSave?.({
      eddDelCount: Number(delCount) || schedules.length,
      eddSchedules: schedules,
      edd: primaryEddFromSchedules(schedules),
    });
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "44vw", minWidth: 480, maxWidth: 620 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Expected Delivery Date</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
          <div className={styles.arrowRow}>
            <span className={styles.arrowLabel}>PO Quantity</span>
            <span className={styles.arrow}>→</span>
            <input className="sc-input" value={poQty} readOnly tabIndex={-1} />
          </div>
          <div className={styles.arrowRow}>
            <span className={styles.arrowLabel}>Del. Count</span>
            <span className={styles.arrow}>→</span>
            <input
              type="number"
              min={1}
              max={99}
              className="sc-input"
              value={delCount}
              onChange={(e) => handleDelCountChange(e.target.value)}
            />
          </div>

          <div className="im-table-scroll">
            <table className={`im-table im-table--master ${styles.scheduleTable}`}>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>Schedule</th>
                  <th style={{ width: "22%" }}>Quantity</th>
                  <th style={{ width: "14%" }}>UoM</th>
                  <th>Delivery Date</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((row, index) => (
                  <tr key={row.scheduleNo ?? index}>
                    <td style={{ textAlign: "center" }}>{row.scheduleNo ?? index + 1}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="sc-input"
                        value={row.qty}
                        onChange={(e) => updateSchedule(index, { qty: e.target.value })}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>{row.uom || line.uom}</td>
                    <td>
                      <DateField
                        type="date"
                        value={row.deliveryDate}
                        onChange={(v) => updateSchedule(index, { deliveryDate: v })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ModalFooterActions onCancel={onClose} onSave={handleSave} />
      </div>
    </div>,
    document.body
  );
}
