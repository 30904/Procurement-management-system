import { ItemAttributeDefinition } from "../models/ItemAttributeDefinition.model.js";
import { MasterData } from "../models/MasterData.model.js";
import { AppError } from "../utils/AppError.js";
import { MANDATORY_RULES, normalizeApplicableCategories } from "../utils/itemConfigRules.js";

const DATA_TYPES = ["text", "number", "decimal", "boolean", "date", "dropdown", "multi_select"];

function normalizeCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeAttrDef(data = {}) {
  const code = normalizeCode(data.code);
  const label = String(data.label ?? "").trim();
  if (!code) throw new AppError("Code is required", 400, "VALIDATION_ERROR");
  if (!label) throw new AppError("Label is required", 400, "VALIDATION_ERROR");

  const dataType = DATA_TYPES.includes(data.dataType) ? data.dataType : "text";
  const mandatoryRule = MANDATORY_RULES.includes(data.mandatoryRule) ? data.mandatoryRule : "never";
  const options = Array.isArray(data.options)
    ? data.options.map((o) => String(o).trim()).filter(Boolean)
    : [];

  return {
    code,
    label,
    description: String(data.description ?? "").trim(),
    dataType,
    unit: String(data.unit ?? "").trim(),
    options,
    masterDataCategory: String(data.masterDataCategory ?? "").trim(),
    mandatoryRule,
    applicableCategories: normalizeApplicableCategories(data.applicableCategories),
    defaultValue: data.defaultValue ?? null,
    min: data.min === "" || data.min == null ? null : Number(data.min),
    max: data.max === "" || data.max == null ? null : Number(data.max),
    regex: String(data.regex ?? "").trim(),
    sequence: Number(data.sequence) || 0,
    status: data.status === "Inactive" ? "Inactive" : "Active",
  };
}

export async function listItemAttributeDefinitions(companyId) {
  return ItemAttributeDefinition.find({ company: companyId }).sort({ sequence: 1, label: 1 }).lean();
}

export async function getItemAttributeDefinition(companyId, id) {
  const doc = await ItemAttributeDefinition.findOne({ _id: id, company: companyId }).lean();
  if (!doc) throw new AppError("Attribute definition not found", 404, "NOT_FOUND");
  return doc;
}

export async function createItemAttributeDefinition(companyId, data) {
  const payload = normalizeAttrDef(data);
  const exists = await ItemAttributeDefinition.findOne({ company: companyId, code: payload.code }).lean();
  if (exists) throw new AppError(`Attribute "${payload.code}" already exists`, 409, "DUPLICATE");
  const doc = await ItemAttributeDefinition.create({ company: companyId, ...payload });
  return doc.toObject();
}

export async function updateItemAttributeDefinition(companyId, id, data) {
  const doc = await ItemAttributeDefinition.findOne({ _id: id, company: companyId });
  if (!doc) throw new AppError("Attribute definition not found", 404, "NOT_FOUND");
  const payload = normalizeAttrDef({ ...doc.toObject(), ...data, code: data?.code ?? doc.code });
  if (payload.code !== doc.code) {
    const dup = await ItemAttributeDefinition.findOne({ company: companyId, code: payload.code, _id: { $ne: id } }).lean();
    if (dup) throw new AppError(`Attribute "${payload.code}" already exists`, 409, "DUPLICATE");
  }
  Object.assign(doc, payload);
  await doc.save();
  return doc.toObject();
}

export async function deleteItemAttributeDefinition(companyId, id) {
  const doc = await ItemAttributeDefinition.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) throw new AppError("Attribute definition not found", 404, "NOT_FOUND");
  return { deleted: true, id };
}

export async function resolveAttributeOptions(companyId, definition) {
  if (definition.masterDataCategory) {
    const rows = await MasterData.find({
      company: companyId,
      category: definition.masterDataCategory,
      status: "Active",
    })
      .sort({ sequence: 1, label: 1 })
      .lean();
    return rows.map((r) => ({ value: r.value || r.label, label: r.label }));
  }
  return (definition.options || []).map((o) => ({ value: o, label: o }));
}
