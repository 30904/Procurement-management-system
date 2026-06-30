/** Shared applicability and mandatory rules for item document types and attributes. */

export const MANDATORY_RULES = ["never", "always", "by_item_category"];

export function normalizeApplicableCategories(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((c) => String(c ?? "").trim()).filter(Boolean))];
}

export function isApplicable(record, itemCategory) {
  const cats = normalizeApplicableCategories(record?.applicableCategories);
  if (!cats.length) return true;
  const cat = String(itemCategory ?? "").trim();
  if (!cat) return false;
  return cats.includes(cat);
}

export function isMandatory(record, itemCategory) {
  const rule = String(record?.mandatoryRule ?? "never").trim();
  if (rule === "always") return true;
  if (rule === "by_item_category") return isApplicable(record, itemCategory);
  return false;
}

export function filterApplicable(records, itemCategory) {
  return (records || []).filter((r) => isApplicable(r, itemCategory));
}
