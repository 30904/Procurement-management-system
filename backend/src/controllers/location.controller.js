import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { Location } from "../models/Location.model.js";
import { buildLocationPayload, applyLocationPayload } from "../utils/locationPayload.js";
import { hasPermission } from "../services/rbac.service.js";

const LOC_PREFIX = "LOC";
const LOC_DIGITS = 5;

function requireLocationMasterAccess(req, action = "edit") {
  const isSuper =
    req.rbac?.isSuperAdmin ||
    String(req.appUser?.userType || "").toUpperCase() === "SUPER_ADMIN";
  if (isSuper) return;
  if (hasPermission(req.rbac, "location_master", action)) return;
  throw new AppError("Location Master access required", 403, "FORBIDDEN");
}

function getCompanyId(req) {
  const id = req.rbac?.companyId || req.appUser?.company;
  if (!id) throw new AppError("Company not found for user", 400, "NO_COMPANY");
  return id;
}

async function generateNextLocationCode(companyId) {
  const latest = await Location.findOne({
    company: companyId,
    locationCode: new RegExp(`^${LOC_PREFIX}\\d{${LOC_DIGITS}}$`),
  })
    .sort({ locationCode: -1 })
    .select({ locationCode: 1 })
    .lean();

  const suffix = latest?.locationCode
    ? Number(String(latest.locationCode).slice(LOC_PREFIX.length))
    : 0;
  const next = Number.isFinite(suffix) ? suffix + 1 : 1;
  return `${LOC_PREFIX}${String(next).padStart(LOC_DIGITS, "0")}`;
}

function parseDateInput(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError("Invalid registration date", 400, "VALIDATION_ERROR");
  }
  return d;
}

export const listLocations = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const q = String(req.query.q || "").trim();

  const filter = { company: companyId };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { locationId: rx },
      { locationCode: rx },
      { locationType: rx },
      { operationalCategory: rx },
      { gstin: rx },
      { status: rx },
      { cityDistrict: rx },
      { state: rx },
      { pinCode: rx },
    ];
  }

  const rows = await Location.find(filter)
    .sort({ registrationDate: -1, locationId: 1 })
    .lean();

  const stats = {
    total: rows.length,
    active: rows.filter((r) => String(r.status).toLowerCase() === "active").length,
    inactive: rows.filter((r) => String(r.status).toLowerCase() !== "active").length,
  };

  res.status(200).json({ success: true, data: rows, stats });
});

export const getLocationById = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const doc = await Location.findOne({ _id: req.params.id, company: companyId }).lean();
  if (!doc) throw new AppError("Location not found", 404, "NOT_FOUND");
  res.status(200).json({ success: true, data: doc });
});

export const getLocationSummary = asyncHandler(async (req, res) => {
  const companyId = getCompanyId(req);
  const rows = await Location.find({ company: companyId })
    .select({ status: 1, locationType: 1 })
    .lean();

  const byType = {};
  for (const r of rows) {
    const t = r.locationType || "Unspecified";
    byType[t] = (byType[t] || 0) + 1;
  }

  res.status(200).json({
    success: true,
    data: {
      total: rows.length,
      active: rows.filter((r) => String(r.status).toLowerCase() === "active").length,
      inactive: rows.filter((r) => String(r.status).toLowerCase() !== "active").length,
      byType,
    },
  });
});

export const createLocation = asyncHandler(async (req, res) => {
  requireLocationMasterAccess(req, "create");
  const companyId = getCompanyId(req);
  const body = req.body ?? {};

  const locationId = String(body.locationId ?? "").trim();
  if (!locationId) {
    throw new AppError("Location ID is required", 400, "VALIDATION_ERROR");
  }

  const locationCode = await generateNextLocationCode(companyId);
  const payload = buildLocationPayload({ ...body, locationId });

  try {
    const doc = new Location({
      company: companyId,
      locationCode,
      registrationDate: parseDateInput(body.registrationDate),
    });
    applyLocationPayload(doc, payload);
    if (body.isCentral) {
      await Location.updateMany(
        { company: companyId, _id: { $ne: doc._id } },
        { $set: { isCentral: false } }
      );
      doc.isCentral = true;
    }
    if (!doc.name) doc.name = doc.locationId;
    await doc.save();

    res.status(201).json({
      success: true,
      message: "Location created successfully",
      data: doc.toObject(),
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Location ID already exists", 409, "DUPLICATE");
    }
    throw err;
  }
});

export const updateLocation = asyncHandler(async (req, res) => {
  requireLocationMasterAccess(req, "edit");
  const companyId = getCompanyId(req);
  const { id } = req.params;
  const body = req.body ?? {};

  const doc = await Location.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Location not found", 404, "NOT_FOUND");

  const payload = buildLocationPayload(body);
  if (!payload.locationId) {
    throw new AppError("Location ID is required", 400, "VALIDATION_ERROR");
  }
  applyLocationPayload(doc, payload);
  if (body.isCentral) {
    await Location.updateMany(
      { company: companyId, _id: { $ne: doc._id } },
      { $set: { isCentral: false } }
    );
    doc.isCentral = true;
  } else if (body.isCentral === false) {
    doc.isCentral = false;
  }
  if (!doc.name) doc.name = doc.locationId;

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Location ID already exists", 409, "DUPLICATE");
    }
    throw err;
  }

  res.status(200).json({
    success: true,
    message: "Location updated successfully",
    data: doc.toObject(),
  });
});

export const deleteLocation = asyncHandler(async (req, res) => {
  requireLocationMasterAccess(req, "delete");
  const companyId = getCompanyId(req);
  const { id } = req.params;

  const doc = await Location.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Location not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    message: "Location deleted successfully",
  });
});
