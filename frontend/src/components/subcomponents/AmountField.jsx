import "../../styles/subcomponents.css";

export default function AmountField({ label, required, placeholder, value, onChange, disabled }) {
  return (
    <div className="sc-field">
      <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>
      <input
        type="number"
        className="sc-input sc-input--amount"
        placeholder={placeholder || "0.00"}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        min="0"
        step="0.01"
      />
    </div>
  );
}
