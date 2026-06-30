import { AutoIncrement } from "../models/AutoIncrement.model.js";
import { Location } from "../models/Location.model.js";
import { formatAutoIncrementCode } from "../services/autoIncrement.service.js";
import { AppError } from "./AppError.js";
import { toObjectId } from "./locationScope.js";

export function sanitizeLocationCode(loc) {
  const raw = String(loc?.locationId || loc?.name || "LOC").trim().toUpperCase();
  return raw.replace(/[^A-Z0-9]/g, "").slice(0, 8) || "LOC";
}

export function formatLocationDocNumber(locationCode, modulePrefix, number, digits = 6) {
  const pad = Math.max(1, Math.min(12, Number(digits) || 6));
  const num = Math.max(0, Number(number) || 0);
  const mod = String(modulePrefix || "DOC").trim().toUpperCase();
  const loc = sanitizeLocationCode({ locationId: locationCode });
  return `${loc}-${mod}-${String(num).padStart(pad, "0")}`;
}

/**
 * Allocate document number — location-aware when locationId provided.
 * @param {string} companyId
 * @param {string} moduleKey - e.g. PO, GRN, SO
 * @param {{ prefix?: string, digits?: number, locationId?: string }} options
 */
export async function allocateDocNumber(
  companyId,
  moduleKey,
  { prefix, digits = 6, locationId, session } = {}
) {
  const module = String(moduleKey).trim().toUpperCase();
  const locOid = toObjectId(locationId);
  const locationFilter = { company: companyId, module, locationId: locOid || null };
  const centralFilter = { company: companyId, module, locationId: null };

  let doc = await AutoIncrement.findOneAndUpdate(
    locationFilter,
    { $inc: { autoIncrementValue: 1 } },
    { new: true, session }
  );
  if (!doc && locOid) {
    doc = await AutoIncrement.findOneAndUpdate(
      centralFilter,
      { $inc: { autoIncrementValue: 1 } },
      { new: true, session }
    );
  }

  if (!doc) {
    let modulePrefix = String(prefix || module).trim().toUpperCase();

    if (locOid) {
      const loc = await Location.findOne({ _id: locOid, company: companyId }).lean();
      if (!loc) throw new AppError("Location not found for numbering", 400, "VALIDATION_ERROR");
      modulePrefix = module;
    }

    doc = await AutoIncrement.create([{
      company: companyId,
      module,
      moduleName: module,
      modulePrefix: modulePrefix,
      locationId: locOid || null,
      autoIncrementValue: 1,
      digit: digits,
    }], { session }).then((rows) => rows[0]);
  }

  return formatAutoIncrementCode(
    doc.modulePrefix || prefix || module,
    doc.autoIncrementValue,
    doc.digit || digits
  );
}

export async function previewDocNumber(companyId, moduleKey, { prefix, digits = 6, locationId } = {}) {
  const module = String(moduleKey).trim().toUpperCase();
  const locOid = toObjectId(locationId);
  let doc = await AutoIncrement.findOne({ company: companyId, module, locationId: locOid || null }).lean();
  if (!doc && locOid) {
    doc = await AutoIncrement.findOne({ company: companyId, module, locationId: null }).lean();
  }
  if (!doc) {
    const modulePrefix = String(prefix || module).trim().toUpperCase();
    return formatAutoIncrementCode(modulePrefix, 1, digits);
  }
  return formatAutoIncrementCode(
    doc.modulePrefix || prefix || module,
    (Number(doc.autoIncrementValue) || 0) + 1,
    doc.digit || digits
  );
}

export async function ensureAutoIncrementModule(
  companyId,
  module,
  moduleName,
  prefix,
  start = 0,
  locationId = null
) {
  const locOid = toObjectId(locationId);
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module, locationId: locOid || null },
    {
      $setOnInsert: {
        company: companyId,
        module,
        moduleName,
        modulePrefix: prefix,
        locationId: locOid || null,
        digit: 6,
        autoIncrementValue: start,
      },
    },
    { upsert: true }
  );
}
