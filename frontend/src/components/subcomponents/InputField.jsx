import "../../styles/subcomponents.css";

export default function InputField({
  label,
  hideLabel,
  required,
  placeholder,
  value,
  onChange,
  disabled,
  locked,
  suffix,
  "aria-label": ariaLabel,
  ...props
}) {
  const cls = ["sc-input", locked ? "sc-input--locked" : "", suffix ? "sc-input--with-suffix" : ""]
    .filter(Boolean)
    .join(" ");
  const noLabel = hideLabel || label == null || label === false;
  const inputAria = (typeof ariaLabel === "string" && ariaLabel) || (!noLabel && typeof label === "string" ? label : undefined);

  const inputEl = (
    <input
      type="text"
      className={cls}
      placeholder={placeholder || "Enter"}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      readOnly={locked}
      aria-label={inputAria}
      {...props}
    />
  );

  return (
    <div className={`sc-field${noLabel ? " sc-field--no-label" : ""}`}>
      {!noLabel && <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>}
      {suffix ? (
        <div className="sc-input-suffix-wrap">
          {inputEl}
          <span className="sc-input-suffix" aria-hidden="true">
            {suffix}
          </span>
        </div>
      ) : (
        inputEl
      )}
    </div>
  );
}
