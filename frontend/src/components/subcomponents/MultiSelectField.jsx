import "../../styles/subcomponents.css";

export default function MultiSelectField({ label, required, options = [], value = [], onChange, disabled }) {
  function handleChange(e) {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    onChange?.(selected);
  }

  return (
    <div className="sc-field">
      <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>
      <select
        multiple
        className="sc-multiselect"
        value={value}
        onChange={handleChange}
        disabled={disabled}
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}
