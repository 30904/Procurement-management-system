import { InventoryStore } from "../models/InventoryStore.model.js";
import { Location } from "../models/Location.model.js";
import { AppError } from "../utils/AppError.js";
import { toObjectId } from "../utils/locationScope.js";

function trim(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

export async function listInventoryStores(companyId, { locationId } = {}) {
  const filter = { company: companyId };
  const loc = toObjectId(locationId);
  if (loc) filter.locationId = loc;
  return InventoryStore.find(filter).sort({ locationId: 1, storeCode: 1 }).lean();
}

export async function getStoresByLocation(companyId, locationId) {
  const loc = toObjectId(locationId);
  if (!loc) throw new AppError("Location is required", 400, "VALIDATION_ERROR");
  return InventoryStore.find({ company: companyId, locationId: loc, status: "Active" })
    .sort({ isDefault: -1, storeCode: 1 })
    .lean();
}

export async function getInventoryStoreById(companyId, id) {
  const storeId = toObjectId(id);
  if (!storeId) throw new AppError("Invalid store id", 400, "VALIDATION_ERROR");
  const doc = await InventoryStore.findOne({ company: companyId, _id: storeId }).lean();
  if (!doc) throw new AppError("Inventory store not found", 404, "NOT_FOUND");
  return doc;
}

export async function createInventoryStore(companyId, data) {
  const locationId = toObjectId(data.locationId);
  if (!locationId) throw new AppError("Location is required", 400, "VALIDATION_ERROR");

  const loc = await Location.findOne({ _id: locationId, company: companyId });
  if (!loc) throw new AppError("Location not found", 404, "NOT_FOUND");

  const storeCode = trim(data.storeCode);
  const storeName = trim(data.storeName);
  if (!storeCode || !storeName) {
    throw new AppError("Store code and name are required", 400, "VALIDATION_ERROR");
  }

  if (data.isDefault) {
    await InventoryStore.updateMany(
      { company: companyId, locationId },
      { $set: { isDefault: false } }
    );
  }

  const doc = await InventoryStore.create({
    company: companyId,
    locationId,
    storeCode,
    storeName,
    isDefault: !!data.isDefault,
    status: trim(data.status) || "Active",
    description: trim(data.description),
  });
  return doc.toObject();
}

export async function updateInventoryStore(companyId, id, data) {
  const doc = await InventoryStore.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Store not found", 404, "NOT_FOUND");

  if (data.isDefault === true) {
    await InventoryStore.updateMany(
      { company: companyId, locationId: doc.locationId, _id: { $ne: doc._id } },
      { $set: { isDefault: false } }
    );
    doc.isDefault = true;
  } else if (data.isDefault === false) {
    doc.isDefault = false;
  }

  if (data.storeName !== undefined) doc.storeName = trim(data.storeName);
  if (data.status !== undefined) doc.status = trim(data.status) || "Active";
  if (data.description !== undefined) doc.description = trim(data.description);
  await doc.save();
  return doc.toObject();
}

export async function deleteInventoryStore(companyId, id) {
  const doc = await InventoryStore.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Store not found", 404, "NOT_FOUND");
  return { deleted: true };
}
