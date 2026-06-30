import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { SubLocation } from "../models/SubLocation.model.js";
import { Location } from "../models/Location.model.js";

const SUB_PREFIX = "SLOC";
const SUB_DIGITS = 5;

function requireSuperAdmin(req) {
  const isSuper =
    req.rbac?.isSuperAdmin ||
    String(req.appUser?.userType || "").toUpperCase() === "SUPER_ADMIN";
  if (!isSuper) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
}

function getCompanyId(req) {
  const id = req.rbac?.companyId || req.appUser?.company;
  if (!id) throw new AppError("Company not found for user", 400, "NO_COMPANY");
  return id;
}

async function generateNextSubLocationCode(companyId) {
  const latest = await SubLocation.findOne({
    company: companyId,
    subLocationCode: new RegExp(`^${SUB_PREFIX}\\d{${SUB_DIGITS}}$`),
  })
    .sort({ subLocationCode: -1 })
    .select({ subLocationCode: 1 })
    .lean();

  const suffix = latest?.subLocationCode
    ? Number(String(latest.subLocationCode).slice(SUB_PREFIX.length))
    : 0;
  const next = Number.isFinite(suffix) ? suffix + 1 : 1;
  return `${SUB_PREFIX}${String(next).padStart(SUB_DIGITS, "0")}`;
}

function buildPayload(body) {
  const locationId = String(body.locationId ?? body.parentLocation ?? "").trim();
  const subLocationName = String(body.subLocationName ?? "").trim();
  const subLocationId = String(body.subLocationId ?? subLocationName).trim();
  return {
    parentLocation: locationId,
    locationId,
    subLocationId,
    subLocationName: subLocationName || subLocationId,
    locationType: String(body.locationType ?? "").trim(),
    operationalCategory: String(body.operationalCategory ?? "").trim(),
    gstin: String(body.gstin ?? "").trim().toUpperCase(),
    status: String(body.status ?? "Active").trim(),
    description: String(body.description ?? "").trim(),
  };
}

function applyPayload(doc, payload) {
  doc.parentLocation = payload.parentLocation;
  doc.locationId = payload.parentLocation;
  doc.subLocationId = payload.subLocationId;
  doc.subLocationName = payload.subLocationName || payload.subLocationId;
  doc.locationType = payload.locationType;
  doc.operationalCategory = payload.operationalCategory;
  doc.gstin = payload.gstin;
  doc.status = payload.status;
  doc.isActive = payload.status.toLowerCase() === "active";
  doc.description = payload.description;
}

async function assertParentLocation(companyId, parentLocationId) {
  if (!parentLocationId) {
    throw new AppError("Parent location is required", 400, "VALIDATION_ERROR");
  }
  const parent = await Location.findOne({ _id: parentLocationId, company: companyId });
  if (!parent) {
    throw new AppError("Parent location not found", 400, "VALIDATION_ERROR");
  }
  return parent;
}

async function resolveParentLocationId(companyId, parentLocation) {
  const key = String(parentLocation || "").trim();
  if (!key) return null;
  if (mongoose.isValidObjectId(key)) {
    const loc = await Location.findOne({ _id: key, company: companyId }).select("_id").lean();
    return loc?._id || null;
  }
  const loc = await Location.findOne({
    company: companyId,
    $or: [{ locationId: key }, { name: key }],
  })
    .select("_id")
    .lean();
  return loc?._id || null;
}

export const listSubLocations = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const q = String(req.query.q || "").trim();
  const parentLocationKey = String(req.query.parentLocation || req.query.locationId || "").trim();

  const and = [{ company: companyId }];
  if (parentLocationKey) {
    const parentOid = await resolveParentLocationId(companyId, parentLocationKey);
    if (!parentOid) {
      return res.status(200).json({
        success: true,
        data: [],
        stats: { total: 0, active: 0, inactive: 0 },
      });
    }
    and.push({
      $or: [{ parentLocation: parentOid }, { locationId: parentOid }],
    });
  }
  and.push({
    status: { $nin: ["Inactive", "inactive"] },
    isActive: { $ne: false },
  });
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    and.push({
      $or: [
        { subLocationId: rx },
        { subLocationName: rx },
        { subLocationCode: rx },
        { locationType: rx },
        { operationalCategory: rx },
        { gstin: rx },
        { status: rx },
      ],
    });
  }

  const filter = and.length === 1 ? and[0] : { $and: and };

  const rows = await SubLocation.find(filter)
    .populate("parentLocation", "locationId locationCode")
    .sort({ subLocationId: 1 })
    .lean();

  const stats = {
    total: rows.length,
    active: rows.filter((r) => String(r.status).toLowerCase() === "active").length,
    inactive: rows.filter((r) => String(r.status).toLowerCase() !== "active").length,
  };

  res.status(200).json({ success: true, data: rows, stats });
});

export const getSubLocationById = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const doc = await SubLocation.findOne({ _id: req.params.id, company: companyId })
    .populate("parentLocation", "locationId locationCode name")
    .lean();
  if (!doc) throw new AppError("Sub-location not found", 404, "NOT_FOUND");
  res.status(200).json({ success: true, data: doc });
});

export const getSubLocationSummary = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const rows = await SubLocation.find({ company: companyId })
    .select({ status: 1, locationType: 1, operationalCategory: 1 })
    .lean();

  const byType = {};
  const byCategory = {};
  for (const r of rows) {
    const t = r.locationType || "Unspecified";
    const c = r.operationalCategory || "Unspecified";
    byType[t] = (byType[t] || 0) + 1;
    byCategory[c] = (byCategory[c] || 0) + 1;
  }

  res.status(200).json({
    success: true,
    data: {
      total: rows.length,
      active: rows.filter((r) => String(r.status).toLowerCase() === "active").length,
      inactive: rows.filter((r) => String(r.status).toLowerCase() !== "active").length,
      byType,
      byCategory,
    },
  });
});

export const getSubLocationStatusSummary = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const rows = await SubLocation.find({ company: companyId }).select({ status: 1 }).lean();

  const active = rows.filter((r) => String(r.status).toLowerCase() === "active").length;
  const inactive = rows.length - active;

  res.status(200).json({
    success: true,
    data: {
      total: rows.length,
      active,
      inactive,
      activePercent: rows.length ? Math.round((active / rows.length) * 100) : 0,
      inactivePercent: rows.length ? Math.round((inactive / rows.length) * 100) : 0,
    },
  });
});

export const createSubLocation = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = getCompanyId(req);
  const payload = buildPayload(req.body ?? {});

  if (!payload.subLocationId) {
    throw new AppError("Sub-location ID is required", 400, "VALIDATION_ERROR");
  }

  await assertParentLocation(companyId, payload.parentLocation);
  const subLocationCode = await generateNextSubLocationCode(companyId);

  try {
    const doc = new SubLocation({
      company: companyId,
      subLocationCode,
    });
    applyPayload(doc, payload);
    doc.createdBy = req.appUser?._id || req.user?.sub;
    doc.updatedBy = doc.createdBy;
    await doc.save();
    await doc.populate("parentLocation", "locationId locationCode name");

    res.status(201).json({
      success: true,
      message: "Sub-location created successfully",
      data: doc.toObject(),
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Sub-location ID already exists for this parent", 409, "DUPLICATE");
    }
    throw err;
  }
});

export const updateSubLocation = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = getCompanyId(req);
  const { id } = req.params;
  const payload = buildPayload(req.body ?? {});

  const doc = await SubLocation.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Sub-location not found", 404, "NOT_FOUND");

  if (!payload.subLocationId) {
    throw new AppError("Sub-location ID is required", 400, "VALIDATION_ERROR");
  }

  await assertParentLocation(companyId, payload.parentLocation);
  applyPayload(doc, payload);
  doc.updatedBy = req.appUser?._id || req.user?.sub;

  try {
    await doc.save();
    await doc.populate("parentLocation", "locationId locationCode name");
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Sub-location ID already exists for this parent", 409, "DUPLICATE");
    }
    throw err;
  }

  res.status(200).json({
    success: true,
    message: "Sub-location updated successfully",
    data: doc.toObject(),
  });
});

export const deleteSubLocation = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = getCompanyId(req);
  const { id } = req.params;

  const doc = await SubLocation.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Sub-location not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    message: "Sub-location deleted successfully",
  });
});
