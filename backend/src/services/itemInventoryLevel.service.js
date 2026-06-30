import { ItemMaster } from "../models/ItemMaster.model.js";
import { AppError } from "../utils/AppError.js";
import {
  calculateInventoryLevels,
  hasInventoryLevelData,
} from "../utils/inventoryLevelCalculations.js";

function mapListRow(doc) {
  const inv = doc.inventoryLevels || {};
  const hasSl = hasInventoryLevelData(doc);
  return {
    id: String(doc._id),
    _id: String(doc._id),
    itemNo: doc.itemNo ?? "",
    itemName: doc.itemName ?? "",
    itemDescription: doc.itemDescription ?? "",
    uom: doc.uom ?? "",
    itemCategory: doc.itemCategory ?? "",
    status: doc.status ?? "Active",
    dualUnit: doc.dualUnit ?? { enabled: false },
    roq: hasSl ? inv.roq : null,
    rol: hasSl ? inv.rol : null,
    minLevel: hasSl ? inv.minLevel : null,
    maxLevel: hasSl ? inv.maxLevel : null,
    hasSlData: hasSl,
    slStatus: hasSl ? "configured" : "missing",
    inventoryLevels: inv,
  };
}

function buildItemFilter(companyId, query = {}) {
  const filter = { company: companyId, status: "Active" };
  const slFilter = String(query.slFilter || "all").toLowerCase();
  const category = String(query.category || "").trim();
  if (category) filter.itemCategory = category;
  return { filter, slFilter };
}

/** Same scope as Item Master summary — all company items, not location-scoped. */
export async function listItemInventoryLevels(companyId, query = {}) {
  const { filter, slFilter } = buildItemFilter(companyId, query);
  const docs = await ItemMaster.find(filter).sort({ itemNo: 1 }).lean();
  let rows = docs.map(mapListRow);
  if (slFilter === "with") rows = rows.filter((r) => r.hasSlData);
  if (slFilter === "without") rows = rows.filter((r) => !r.hasSlData);
  return rows;
}

export async function getItemInventoryLevelStatusSummary(companyId) {
  const docs = await ItemMaster.find({ company: companyId, status: "Active" })
    .select("inventoryLevels status")
    .lean();
  const activeItemsCount = docs.length;
  let withSlData = 0;
  for (const doc of docs) {
    if (hasInventoryLevelData(doc)) withSlData += 1;
  }
  const totalItems = docs.length;
  return {
    activeItemsCount,
    totalItems,
    withSlData,
    withoutSlData: totalItems - withSlData,
  };
}

export async function getItemInventoryLevelById(companyId, itemId) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!doc) throw new AppError("Item not found", 404, "NOT_FOUND");
  return mapListRow(doc);
}

export function previewItemInventoryLevels(payload) {
  try {
    return calculateInventoryLevels(payload);
  } catch (err) {
    throw new AppError(err.message || "Invalid input", 400, "VALIDATION_ERROR");
  }
}

export async function saveItemInventoryLevels(companyId, itemId, payload, actor) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId });
  if (!doc) throw new AppError("Item not found", 404, "NOT_FOUND");

  const calculated = calculateInventoryLevels(payload);
  doc.inventoryLevels = {
    ...calculated,
    configured: true,
    updatedAt: new Date(),
  };
  doc.reorderLevel = calculated.rol;
  doc.updatedBy = actor?.userId || doc.updatedBy;
  await doc.save();
  return mapListRow(doc.toObject());
}

export async function updateItemDualUnit(companyId, itemId, dualUnitPayload) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId });
  if (!doc) throw new AppError("Item not found", 404, "NOT_FOUND");

  const enabled = Boolean(dualUnitPayload?.enabled);
  doc.dualUnit = {
    enabled,
    primaryUnit: String(dualUnitPayload?.primaryUnit ?? doc.uom ?? "").trim(),
    secondaryUnit: enabled ? String(dualUnitPayload?.secondaryUnit ?? "").trim() : "",
    conversionFactor: enabled ? Number(dualUnitPayload?.conversionFactor ?? 1) : 1,
  };
  if (enabled && (!doc.dualUnit.primaryUnit || !doc.dualUnit.secondaryUnit)) {
    throw new AppError("Primary and secondary units are required for dual unit", 400, "VALIDATION_ERROR");
  }
  await doc.save();
  return mapListRow(doc.toObject());
}
