import { MasterData } from "../models/MasterData.model.js";

const SUPPLIER_CATEGORY = "Supplier Category";

/**
 * Resolve auto-increment module key (e.g. DGM) from master data category selection.
 * Accepts master data value (DGM) or label (Domestic Goods Manufacturer).
 */
export async function resolveSupplierCategoryModule(companyId, categoryType) {
  const key = String(categoryType ?? "").trim();
  if (!key) return null;

  const row = await MasterData.findOne({
    company: companyId,
    category: SUPPLIER_CATEGORY,
    status: "Active",
    $or: [{ value: key }, { label: key }, { value: key.toUpperCase() }],
  })
    .select("value label")
    .lean();

  if (!row) return key.toUpperCase();

  const module = String(row.value ?? "").trim().toUpperCase();
  return module || key.toUpperCase();
}

export async function resolveSupplierCategoryLabel(companyId, categoryType) {
  const key = String(categoryType ?? "").trim();
  if (!key) return "";

  const row = await MasterData.findOne({
    company: companyId,
    category: SUPPLIER_CATEGORY,
    $or: [{ value: key }, { label: key }],
  })
    .select("label value")
    .lean();

  return row?.label?.trim() || key;
}
