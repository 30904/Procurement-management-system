import { Location } from "../models/Location.model.js";
import { SubLocation } from "../models/SubLocation.model.js";
import { InventoryStore } from "../models/InventoryStore.model.js";
import { AppError } from "./AppError.js";

export async function resolveAssetLocationFields(companyId, data = {}, doc = {}) {
  const locationId = data?.locationId ?? doc?.locationId;
  const subLocationId = data?.subLocationId ?? doc?.subLocationId;
  let assetLocation = String(data?.assetLocation ?? doc?.assetLocation ?? "").trim();
  let subLocation = String(data?.subLocation ?? doc?.subLocation ?? "").trim();

  if (locationId) {
    const loc = await Location.findOne({ _id: locationId, company: companyId }).lean();
    if (!loc) throw new AppError("Invalid location selected", 400, "VALIDATION_ERROR");
    assetLocation = String(loc.name || loc.locationId || "").trim();
  }

  if (subLocationId) {
    const sub = await SubLocation.findOne({ _id: subLocationId, company: companyId }).lean();
    if (!sub) throw new AppError("Invalid sub-location selected", 400, "VALIDATION_ERROR");
    if (locationId && String(sub.parentLocation || sub.locationId) !== String(locationId)) {
      throw new AppError("Sub-location does not belong to the selected location", 400, "VALIDATION_ERROR");
    }
    subLocation = String(sub.subLocationName || sub.subLocationId || "").trim();
  }

  if (!assetLocation) {
    throw new AppError("Asset Location is required", 400, "VALIDATION_ERROR");
  }

  return {
    locationId: locationId || undefined,
    subLocationId: subLocationId || undefined,
    assetLocation,
    subLocation,
  };
}

export async function resolveItemInventoryFields(companyId, data = {}, doc = {}) {
  const locationId = data?.locationId ?? doc?.locationId;
  const inventoryStoreId = data?.inventoryStoreId ?? doc?.inventoryStoreId;
  let inventoryStore = String(data?.inventoryStore ?? doc?.inventoryStore ?? "").trim();

  if (inventoryStoreId) {
    const store = await InventoryStore.findOne({ _id: inventoryStoreId, company: companyId }).lean();
    if (!store) throw new AppError("Invalid inventory store selected", 400, "VALIDATION_ERROR");
    if (locationId && String(store.locationId) !== String(locationId)) {
      throw new AppError("Inventory store does not belong to the selected location", 400, "VALIDATION_ERROR");
    }
    return resolveItemSubLocationFields(companyId, data, doc, {
      locationId: store.locationId,
      inventoryStoreId: store._id,
      inventoryStore: String(store.storeCode || store.storeName || "").trim(),
    });
  }

  if (locationId && inventoryStore) {
    const store = await InventoryStore.findOne({
      company: companyId,
      locationId,
      $or: [{ storeCode: inventoryStore }, { storeName: inventoryStore }],
    }).lean();
    if (store) {
      return resolveItemSubLocationFields(companyId, data, doc, {
        locationId: store.locationId,
        inventoryStoreId: store._id,
        inventoryStore: String(store.storeCode || store.storeName || "").trim(),
      });
    }
  }

  if (!inventoryStore) {
    throw new AppError("Inventory Store is required", 400, "VALIDATION_ERROR");
  }

  return resolveItemSubLocationFields(companyId, data, doc, {
    locationId: locationId || undefined,
    inventoryStoreId: undefined,
    inventoryStore,
  });
}

async function resolveItemSubLocationFields(companyId, data, doc, base) {
  const resolved = { ...base };
  const locId = resolved.locationId;
  const subLocationId = data?.subLocationId ?? doc?.subLocationId;

  if (subLocationId) {
    const sub = await SubLocation.findOne({ _id: subLocationId, company: companyId }).lean();
    if (!sub) throw new AppError("Invalid sub-location selected", 400, "VALIDATION_ERROR");
    const subParent = sub.parentLocation || sub.locationId;
    if (locId && String(subParent) !== String(locId)) {
      throw new AppError("Sub-location does not belong to the selected location", 400, "VALIDATION_ERROR");
    }
    resolved.subLocationId = sub._id;
  } else if (data && Object.prototype.hasOwnProperty.call(data, "subLocationId")) {
    resolved.subLocationId = undefined;
  }

  return resolved;
}

/** Resolve location + store from upload row text (location name/id + store code). */
export async function resolveItemUploadLocationFields(companyId, locationText, storeText) {
  const locKey = String(locationText ?? "").trim();
  const storeKey = String(storeText ?? "").trim();
  if (!locKey) throw new AppError("Location is required", 400, "VALIDATION_ERROR");
  if (!storeKey) throw new AppError("Inventory Store is required", 400, "VALIDATION_ERROR");

  const loc = await Location.findOne({
    company: companyId,
    isActive: { $ne: false },
    $or: [{ locationId: locKey }, { name: locKey }],
  }).lean();
  if (!loc) {
    throw new AppError(`Unknown location "${locKey}"`, 400, "VALIDATION_ERROR");
  }

  const store = await InventoryStore.findOne({
    company: companyId,
    locationId: loc._id,
    status: { $ne: "Inactive" },
    $or: [{ storeCode: storeKey }, { storeName: storeKey }],
  }).lean();
  if (!store) {
    throw new AppError(
      `Unknown inventory store "${storeKey}" for location "${locKey}"`,
      400,
      "VALIDATION_ERROR"
    );
  }

  return {
    locationId: loc._id,
    inventoryStoreId: store._id,
    inventoryStore: String(store.storeCode || store.storeName || "").trim(),
  };
}

/** Resolve optional sub-location from upload row text for a known location. */
export async function resolveItemUploadSubLocationFields(companyId, locationId, subLocationText) {
  const key = String(subLocationText ?? "").trim();
  if (!key || !locationId) return {};
  const sub = await SubLocation.findOne({
    company: companyId,
    $and: [
      { $or: [{ parentLocation: locationId }, { locationId }] },
      { $or: [{ subLocationId: key }, { subLocationName: key }, { subLocationCode: key }] },
    ],
  }).lean();
  if (!sub) {
    throw new AppError(`Unknown sub-location "${key}" for this location`, 400, "VALIDATION_ERROR");
  }
  return { subLocationId: sub._id };
}
