import { AppError } from "./AppError.js";
import {
  assertLocationAccess,
  resolveBodyLocationId,
  toObjectId,
} from "./locationScope.js";

/**
 * Mandatory governance for all location-scoped transactions.
 * @returns {{ locationId: ObjectId, subLocationId?: ObjectId, inventoryStoreId?: ObjectId }}
 */
export function validateTransactionContext(body, scope, options = {}) {
  const { requireStore = false, requireSubLocation = false } = options;

  const locationId = resolveBodyLocationId(body ?? {}, scope);
  assertLocationAccess(scope, locationId);

  let subLocationId = null;
  if (body?.subLocationId) {
    subLocationId = toObjectId(body.subLocationId);
    if (!subLocationId) {
      throw new AppError("Invalid sub-location", 400, "VALIDATION_ERROR");
    }
  }
  if (requireSubLocation && !subLocationId) {
    throw new AppError("Sub-location is required", 400, "VALIDATION_ERROR");
  }

  let inventoryStoreId = null;
  if (body?.inventoryStoreId || body?.storeId) {
    inventoryStoreId = toObjectId(body.inventoryStoreId || body.storeId);
    if (!inventoryStoreId) {
      throw new AppError("Invalid store", 400, "VALIDATION_ERROR");
    }
  }
  if (requireStore && !inventoryStoreId) {
    throw new AppError("Inventory store is required", 400, "VALIDATION_ERROR");
  }

  return { locationId, subLocationId, inventoryStoreId };
}

export function assertLocationUnchanged(doc, nextLocationId, field = "locationId") {
  const current = doc[field] ? String(doc[field]) : "";
  const next = nextLocationId ? String(nextLocationId) : "";
  if (current && next && current !== next) {
    return { changed: true, oldLocationId: doc[field], newLocationId: nextLocationId };
  }
  return { changed: false };
}
