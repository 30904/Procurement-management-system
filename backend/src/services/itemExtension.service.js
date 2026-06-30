import { FileUpload } from "../models/FileUpload.model.js";
import { ItemMaster } from "../models/ItemMaster.model.js";
import { ItemDocumentType } from "../models/ItemDocumentType.model.js";
import { ItemAttributeDefinition } from "../models/ItemAttributeDefinition.model.js";
import { ItemAttributeValue } from "../models/ItemAttributeValue.model.js";
import { AppError } from "../utils/AppError.js";
import { filterApplicable, isMandatory } from "../utils/itemConfigRules.js";
import { resolveAttributeOptions } from "./itemAttributeDefinition.service.js";

function isEmptyValue(value, dataType) {
  if (value === null || value === undefined) return true;
  if (dataType === "boolean") return false;
  if (dataType === "multi_select") return !Array.isArray(value) || value.length === 0;
  if (typeof value === "string") return !value.trim();
  return false;
}

function validateAttributeValue(definition, value) {
  const dataType = definition.dataType || "text";
  if (isEmptyValue(value, dataType)) return null;

  if (dataType === "number" || dataType === "decimal") {
    const n = Number(value);
    if (Number.isNaN(n)) throw new AppError(`${definition.label} must be a number`, 400, "VALIDATION_ERROR");
    if (definition.min != null && n < definition.min) {
      throw new AppError(`${definition.label} must be at least ${definition.min}`, 400, "VALIDATION_ERROR");
    }
    if (definition.max != null && n > definition.max) {
      throw new AppError(`${definition.label} must be at most ${definition.max}`, 400, "VALIDATION_ERROR");
    }
    return dataType === "decimal" ? n : Math.round(n);
  }

  if (dataType === "boolean") {
    return Boolean(value);
  }

  if (dataType === "date") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new AppError(`${definition.label} must be a valid date`, 400, "VALIDATION_ERROR");
    return d.toISOString().slice(0, 10);
  }

  if (dataType === "multi_select") {
    return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
  }

  const str = String(value).trim();
  if (definition.regex) {
    const re = new RegExp(definition.regex);
    if (!re.test(str)) throw new AppError(`${definition.label} format is invalid`, 400, "VALIDATION_ERROR");
  }
  return str;
}

export async function getApplicableConfig(companyId, itemCategory) {
  const [docTypes, attrDefs] = await Promise.all([
    ItemDocumentType.find({ company: companyId, status: "Active" }).sort({ sequence: 1, label: 1 }).lean(),
    ItemAttributeDefinition.find({ company: companyId, status: "Active" }).sort({ sequence: 1, label: 1 }).lean(),
  ]);

  const applicableDocTypes = filterApplicable(docTypes, itemCategory);
  const applicableAttrDefs = filterApplicable(attrDefs, itemCategory);

  const attrDefsWithOptions = await Promise.all(
    applicableAttrDefs.map(async (def) => ({
      ...def,
      resolvedOptions: await resolveAttributeOptions(companyId, def),
    }))
  );

  return {
    documentTypes: applicableDocTypes,
    attributeDefinitions: attrDefsWithOptions,
  };
}

export async function listItemAttributeValues(companyId, itemId) {
  const item = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!item) throw new AppError("Item record not found", 404, "NOT_FOUND");

  const values = await ItemAttributeValue.find({ company: companyId, itemId }).lean();
  const map = {};
  values.forEach((v) => {
    map[v.attributeCode] = v.value;
  });
  return { itemId, values: map, rows: values };
}

export async function saveItemAttributeValues(companyId, itemId, valuesInput = {}) {
  const item = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!item) throw new AppError("Item record not found", 404, "NOT_FOUND");

  const defs = filterApplicable(
    await ItemAttributeDefinition.find({ company: companyId, status: "Active" }).lean(),
    item.itemCategory
  );
  const defMap = new Map(defs.map((d) => [d.code, d]));

  for (const [code, raw] of Object.entries(valuesInput || {})) {
    const def = defMap.get(code);
    if (!def) continue;
    const value = validateAttributeValue(def, raw);
    if (isEmptyValue(value, def.dataType)) {
      await ItemAttributeValue.deleteOne({ company: companyId, itemId, attributeCode: code });
      continue;
    }
    await ItemAttributeValue.findOneAndUpdate(
      { company: companyId, itemId, attributeCode: code },
      { $set: { company: companyId, itemId, attributeCode: code, value } },
      { upsert: true, new: true }
    );
  }

  return listItemAttributeValues(companyId, itemId);
}

export async function validateItemCompliance(companyId, itemId, itemCategoryOverride) {
  const item = await ItemMaster.findOne({ _id: itemId, company: companyId }).lean();
  if (!item) throw new AppError("Item record not found", 404, "NOT_FOUND");

  const itemCategory = itemCategoryOverride || item.itemCategory;
  const config = await getApplicableConfig(companyId, itemCategory);

  const files = await FileUpload.find({
    company: companyId,
    entityType: "item",
    entityId: itemId,
  }).lean();

  const filesByType = {};
  files.forEach((f) => {
    const code = String(f.documentTypeCode || "").trim();
    if (!code) return;
    if (!filesByType[code]) filesByType[code] = [];
    filesByType[code].push(f);
  });

  const missingDocuments = [];
  for (const dt of config.documentTypes) {
    if (!isMandatory(dt, itemCategory)) continue;
    const count = (filesByType[dt.code] || []).length;
    if (count < 1) {
      missingDocuments.push({ code: dt.code, label: dt.label, required: 1, current: count });
    }
  }

  const valueRows = await ItemAttributeValue.find({ company: companyId, itemId }).lean();
  const valueMap = Object.fromEntries(valueRows.map((r) => [r.attributeCode, r.value]));

  const missingAttributes = [];
  for (const def of config.attributeDefinitions) {
    if (!isMandatory(def, itemCategory)) continue;
    const val = valueMap[def.code];
    if (isEmptyValue(val, def.dataType)) {
      missingAttributes.push({ code: def.code, label: def.label });
    }
  }

  return {
    valid: missingDocuments.length === 0 && missingAttributes.length === 0,
    missingDocuments,
    missingAttributes,
  };
}

export async function assertItemCompliance(companyId, itemId, itemCategoryOverride) {
  const result = await validateItemCompliance(companyId, itemId, itemCategoryOverride);
  if (result.valid) return result;

  const parts = [];
  if (result.missingDocuments.length) {
    parts.push(`Missing documents: ${result.missingDocuments.map((d) => d.label).join(", ")}`);
  }
  if (result.missingAttributes.length) {
    parts.push(`Missing attributes: ${result.missingAttributes.map((a) => a.label).join(", ")}`);
  }
  throw new AppError(parts.join(". "), 400, "ITEM_COMPLIANCE_ERROR", { details: result });
}
