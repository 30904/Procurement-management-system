/** Sort master data rows: category, then order (sequence), then label. */
export function sortMasterDataRows(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort(
    (a, b) =>
      String(a.category ?? "").localeCompare(String(b.category ?? ""), undefined, {
        sensitivity: "base",
      }) ||
      (a.sequence ?? 0) - (b.sequence ?? 0) ||
      String(a.label ?? "").localeCompare(String(b.label ?? ""), undefined, {
        sensitivity: "base",
      })
  );
}

/**
 * Map Master Data API rows to SelectField options ({ value, label }).
 * Uses `value` when set, otherwise `label`. Only Active rows are included.
 */
export function masterDataRowsToOptions(rows) {
  if (!Array.isArray(rows)) return [];

  return sortMasterDataRows(rows)
    .filter((r) => r.status === "Active")
    .map((r) => {
      const label = String(r.label ?? "").trim();
      const value = String(r.value ?? label).trim();
      return { value, label: label || value };
    })
    .filter((o) => o.value && o.label);
}

/** Active master data rows as incidental expense line templates (description only). */
export function masterDataRowsToIncidentalTemplates(rows) {
  if (!Array.isArray(rows)) return [];

  return sortMasterDataRows(rows)
    .filter((r) => r.status === "Active")
    .map((r) => {
      const description = String(r.label ?? r.value ?? "").trim();
      return {
        description,
        amount: "",
        masterDataId: r._id != null ? String(r._id) : r.id != null ? String(r.id) : "",
      };
    })
    .filter((r) => r.description);
}

export function buildIncidentalExpenseRows(templates, existing = []) {
  const amountByKey = new Map();
  for (const row of existing || []) {
    const desc = String(row.description ?? "").trim().toLowerCase();
    if (desc) amountByKey.set(desc, row.amount ?? "");
    if (row.masterDataId) amountByKey.set(String(row.masterDataId), row.amount ?? "");
  }

  return (templates || []).map((row) => {
    const description = String(row.description ?? row.label ?? row.value ?? "").trim();
    const id = row.masterDataId || (row._id != null ? String(row._id) : row.id != null ? String(row.id) : "");
    const amount =
      (id && amountByKey.has(id) ? amountByKey.get(id) : amountByKey.get(description.toLowerCase())) ?? "";
    return { description, amount, masterDataId: id };
  });
}
