import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useToast } from "../../hooks/useToast.js";
import {
  calculateInventoryLevels,
  EMPTY_INVENTORY_LEVEL_INPUT,
  inventoryInputFromRow,
} from "../../utils/inventoryLevelCalculations.js";
import {
  previewItemInventoryLevelsRequest,
  saveItemInventoryLevelsRequest,
} from "../../services/api.js";
import styles from "./ItemInventoryLevelsModal.module.css";

function FieldRow({ label, required, unit, unitClass, value, onChange, readOnly, output }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.78rem", color: "#334155" }}>
        {label}
        {required ? <span className={styles.req}> *</span> : null}
      </label>
      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
        <input
          className={`${styles.inlInput}${output ? ` ${styles.inlOutput}` : ""}`}
          value={value ?? ""}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          inputMode="decimal"
        />
        {unit ? (
          <span className={`${styles.inlUnit}${unitClass ? ` ${unitClass}` : ""}`}>{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function ItemInventoryLevelsModal({ open, row, uom = "KGS", onClose, onSaved }) {
  const toast = useToast();
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [input, setInput] = useState(EMPTY_INVENTORY_LEVEL_INPUT);
  const [output, setOutput] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setInput(inventoryInputFromRow(row));
    const inv = row.inventoryLevels || {};
    if (row.hasSlData) {
      setOutput({
        adc: inv.adc,
        roq: inv.roq,
        safetyStock: inv.safetyStock,
        rol: inv.rol,
        minLevel: inv.minLevel,
        maxLevel: inv.maxLevel,
      });
    } else {
      setOutput(null);
    }
  }, [open, row]);

  const unit = uom || row?.uom || "KGS";

  const recalc = useCallback(
    async (nextInput) => {
      const payload = {
        avgMonthlyConsumption: nextInput.avgMonthlyConsumption,
        workingDaysPerMonth: nextInput.workingDaysPerMonth,
        procurementLeadTimeDays: nextInput.procurementLeadTimeDays,
        procurementPeriodDays: nextInput.procurementPeriodDays,
        procurementFrequency: nextInput.procurementFrequency,
        safetyStockPeriodDays: nextInput.safetyStockPeriodDays,
      };
      const required = [
        payload.avgMonthlyConsumption,
        payload.workingDaysPerMonth,
        payload.procurementFrequency,
      ];
      if (required.some((v) => v === "" || v === undefined)) {
        setOutput(null);
        return;
      }
      try {
        const local = calculateInventoryLevels(payload);
        if (local.error) {
          setOutput(null);
          return;
        }
        setOutput(local);
        const res = await previewItemInventoryLevelsRequest(payload);
        if (res?.data) setOutput(res.data);
      } catch {
        const local = calculateInventoryLevels(payload);
        if (!local.error) setOutput(local);
      }
    },
    []
  );

  const setField = (key, value) => {
    const next = { ...input, [key]: value };
    setInput(next);
    recalc(next);
  };

  const handleReset = () => {
    setInput(EMPTY_INVENTORY_LEVEL_INPUT);
    setOutput(null);
  };

  const handleSave = async () => {
    if (!row?.id) return;
    setSaving(true);
    try {
      const payload = {
        avgMonthlyConsumption: input.avgMonthlyConsumption,
        workingDaysPerMonth: input.workingDaysPerMonth,
        procurementLeadTimeDays: input.procurementLeadTimeDays,
        procurementPeriodDays: input.procurementPeriodDays,
        procurementFrequency: input.procurementFrequency,
        safetyStockPeriodDays: input.safetyStockPeriodDays || 0,
      };
      const res = await saveItemInventoryLevelsRequest(row.id, payload);
      toast.success("Inventory levels saved.");
      onSaved?.(res?.data);
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Failed to save inventory levels");
    } finally {
      setSaving(false);
    }
  };

  const outputValues = useMemo(() => output || {}, [output]);

  if (!open || !row) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose?.()}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "min(92vw, 920px)", maxWidth: "920px" }}
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">Material Inventory Levels — {row.itemNo}</span>
          <button
            type="button"
            className="sc-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body">
          <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.85rem" }}>
            {row.itemName}
            {row.itemDescription ? ` — ${row.itemDescription}` : ""}
          </p>
          <div className={styles.inlGrid}>
            <div className={styles.inlPanel}>
              <div className={styles.inlPanelHead}>Input Data</div>
              <div className={styles.inlPanelBody}>
                <FieldRow
                  label="Average Monthly Consumption"
                  required
                  unit={unit}
                  value={input.avgMonthlyConsumption}
                  onChange={(v) => setField("avgMonthlyConsumption", v)}
                />
                <FieldRow
                  label="Working Days in a month"
                  required
                  unit="Days"
                  value={input.workingDaysPerMonth}
                  onChange={(v) => setField("workingDaysPerMonth", v)}
                />
                <FieldRow
                  label="Procurement Lead Time"
                  required
                  unit="Days"
                  value={input.procurementLeadTimeDays}
                  onChange={(v) => setField("procurementLeadTimeDays", v)}
                />
                <FieldRow
                  label="Procurement Period"
                  required
                  unit="Days"
                  value={input.procurementPeriodDays}
                  onChange={(v) => setField("procurementPeriodDays", v)}
                />
                <FieldRow
                  label="Procurement Frequency"
                  required
                  unit="NOS"
                  value={input.procurementFrequency}
                  onChange={(v) => setField("procurementFrequency", v)}
                />
                <FieldRow
                  label="Safety Stock Period"
                  unit="Days"
                  value={input.safetyStockPeriodDays}
                  onChange={(v) => setField("safetyStockPeriodDays", v)}
                />
              </div>
            </div>

            <div className={styles.inlArrow} aria-hidden>
              →
            </div>

            <div className={styles.inlPanel}>
              <div className={styles.inlPanelHead}>Min-Max &amp; Reorder Levels</div>
              <div className={styles.inlPanelBody}>
                <FieldRow
                  label="Average Daily Consumption (ADC)"
                  required
                  unit={unit}
                  value={outputValues.adc ?? ""}
                  readOnly
                  output
                />
                <FieldRow
                  label="Reorder Quantity (ROQ)"
                  required
                  unit={unit}
                  value={outputValues.roq ?? ""}
                  readOnly
                  output
                />
                <FieldRow
                  label="Safety Stock"
                  unit={unit}
                  value={outputValues.safetyStock ?? ""}
                  readOnly
                  output
                />
                <FieldRow
                  label="Reorder Level (ROL)"
                  required
                  unit={unit}
                  unitClass={styles.inlUnitOrange}
                  value={outputValues.rol ?? ""}
                  readOnly
                  output
                />
                <FieldRow
                  label="Min Level (Min)"
                  required
                  unit={unit}
                  unitClass={styles.inlUnitPink}
                  value={outputValues.minLevel ?? ""}
                  readOnly
                  output
                />
                <FieldRow
                  label="Max Level (Max)"
                  required
                  unit={unit}
                  value={outputValues.maxLevel ?? ""}
                  readOnly
                  output
                />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.inlFooter}>
          <button type="button" className={styles.inlBtnGhost} onClick={handleReset} disabled={saving}>
            Reset
          </button>
          <button
            type="button"
            className={styles.inlBtnPrimary}
            onClick={handleSave}
            disabled={saving || !output}
          >
            {saving ? "Saving…" : "Save & Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
