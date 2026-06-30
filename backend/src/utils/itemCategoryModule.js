import { MasterData } from "../models/MasterData.model.js";

const ITEM_CATEGORY = "Item Category";

/**
 * Resolve auto-increment module key from Item Category master data.
 * Accepts either category value (module code) or label.
 */
export async function resolveItemCategoryModule(companyId, categoryType) {
  const key = String(categoryType ?? "").trim();
  if (!key) return null;

  const row = await MasterData.findOne({
    company: companyId,
    category: ITEM_CATEGORY,
    status: "Active",
    $or: [{ value: key }, { label: key }, { value: key.toUpperCase() }],
  })
    .select("value")
    .lean();

  if (!row) return key.toUpperCase();
  return String(row.value ?? "").trim().toUpperCase() || key.toUpperCase();
}
