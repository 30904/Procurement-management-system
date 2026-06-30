import { MasterData } from "../models/MasterData.model.js";

const LOGISTICS_CATEGORY = "LSP Category";

export async function resolveLogisticsCategoryModule(companyId, categoryType) {
  const key = String(categoryType ?? "").trim();
  if (!key) return null;

  const row = await MasterData.findOne({
    company: companyId,
    category: LOGISTICS_CATEGORY,
    status: "Active",
    $or: [{ value: key }, { label: key }, { value: key.toUpperCase() }],
  })
    .select("value label")
    .lean();

  if (!row) return key.toUpperCase();

  const module = String(row.value ?? "").trim().toUpperCase();
  return module || key.toUpperCase();
}

export async function resolveLogisticsCategoryLabel(companyId, categoryType) {
  const key = String(categoryType ?? "").trim();
  if (!key) return "";

  const row = await MasterData.findOne({
    company: companyId,
    category: LOGISTICS_CATEGORY,
    $or: [{ value: key }, { label: key }],
  })
    .select("label value")
    .lean();

  return row?.label?.trim() || key;
}
