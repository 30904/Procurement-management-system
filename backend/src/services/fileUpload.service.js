import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { FileUpload } from "../models/FileUpload.model.js";
import { AppError } from "../utils/AppError.js";
import { getItemDocumentTypeByCode } from "./itemDocumentType.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, "../../../uploads");

const CATEGORY_CONFIGS = {
  profile_photo: {
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSize: 2 * 1024 * 1024,
    label: "Profile Photo",
  },
  document: {
    allowedTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxSize: 10 * 1024 * 1024,
    label: "Document",
  },
  certificate: {
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10 * 1024 * 1024,
    label: "Certificate",
  },
  spreadsheet: {
    allowedTypes: [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxSize: 5 * 1024 * 1024,
    label: "Spreadsheet",
  },
  general: {
    allowedTypes: [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf",
      "text/csv", "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 10 * 1024 * 1024,
    label: "General",
  },
  item_drawing: {
    allowedTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/octet-stream",
      "model/step",
      "application/acad",
    ],
    maxSize: 25 * 1024 * 1024,
    label: "Item Drawing",
  },
};

export function listCategories() {
  return Object.entries(CATEGORY_CONFIGS).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    allowedTypes: cfg.allowedTypes,
    maxSize: cfg.maxSize,
    maxSizeMB: +(cfg.maxSize / (1024 * 1024)).toFixed(1),
  }));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function uploadFile(
  file,
  {
    category = "general",
    description = "",
    entityType = "",
    entityId = null,
    documentTypeCode = "",
    company,
    userId,
    userName,
  }
) {
  let allowedTypes = (CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general).allowedTypes;
  let maxSize = (CATEGORY_CONFIGS[category] || CATEGORY_CONFIGS.general).maxSize;
  const docTypeCode = String(documentTypeCode ?? "").trim().toUpperCase();

  if (docTypeCode && company) {
    const docType = await getItemDocumentTypeByCode(company, docTypeCode);
    if (!docType) {
      throw new AppError(`Unknown document type "${docTypeCode}"`, 400, "VALIDATION_ERROR");
    }
    allowedTypes = docType.allowedMimeTypes?.length ? docType.allowedMimeTypes : allowedTypes;
    if (entityType === "item" && entityId) {
      const existing = await FileUpload.countDocuments({
        company,
        entityType: "item",
        entityId,
        documentTypeCode: docTypeCode,
      });
      if (existing >= Number(docType.maxFiles || 1)) {
        throw new AppError(`Maximum ${docType.maxFiles} file(s) allowed for ${docType.label}`, 400, "MAX_FILES_EXCEEDED");
      }
    }
    category = category || "item_drawing";
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError(
      `File type "${file.mimetype}" is not allowed. Allowed: ${allowedTypes.join(", ")}`,
      400,
      "INVALID_FILE_TYPE"
    );
  }

  if (file.size > maxSize) {
    throw new AppError(
      `File exceeds maximum size of ${(maxSize / (1024 * 1024)).toFixed(1)} MB`,
      400,
      "FILE_TOO_LARGE"
    );
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const hash = crypto.randomBytes(12).toString("hex");
  const storedName = `${Date.now()}-${hash}${ext}`;
  const subDir = path.join(UPLOADS_ROOT, category);
  ensureDir(subDir);

  const filePath = path.join(subDir, storedName);
  fs.writeFileSync(filePath, file.buffer);

  const relativePath = `${category}/${storedName}`;
  const url = `/api/uploads/${relativePath}`;

  const doc = await FileUpload.create({
    company,
    uploadedBy: userId,
    uploaderName: userName || "",
    originalName: file.originalname,
    storedName,
    mimeType: file.mimetype,
    size: file.size,
    category,
    description,
    path: relativePath,
    url,
    entityType,
    entityId: entityId || null,
    documentTypeCode: docTypeCode,
  });

  return doc.toObject();
}

export async function listFiles({
  company,
  category,
  entityType,
  entityId,
  documentTypeCode,
  page = 1,
  limit = 50,
  search,
}) {
  const filter = {};
  if (company) filter.company = company;
  if (category) filter.category = category;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (documentTypeCode) filter.documentTypeCode = String(documentTypeCode).trim().toUpperCase();
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { uploaderName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    FileUpload.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FileUpload.countDocuments(filter),
  ]);

  return { data: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteFile(id) {
  const doc = await FileUpload.findById(id);
  if (!doc) throw new AppError("File not found", 404, "NOT_FOUND");

  const filePath = path.join(UPLOADS_ROOT, doc.path);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // File may already be gone
  }

  await FileUpload.findByIdAndDelete(id);
  return { deleted: true };
}

export async function getFileById(id) {
  const doc = await FileUpload.findById(id).lean();
  if (!doc) throw new AppError("File not found", 404, "NOT_FOUND");
  return doc;
}
