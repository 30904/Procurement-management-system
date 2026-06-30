import ItemAttributeField from "./ItemAttributeField.jsx";

export default function ItemAttributeFieldsGrid({ definitions = [], values = {}, onChange }) {
  if (!definitions.length) return null;
  return (
    <div className="sc-field-grid">
      {definitions.map((def) => (
        <ItemAttributeField key={def.code} def={def} value={values[def.code]} onChange={onChange} />
      ))}
    </div>
  );
}
