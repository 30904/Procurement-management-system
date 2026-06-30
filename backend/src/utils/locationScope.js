import mongoose from "mongoose";
import { AppError } from "./AppError.js";

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  const s = String(id).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return new mongoose.Types.ObjectId(s);
}

/**
 * Apply location filter for location-scoped collections.
 * @param {object} query - mongoose filter
 * @param {object} scope - from resolveLocationScope
 * @param {string} [field='locationId'] - field name on document
 * @param {boolean} [requireActive=true] - when restricted, filter to activeLocationId if set
 */
export function applyLocationFilter(query, scope, field = "locationId", requireActive = true) {
  if (!scope || scope.mode === "all") {
    if (requireActive && scope?.activeLocationId) {
      const oid = toObjectId(scope.activeLocationId);
      if (oid) return { ...query, [field]: oid };
    }
    return query;
  }

  const ids = (scope.locationIds || [])
    .map(toObjectId)
    .filter(Boolean);

  if (!ids.length) {
    return { ...query, [field]: { $in: [] } };
  }

  if (requireActive && scope.activeLocationId) {
    const active = toObjectId(scope.activeLocationId);
    if (active && ids.some((id) => id.equals(active))) {
      return { ...query, [field]: active };
    }
  }

  return { ...query, [field]: { $in: ids } };
}

export function assertLocationAccess(scope, locationId, { allowAll = true } = {}) {
  const oid = toObjectId(locationId);
  if (!oid) {
    throw new AppError("Location is required", 400, "VALIDATION_ERROR");
  }
  if (scope?.mode === "all" && allowAll) return oid;
  const allowed = (scope?.locationIds || []).map((id) => String(id));
  if (!allowed.includes(String(oid))) {
    throw new AppError("You do not have access to this location", 403, "LOCATION_FORBIDDEN");
  }
  return oid;
}

export function resolveBodyLocationId(body, scope) {
  const fromBody = body?.locationId;
  if (fromBody) return assertLocationAccess(scope, fromBody);
  if (scope?.activeLocationId) return assertLocationAccess(scope, scope.activeLocationId);
  if (scope?.defaultLocationId) return assertLocationAccess(scope, scope.defaultLocationId);
  throw new AppError("Location is required", 400, "VALIDATION_ERROR");
}
