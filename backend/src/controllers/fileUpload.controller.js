import { asyncHandler } from "../middleware/asyncHandler.js";
import * as svc from "../services/fileUpload.service.js";

export const getCategories = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: svc.listCategories() });
});

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const { category, description, entityType, entityId, documentTypeCode } = req.body || {};
  const doc = await svc.uploadFile(req.file, {
    category: category || "general",
    description: description || "",
    entityType: entityType || "",
    entityId: entityId || null,
    documentTypeCode: documentTypeCode || "",
    company: req.user?.company,
    userId: req.user?.sub,
    userName: req.body?.userName || "",
  });

  res.status(201).json({ success: true, data: doc });
});

export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: "No files uploaded" });
  }

  const { category, description, entityType, entityId } = req.body || {};
  const results = [];

  for (const file of req.files) {
    try {
      const doc = await svc.uploadFile(file, {
        category: category || "general",
        description: description || "",
        entityType: entityType || "",
        entityId: entityId || null,
        company: req.user?.company,
        userId: req.user?.sub,
        userName: req.body?.userName || "",
      });
      results.push({ success: true, data: doc });
    } catch (err) {
      results.push({ success: false, originalName: file.originalname, error: err.message });
    }
  }

  res.status(201).json({ success: true, data: results });
});

export const list = asyncHandler(async (req, res) => {
  const { category, entityType, entityId, documentTypeCode, page, limit, search } = req.query;
  const result = await svc.listFiles({
    company: req.user?.company,
    category,
    entityType,
    entityId,
    documentTypeCode,
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    search,
  });
  res.json({ success: true, ...result });
});

export const getOne = asyncHandler(async (req, res) => {
  const doc = await svc.getFileById(req.params.id);
  res.json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteFile(req.params.id);
  res.json({ success: true, message: "File deleted" });
});
