import { Location } from "../models/Location.model.js";
import { User } from "../models/User.model.js";
import { toObjectId } from "../utils/locationScope.js";

/**
 * Resolve data-access scope for the current user.
 */
export async function resolveLocationScope(userId, { activeLocationHeader } = {}) {
  const user = await User.findById(userId)
    .select({
      company: 1,
      userType: 1,
      defaultLocationId: 1,
      allowedLocationIds: 1,
      locationAccessMode: 1,
    })
    .lean();

  if (!user) {
    return {
      mode: "restricted",
      locationIds: [],
      defaultLocationId: null,
      activeLocationId: null,
      locations: [],
    };
  }

  const isSuperAdmin =
    String(user.userType || "").toUpperCase() === "SUPER_ADMIN" ||
    user.locationAccessMode === "all";

  let locationIds = [];
  if (isSuperAdmin) {
    const all = await Location.find({ company: user.company, isActive: { $ne: false } })
      .select({ _id: 1, locationId: 1, name: 1, isCentral: 1, gstin: 1 })
      .sort({ isCentral: -1, locationId: 1 })
      .lean();
    return buildScopeResult({
      mode: "all",
      locationIds: all.map((l) => l._id),
      defaultLocationId: user.defaultLocationId || all.find((l) => l.isCentral)?._id || all[0]?._id,
      activeLocationHeader,
      locations: all,
    });
  }

  locationIds = Array.isArray(user.allowedLocationIds)
    ? user.allowedLocationIds.filter(Boolean)
  : [];

  if (!locationIds.length) {
    const central = await Location.findOne({ company: user.company, isCentral: true, isActive: { $ne: false } })
      .select({ _id: 1 })
      .lean();
    if (central) locationIds = [central._id];
  }

  const locations = locationIds.length
    ? await Location.find({ company: user.company, _id: { $in: locationIds } })
        .select({ _id: 1, locationId: 1, name: 1, isCentral: 1, gstin: 1 })
        .sort({ isCentral: -1, locationId: 1 })
        .lean()
    : [];

  return buildScopeResult({
    mode: "restricted",
    locationIds: locations.map((l) => l._id),
    defaultLocationId: user.defaultLocationId || locations[0]?._id,
    activeLocationHeader,
    locations,
  });
}

function buildScopeResult({ mode, locationIds, defaultLocationId, activeLocationHeader, locations }) {
  const ids = locationIds.map((id) => String(id));
  let activeLocationId = null;

  const headerId = toObjectId(activeLocationHeader);
  if (headerId && (mode === "all" || ids.includes(String(headerId)))) {
    activeLocationId = headerId;
  } else if (defaultLocationId && ids.includes(String(defaultLocationId))) {
    activeLocationId = toObjectId(defaultLocationId);
  } else if (ids.length) {
    activeLocationId = toObjectId(ids[0]);
  }

  return {
    mode,
    locationIds,
    defaultLocationId: defaultLocationId ? toObjectId(defaultLocationId) : activeLocationId,
    activeLocationId,
    locations: locations.map((l) => ({
      _id: l._id,
      locationId: l.locationId,
      name: l.name || l.locationId,
      isCentral: !!l.isCentral,
      gstin: l.gstin || "",
    })),
  };
}

export async function getEffectiveGstin(companyId, locationId) {
  const loc = await Location.findOne({ _id: locationId, company: companyId }).lean();
  if (!loc) return "";
  if (loc.usesCompanyGstin) return "";
  return String(loc.gstin || "").trim();
}
