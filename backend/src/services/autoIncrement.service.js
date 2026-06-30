import { AutoIncrement } from "../models/AutoIncrement.model.js";
import { AppError } from "../utils/AppError.js";
import { Location } from "../models/Location.model.js";
import { toObjectId } from "../utils/locationScope.js";
import { AuditLog } from "../models/AuditLog.model.js";

export function formatAutoIncrementCode(prefix, number, digits = 4) {
  const pad = Math.max(1, Math.min(12, Number(digits) || 4));
  const num = Math.max(0, Number(number) || 0);
  return `${String(prefix).trim().toUpperCase()}/${String(num).padStart(pad, "0")}`;
}

export async function listAutoIncrements(companyId) {
  const rows = await AutoIncrement.find({ company: companyId })
    .sort({ moduleName: 1 })
    .lean();
  const locationIds = [...new Set(rows.map((r) => String(r.locationId || "")).filter(Boolean))];
  let locationMap = new Map();
  if (locationIds.length) {
    const locations = await Location.find({ _id: { $in: locationIds }, company: companyId }).lean();
    locationMap = new Map(locations.map((l) => [String(l._id), l]));
  }
  return rows.map((r) => {
    const loc = r.locationId ? locationMap.get(String(r.locationId)) : null;
    return {
      ...r,
      allocationScope: r.locationId ? "LOCATION" : "CENTRAL",
      locationName: loc?.locationName || loc?.name || "",
      locationCode: loc?.locationId || "",
    };
  });
}

export async function createAutoIncrement(companyId, data, auditMeta = null) {
  const moduleName = String(data?.moduleName ?? "").trim();
  const module = String(data?.module ?? "").trim().toUpperCase();
  const modulePrefix = String(data?.modulePrefix ?? module).trim().toUpperCase();
  const digit = Number(data?.digit ?? 4);
  const autoIncrementValue = Number(data?.autoIncrementValue ?? 0);
  const allocationScope = String(data?.allocationScope ?? "CENTRAL").trim().toUpperCase();
  const isLocationScope = allocationScope === "LOCATION";

  if (!moduleName) throw new AppError("Module Name is required", 400, "VALIDATION_ERROR");
  if (!module) throw new AppError("Module is required", 400, "VALIDATION_ERROR");
  if (!modulePrefix) throw new AppError("Module Prefix is required", 400, "VALIDATION_ERROR");
  if (Number.isNaN(digit) || digit < 1 || digit > 12) {
    throw new AppError("Digit must be between 1 and 12", 400, "VALIDATION_ERROR");
  }
  if (Number.isNaN(autoIncrementValue) || autoIncrementValue < 0) {
    throw new AppError("Auto Increment value must be 0 or greater", 400, "VALIDATION_ERROR");
  }

  const locOid = isLocationScope ? toObjectId(data?.locationId) : null;
  if (isLocationScope && !locOid) {
    throw new AppError("Location is required for location-wise numbering", 400, "VALIDATION_ERROR");
  }
  if (locOid) {
    const existsLoc = await Location.exists({ _id: locOid, company: companyId });
    if (!existsLoc) throw new AppError("Location not found", 404, "NOT_FOUND");
  }

  const existing = await AutoIncrement.findOne({
    company: companyId,
    module,
    locationId: locOid || null,
  });
  if (existing) {
    throw new AppError(`Module "${module}" already exists`, 409, "DUPLICATE");
  }

  const doc = new AutoIncrement({
    company: companyId,
    moduleName,
    module,
    modulePrefix,
    digit,
    autoIncrementValue,
    locationId: locOid || null,
  });
  if (auditMeta) {
    doc.$locals._auditUser = {
      userId: auditMeta.userId || null,
      userName: auditMeta.userName || "",
      company: companyId,
      ip: auditMeta.ip || "",
    };
  }
  await doc.save();
  return doc.toObject();
}

export async function updateAutoIncrement(companyId, id, data, auditMeta = null) {
  const doc = await AutoIncrement.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Auto increment entry not found", 404, "NOT_FOUND");

  if (data.allocationScope !== undefined || data.locationId !== undefined) {
    const nextScope = String(data.allocationScope ?? (doc.locationId ? "LOCATION" : "CENTRAL"))
      .trim()
      .toUpperCase();
    const nextLoc =
      nextScope === "LOCATION"
        ? toObjectId(data.locationId ?? doc.locationId)
        : null;
    if (nextScope === "LOCATION" && !nextLoc) {
      throw new AppError("Location is required for location-wise numbering", 400, "VALIDATION_ERROR");
    }
    if (nextLoc) {
      const existsLoc = await Location.exists({ _id: nextLoc, company: companyId });
      if (!existsLoc) throw new AppError("Location not found", 404, "NOT_FOUND");
    }
    const dup = await AutoIncrement.findOne({
      company: companyId,
      module: String(data.module ?? doc.module).trim().toUpperCase(),
      locationId: nextLoc || null,
      _id: { $ne: id },
    });
    if (dup) {
      throw new AppError(
        `Module "${String(data.module ?? doc.module).trim().toUpperCase()}" already exists for selected scope`,
        409,
        "DUPLICATE"
      );
    }
    doc.locationId = nextLoc || null;
  }

  if (data.moduleName !== undefined) doc.moduleName = String(data.moduleName).trim();
  if (data.modulePrefix !== undefined) {
    doc.modulePrefix = String(data.modulePrefix).trim().toUpperCase();
  }
  if (data.digit !== undefined) {
    const digit = Number(data.digit);
    if (Number.isNaN(digit) || digit < 1 || digit > 12) {
      throw new AppError("Digit must be between 1 and 12", 400, "VALIDATION_ERROR");
    }
    doc.digit = digit;
  }
  if (data.autoIncrementValue !== undefined) {
    const val = Number(data.autoIncrementValue);
    if (Number.isNaN(val) || val < 0) {
      throw new AppError("Auto Increment value must be 0 or greater", 400, "VALIDATION_ERROR");
    }
    doc.autoIncrementValue = val;
  }
  if (data.module !== undefined) {
    const module = String(data.module).trim().toUpperCase();
    if (!module) throw new AppError("Module is required", 400, "VALIDATION_ERROR");
    const dup = await AutoIncrement.findOne({
      company: companyId,
      module,
      locationId: doc.locationId || null,
      _id: { $ne: id },
    });
    if (dup) throw new AppError(`Module "${module}" already exists for selected scope`, 409, "DUPLICATE");
    doc.module = module;
  }

  if (auditMeta) {
    doc.$locals._auditUser = {
      userId: auditMeta.userId || null,
      userName: auditMeta.userName || "",
      company: companyId,
      ip: auditMeta.ip || "",
    };
  }
  await doc.save();
  return doc.toObject();
}

export async function deleteAutoIncrement(companyId, id) {
  const doc = await AutoIncrement.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Auto increment entry not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}

/**
 * Preview next code without incrementing (current value + 1).
 */
export async function previewNextCode(companyId, moduleKey) {
  const module = String(moduleKey ?? "").trim().toUpperCase();
  if (!module) throw new AppError("Module is required", 400, "VALIDATION_ERROR");

  const doc = await AutoIncrement.findOne({ company: companyId, module }).lean();
  if (!doc) {
    throw new AppError(
      `Auto increment not configured for module "${module}". Add it in Settings → Auto Increment.`,
      404,
      "NOT_FOUND"
    );
  }

  const nextNum = (doc.autoIncrementValue ?? 0) + 1;
  return {
    module: doc.module,
    modulePrefix: doc.modulePrefix,
    digit: doc.digit,
    currentValue: doc.autoIncrementValue ?? 0,
    nextValue: nextNum,
    code: formatAutoIncrementCode(doc.modulePrefix, nextNum, doc.digit),
  };
}

export async function previewNextCodeForScope(companyId, moduleKey, { locationId } = {}) {
  const module = String(moduleKey ?? "").trim().toUpperCase();
  if (!module) throw new AppError("Module is required", 400, "VALIDATION_ERROR");
  const locOid = toObjectId(locationId);
  const doc = await AutoIncrement.findOne({ company: companyId, module, locationId: locOid || null }).lean();
  if (!doc) {
    throw new AppError(
      `Auto increment not configured for module "${module}" and selected scope.`,
      404,
      "NOT_FOUND"
    );
  }
  const nextNum = (doc.autoIncrementValue ?? 0) + 1;
  return {
    module: doc.module,
    modulePrefix: doc.modulePrefix,
    digit: doc.digit,
    currentValue: doc.autoIncrementValue ?? 0,
    nextValue: nextNum,
    code: formatAutoIncrementCode(doc.modulePrefix, nextNum, doc.digit),
    locationId: doc.locationId || null,
    allocationScope: doc.locationId ? "LOCATION" : "CENTRAL",
  };
}

/**
 * Atomically increment and return the assigned code (call only on successful save).
 */
export async function allocateNextCode(companyId, moduleKey) {
  const module = String(moduleKey ?? "").trim().toUpperCase();
  if (!module) throw new AppError("Module is required", 400, "VALIDATION_ERROR");

  const doc = await AutoIncrement.findOneAndUpdate(
    { company: companyId, module },
    { $inc: { autoIncrementValue: 1 } },
    { new: true }
  );

  if (!doc) {
    throw new AppError(
      `Auto increment not configured for module "${module}". Add it in Settings → Auto Increment.`,
      404,
      "NOT_FOUND"
    );
  }

  return formatAutoIncrementCode(doc.modulePrefix, doc.autoIncrementValue, doc.digit);
}

export async function listAutoIncrementRevisions(companyId, id, limit = 50) {
  const doc = await AutoIncrement.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Auto increment entry not found", 404, "NOT_FOUND");
  const rows = await AuditLog.find({
    company: companyId,
    modelName: "AutoIncrement",
    documentId: doc._id,
  })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(200, Number(limit) || 50)))
    .lean();
  return rows;
}
