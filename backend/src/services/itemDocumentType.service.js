import { ItemDocumentType } from "../models/ItemDocumentType.model.js";
import { AppError } from "../utils/AppError.js";
import { MANDATORY_RULES, normalizeApplicableCategories } from "../utils/itemConfigRules.js";

const DEFAULT_MIMES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function normalizeCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeDocType(data = {}) {
  const code = normalizeCode(data.code);
  const label = String(data.label ?? "").trim();
  if (!code) throw new AppError("Code is required", 400, "VALIDATION_ERROR");
  if (!label) throw new AppError("Label is required", 400, "VALIDATION_ERROR");

  const mandatoryRule = MANDATORY_RULES.includes(data.mandatoryRule) ? data.mandatoryRule : "never";
  const allowedMimeTypes = Array.isArray(data.allowedMimeTypes)
    ? data.allowedMimeTypes.map((m) => String(m).trim()).filter(Boolean)
    : DEFAULT_MIMES;
  const maxFiles = Math.min(20, Math.max(1, Number(data.maxFiles) || 1));

  return {
    code,
    label,
    description: String(data.description ?? "").trim(),
    allowedMimeTypes: allowedMimeTypes.length ? allowedMimeTypes : DEFAULT_MIMES,
    maxFiles,
    mandatoryRule,
    applicableCategories: normalizeApplicableCategories(data.applicableCategories),
    sequence: Number(data.sequence) || 0,
    status: data.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function listItemDocumentTypes(companyId) {
  return ItemDocumentType.find({ company: companyId }).sort({ sequence: 1, label: 1 }).lean();
}

export async function getItemDocumentType(companyId, id) {
  const doc = await ItemDocumentType.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Document type not found", 404, "NOT_FOUND");
  return doc;
}

export async function getItemDocumentTypeByCode(companyId, code) {
  const doc = await ItemDocumentType.findOne({ company: companyId, code: normalizeCode(code), status: "Active" }).lean();
  return doc;
}

export async function createItemDocumentType(companyId, data) {
  const payload = normalizeDocType(data);
  const exists = await ItemDocumentType.findOne({ company: companyId, code: payload.code }).lean();
  if (exists) throw new AppError(`Document type "${payload.code}" already exists`, 409, "DUPLICATE");
  const doc = await ItemDocumentType.create({ company: companyId, ...payload });
  return doc.toObject();
}

export async function updateItemDocumentType(companyId, id, data) {
  const doc = await ItemDocumentType.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Document type not found", 404, "NOT_FOUND");
  const payload = normalizeDocType({ ...doc.toObject(), ...data, code: data?.code ?? doc.code });
  if (payload.code !== doc.code) {
    const dup = await ItemDocumentType.findOne({ company: companyId, code: payload.code, _id: { $ne: id } }).lean();
    if (dup) throw new AppError(`Document type "${payload.code}" already exists`, 409, "DUPLICATE");
  }
  Object.assign(doc, payload);
  await doc.save();
  return doc.toObject();
}

export async function deleteItemDocumentType(companyId, id) {
  const doc = await ItemDocumentType.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Document type not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}
