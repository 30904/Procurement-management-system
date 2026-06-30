import {
  DEFAULT_ITEM_INCOMING_QCL_LEVELS,
  ITEM_INCOMING_QCL_CATEGORY,
} from "../config/itemIncomingQclLevels.js";
import {
  DEFAULT_INSPECTION_STANDARDS,
  INSPECTION_STANDARD_CATEGORY,
} from "../config/inspectionStandard.js";
import { MasterData } from "../models/MasterData.model.js";
import { AppError } from "../utils/AppError.js";

function parseSequence(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

export async function getNextSequence(companyId, category) {
  const cat = String(category ?? "").trim();
  if (!cat) {
    throw new AppError("Category is required", 400, "VALIDATION_ERROR");
  }
  const maxSeq = await MasterData.findOne({ company: companyId, category: cat })
    .sort({ sequence: -1 })
    .select("sequence")
    .lean();
  return (maxSeq?.sequence ?? 0) + 1;
}

export async function listCategories(companyId) {
  const cats = await MasterData.distinct("category", { company: companyId });
  return cats.sort();
}

export async function ensureItemIncomingQclLevels(companyId) {
  const cat = ITEM_INCOMING_QCL_CATEGORY;
  const existing = await MasterData.countDocuments({ company: companyId, category: cat });
  if (existing > 0) return;

  for (const row of DEFAULT_ITEM_INCOMING_QCL_LEVELS) {
    const label = String(row.label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category: cat, label },
      {
        $set: {
          company: companyId,
          category: cat,
          label,
          value: String(row.value ?? label).trim(),
          description: row.description ?? "",
          sequence: row.sequence ?? 0,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
  }
}

export async function ensureInspectionStandards(companyId) {
  const cat = INSPECTION_STANDARD_CATEGORY;
  const existing = await MasterData.countDocuments({ company: companyId, category: cat });
  if (existing > 0) return;

  for (const row of DEFAULT_INSPECTION_STANDARDS) {
    const label = String(row.label).trim();
    await MasterData.findOneAndUpdate(
      { company: companyId, category: cat, label },
      {
        $set: {
          company: companyId,
          category: cat,
          label,
          value: String(row.value ?? label).trim(),
          description: row.description ?? "",
          sequence: row.sequence ?? 0,
          status: "Active",
        },
      },
      { upsert: true, new: true }
    );
  }
}

export async function listByCategory(companyId, category) {
  const cat = String(category ?? "").trim();
  if (cat === ITEM_INCOMING_QCL_CATEGORY) {
    await ensureItemIncomingQclLevels(companyId);
  }
  if (cat === INSPECTION_STANDARD_CATEGORY) {
    await ensureInspectionStandards(companyId);
  }
  return MasterData.find({ company: companyId, category: cat })
    .sort({ sequence: 1, label: 1 })
    .lean();
}

export async function listAll(companyId) {
  return MasterData.find({ company: companyId })
    .sort({ category: 1, sequence: 1, label: 1 })
    .lean();
}

export async function createEntry(companyId, data) {
  const { category, label, value, description, sequence, status } = data;

  if (!category?.trim()) {
    throw new AppError("Category is required", 400, "VALIDATION_ERROR");
  }
  if (!label?.trim()) {
    throw new AppError("Label is required", 400, "VALIDATION_ERROR");
  }

  const existing = await MasterData.findOne({
    company: companyId,
    category: category.trim(),
    label: label.trim(),
  });
  if (existing) {
    throw new AppError(
      `Entry "${label}" already exists in category "${category}"`,
      409,
      "DUPLICATE"
    );
  }

  const maxSeq = await MasterData.findOne({
    company: companyId,
    category: category.trim(),
  })
    .sort({ sequence: -1 })
    .select("sequence")
    .lean();

  const nextSeq = (maxSeq?.sequence ?? 0) + 1;
  const doc = await MasterData.create({
    company: companyId,
    category: category.trim(),
    label: label.trim(),
    value: (value ?? label).trim(),
    description: (description ?? "").trim(),
    sequence:
      sequence !== undefined && sequence !== null && sequence !== ""
        ? parseSequence(sequence, nextSeq)
        : nextSeq,
    status: status || "Active",
  });

  return doc.toObject();
}

export async function updateEntry(companyId, id, data) {
  const doc = await MasterData.findOne({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Master data entry not found", 404, "NOT_FOUND");
  }

  const allowed = ["label", "value", "description", "status", "category"];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      doc[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
    }
  }
  if (data.sequence !== undefined) {
    doc.sequence = parseSequence(data.sequence, doc.sequence ?? 0);
  }

  await doc.save();
  return doc.toObject();
}

export async function deleteEntry(companyId, id) {
  const doc = await MasterData.findOneAndDelete({ _id: id, company: companyId });
  if (!doc) {
    throw new AppError("Master data entry not found", 404, "NOT_FOUND");
  }
  return { deleted: true, id };
}
