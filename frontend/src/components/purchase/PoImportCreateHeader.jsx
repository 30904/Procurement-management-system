import { Search, UserCircle2 } from "lucide-react";
import DateField from "../subcomponents/DateField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import styles from "./PoImportCreateHeader.module.css";

export default function PoImportCreateHeader({
  poNo,
  poNoLoading,
  poDate,
  onPoDateChange,
  supplierName,
  onSelectSupplier,
  isEditMode = false,
  poTypeOptions = [],
  poType,
  onPoTypeChange,
  poTypeLoading,
  validationErrors = {},
}) {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <h2>{isEditMode ? "Edit import purchase order" : "New import purchase order"}</h2>
          <p>Foreign currency · landed cost · INCOTerms on supplier master</p>
        </div>
        <button
          type="button"
          className={styles.supplierBtn}
          onClick={onSelectSupplier}
          disabled={isEditMode}
        >
          <UserCircle2 size={18} />
          {supplierName || "Choose import supplier"}
          {!isEditMode ? <Search size={16} style={{ opacity: 0.8 }} /> : null}
        </button>
      </div>

      <div className={styles.fieldsGrid}>
        <div className={styles.fieldMini}>
          <label>PO number</label>
          <input
            type="text"
            readOnly
            value={poNoLoading ? "Loading…" : poNo}
            style={{
              width: "100%",
              padding: "0.5rem 0.65rem",
              borderRadius: 0,
              border: "none",
              fontWeight: 600,
            }}
          />
        </div>
        <div className={styles.fieldMini}>
          <DateField label="PO date" type="date" required value={poDate} onChange={onPoDateChange} />
          {validationErrors.poDate ? (
            <div className={styles.fieldError}>{validationErrors.poDate}</div>
          ) : null}
        </div>
        <div className={styles.fieldMini}>
          <SelectField
            label="PO type"
            required
            options={poTypeOptions}
            value={poType}
            onChange={onPoTypeChange}
            disabled={poTypeLoading}
          />
        </div>
      </div>
    </header>
  );
}
