import "../../styles/subcomponents.css";

export default function InputDDField({ label, required, placeholder, value, onChange, disabled }) {
  return (
    <div className="sc-field">
      <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>
      <div className="sc-inputdd-wrap">
        <input
          type="text"
          className="sc-input"
          placeholder={placeholder || ""}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          style={{ paddingRight: "1.8vw" }}
        />
        <svg
          className="sc-inputdd-arrow"
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1l4 4 4-4" stroke="var(--brand-primary, #197dfa)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
