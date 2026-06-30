import { ItemMaster } from "../models/ItemMaster.model.js";
import { HsnPMaster } from "../models/HsnPMaster.model.js";
import { AppError } from "../utils/AppError.js";
import { allocateNextCode } from "./autoIncrement.service.js";
import { resolveItemCategoryModule } from "../utils/itemCategoryModule.js";
import { applyLocationFilter } from "../utils/locationScope.js";
import { resolveItemInventoryFields } from "../utils/resolveMasterLocationFields.js";
import {
  normalizeItemGovernance,
  normalizeItemProcurementInfo,
} from "../utils/mpbcdcMasterFields.js";

function parseRate(value, fieldName) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 0 || n > 100) {
    throw new AppError(`${fieldName} must be between 0 and 100`, 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 100) / 100;
}

function parseRevisionInfo(revisionInfo, actor) {
  const reason = String(revisionInfo?.reason ?? "").trim();
  const proposedBy = String(revisionInfo?.proposedBy ?? "").trim();
  const approvedBy = String(revisionInfo?.approvedBy ?? "").trim();
  if (!reason || !proposedBy || !approvedBy) {
    throw new AppError("Revision details are required", 400, "VALIDATION_ERROR");
  }
  const revisionDate = revisionInfo?.revisionDate ? new Date(revisionInfo.revisionDate) : new Date();
  if (Number.isNaN(revisionDate.getTime())) {
    throw new AppError("Invalid revision date", 400, "VALIDATION_ERROR");
  }
  return {
    reason,
    proposedBy,
    approvedBy,
    revisionDate,
    changedBy: {
      userId: actor?.userId || undefined,
      name: String(actor?.name ?? "").trim(),
      userName: String(actor?.userName ?? "").trim(),
      userEmail: String(actor?.userEmail ?? "").trim(),
    },
  };
}

async function resolveHsnRate(companyId, hsnCode) {
  const code = String(hsnCode ?? "").trim();
  if (!code) throw new AppError("HSN Code is required", 400, "VALIDATION_ERROR");
  const hsn = await HsnPMaster.findOne({ company: companyId, hsnCode: code }).lean();
  if (!hsn) throw new AppError(`Invalid HSN Code "${code}"`, 400, "VALIDATION_ERROR");
  return { hsnCode: code, gstRate: parseRate(hsn.gstRate ?? 0, "GST Rate") };
}

function parseReorderLevel(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) {
    throw new AppError("Reorder level must be zero or greater", 400, "VALIDATION_ERROR");
  }
  return Math.round(n * 1000) / 1000;
}

function normalizeDualUnit(input = {}, fallbackUom = "") {
  const enabled = Boolean(input?.enabled);
  const primaryUnit = String(input?.primaryUnit ?? fallbackUom ?? "").trim();
  const secondaryUnit = String(input?.secondaryUnit ?? "").trim();
  const conversionFactor = Number(input?.conversionFactor ?? 1);

  if (enabled) {
    if (!primaryUnit) throw new AppError("Primary unit is required for dual unit", 400, "VALIDATION_ERROR");
    if (!secondaryUnit) throw new AppError("Secondary unit is required for dual unit", 400, "VALIDATION_ERROR");
    if (Number.isNaN(conversionFactor) || conversionFactor <= 0) {
      throw new AppError("Dual unit conversion factor must be greater than 0", 400, "VALIDATION_ERROR");
    }
  }

  return {
    enabled,
    primaryUnit,
    secondaryUnit: enabled ? secondaryUnit : "",
    conversionFactor: enabled ? conversionFactor : 1,
  };
}

function normalizeNext(doc, data) {
  const itemName = String(data?.itemName ?? doc.itemName ?? "").trim();
  const itemDescription = String(data?.itemDescription ?? doc.itemDescription ?? "").trim();
  const itemCategory = String(data?.itemCategory ?? doc.itemCategory ?? "").trim();
  const uom = String(data?.uom ?? doc.uom ?? "").trim();
  const inventoryStore = String(data?.inventoryStore ?? doc.inventoryStore ?? "").trim();
  const status = data?.status === "Inactive" ? "Inactive" : "Active";

  if (!itemName || !itemDescription || !itemCategory || !uom || !inventoryStore) {
    throw new AppError("Material Category, Name, Description, UoM and Inventory Store are required", 400, "VALIDATION_ERROR");
  }

  const dualUnit = normalizeDualUnit(data?.dualUnit ?? doc.dualUnit, uom);
  const reorderLevel =
    data && Object.prototype.hasOwnProperty.call(data, "reorderLevel")
      ? parseReorderLevel(data.reorderLevel)
      : doc.reorderLevel;

  return {
    itemName,
    itemDescription,
    itemCategory,
    uom,
    inventoryStore,
    locationId: data?.locationId || doc.locationId || undefined,
    inventoryStoreId: data?.inventoryStoreId || doc.inventoryStoreId || undefined,
    status,
    dualUnit,
    reorderLevel,
  };
}

function buildChanges(prev, next) {
  const fields = [
    "itemName",
    "itemDescription",
    "uom",
    "hsnCode",
    "gstRate",
    "inventoryStore",
    "reorderLevel",
    "status",
  ];
  const changes = [];
  for (const field of fields) {
    if (String(prev[field] ?? "") !== String(next[field] ?? "")) {
      changes.push({ field, from: prev[field], to: next[field] });
    }
  }
  if (JSON.stringify(prev.dualUnit ?? {}) !== JSON.stringify(next.dualUnit ?? {})) {
    changes.push({ field: "dualUnit", from: prev.dualUnit ?? {}, to: next.dualUnit ?? {} });
  }
  return changes;
}

export async function listItemMasters(companyId) {
  return ItemMaster.find({ company: companyId }).sort({ itemNo: 1 }).lean();
}

export async function getItemMaster(companyId, id) {
  const doc = await ItemMaster.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Item record not found", 404, "NOT_FOUND");
  return doc;
}

export async function createItemMaster(companyId, data, actorId) {
  const storeFields = await resolveItemInventoryFields(companyId, data ?? {});
  const base = { ...normalizeNext({}, { ...data, ...storeFields }), ...storeFields };
  const categoryModule = await resolveItemCategoryModule(companyId, base.itemCategory);
  if (!categoryModule) throw new AppError("Material Category is required", 400, "VALIDATION_ERROR");
  const itemNo = await allocateNextCode(companyId, categoryModule);
  const { hsnCode, gstRate: hsnRate } = await resolveHsnRate(companyId, data?.hsnCode);
  const doc = await ItemMaster.create({
    company: companyId,
    createdBy: actorId,
    updatedBy: actorId,
    itemNo,
    itemCategory: base.itemCategory,
    itemName: base.itemName,
    itemDescription: base.itemDescription,
    uom: base.uom,
    hsnCode,
    gstRate: data?.gstRate !== undefined ? parseRate(data.gstRate, "GST Rate") : hsnRate,
    inventoryStore: base.inventoryStore,
    locationId: base.locationId,
    inventoryStoreId: base.inventoryStoreId,
    subLocationId: storeFields.subLocationId,
    reorderLevel: base.reorderLevel,
    status: base.status,
    dualUnit: base.dualUnit,
    revNumber: 0,
    revisionHistory: [],
    procurementInfo: normalizeItemProcurementInfo(data),
    governance: normalizeItemGovernance(data),
  });
  return doc.toObject();
}

export async function updateItemMaster(companyId, id, data, actor) {
  const doc = await ItemMaster.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Item record not found", 404, "NOT_FOUND");

  const storeFields = await resolveItemInventoryFields(companyId, data ?? {}, doc);
  const next = { ...normalizeNext(doc, { ...data, ...storeFields }), ...storeFields };
  const { hsnCode, gstRate: hsnRate } = await resolveHsnRate(companyId, data?.hsnCode ?? doc.hsnCode);
  const merged = {
    ...next,
    hsnCode,
    gstRate:
      data?.gstRate !== undefined && data?.gstRate !== null && data?.gstRate !== ""
        ? parseRate(data.gstRate, "GST Rate")
        : hsnRate,
  };
  const nextProcurement = normalizeItemProcurementInfo(data);
  const nextGovernance = normalizeItemGovernance(data);
  const prev = {
    itemName: doc.itemName,
    itemDescription: doc.itemDescription,
    uom: doc.uom,
    hsnCode: doc.hsnCode,
    gstRate: doc.gstRate,
    inventoryStore: doc.inventoryStore,
    status: doc.status,
    dualUnit: doc.dualUnit,
  };
  const changes = buildChanges(prev, merged);
  const mpbcdcChanged =
    JSON.stringify(doc.procurementInfo ?? {}) !== JSON.stringify(nextProcurement) ||
    JSON.stringify(doc.governance ?? {}) !== JSON.stringify(nextGovernance);
  if (changes.length === 0 && !mpbcdcChanged) return doc.toObject();

  const revision = parseRevisionInfo(data?.revisionInfo, actor);
  const nextRev = Number(doc.revNumber || 0) + 1;
  Object.assign(doc, merged, {
    revNumber: nextRev,
    updatedBy: actor?.userId || actor,
    procurementInfo: nextProcurement,
    governance: nextGovernance,
  });
  if (changes.length > 0 || mpbcdcChanged) {
    doc.revisionHistory.push({
      revisionNo: nextRev,
      revisionDate: revision.revisionDate,
      reason: revision.reason,
      proposedBy: revision.proposedBy,
      approvedBy: revision.approvedBy,
      changedBy: revision.changedBy,
      changedAt: new Date(),
      changes,
    });
  }
  if (doc.revisionHistory.length > 200) doc.revisionHistory = doc.revisionHistory.slice(-200);
  await doc.save();
  return doc.toObject();
}

export async function deleteItemMaster(companyId, id) {
  const doc = await ItemMaster.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Item record not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
