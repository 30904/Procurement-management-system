/**
 * Returns true if `query` matches any primitive or nested value in a table row
 * (objects/arrays are walked recursively; useful for API rows with nested fields).
 */
export function rowMatchesSearch(row, query) {
  if (row == null) return false;
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return true;

  function match(value) {
    if (value == null) return false;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") {
      return String(value).toLowerCase().includes(q);
    }
    if (value instanceof Date) {
      return value.toString().toLowerCase().includes(q);
    }
    if (Array.isArray(value)) {
      return value.some((item) => match(item));
    }
    if (t === "object") {
      return Object.keys(value).some((k) => {
        if (k === "__proto__") return false;
        return match(value[k]);
      });
    }
    return false;
  }

  return match(row);
}
