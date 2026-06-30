import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";

function isRequired(def) {
  return def.mandatoryRule === "always" || def.mandatoryRule === "by_item_category";
}

export default function ItemAttributeField({ def, value, onChange }) {
  const code = def.code;
  const opts = def.resolvedOptions || def.options?.map((o) => ({ value: o, label: o })) || [];
  const required = isRequired(def);
  const unitSuffix = def.unit ? String(def.unit).trim() : "";

  if (def.dataType === "boolean") {
    return (
      <SelectField
        label={def.label}
        required={required}
        options={[
          { value: "false", label: "No" },
          { value: "true", label: "Yes" },
        ]}
        value={value === true || value === "true" ? "true" : "false"}
        onChange={(v) => onChange(code, v === "true")}
      />
    );
  }
  if (def.dataType === "dropdown") {
    return (
      <SelectField
        label={def.label}
        required={required}
        options={opts}
        value={value ?? ""}
        onChange={(v) => onChange(code, v)}
      />
    );
  }
  if (def.dataType === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="sc-field">
        <label className={`sc-label${required ? " sc-label-required" : ""}`}>{def.label}</label>
        <select
          className="sc-select"
          multiple
          value={selected}
          onChange={(e) => {
            const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange(code, vals);
          }}
          style={{ minHeight: "6vh" }}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (def.dataType === "date") {
    return (
      <InputField
        label={def.label}
        required={required}
        value={value ?? ""}
        onChange={(v) => onChange(code, v)}
        type="date"
      />
    );
  }
  if (def.dataType === "number" || def.dataType === "decimal") {
    const displayValue = value === null || value === undefined ? "" : String(value);
    return (
      <InputField
        label={def.label}
        required={required}
        suffix={unitSuffix || undefined}
        value={displayValue}
        onChange={(v) => onChange(code, v === "" ? "" : Number(v))}
        type="number"
        step={def.dataType === "decimal" ? "0.01" : "any"}
        placeholder="Enter"
      />
    );
  }
  return (
    <InputField
      label={def.label}
      required={required}
      suffix={unitSuffix || undefined}
      value={value ?? ""}
      onChange={(v) => onChange(code, v)}
      placeholder={`Enter ${def.label.toLowerCase()}`}
    />
  );
}
