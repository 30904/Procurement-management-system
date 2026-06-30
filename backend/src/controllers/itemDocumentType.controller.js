import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/itemDocumentType.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.listItemDocumentTypes(companyId);
  res.json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.getItemDocumentType(companyId, req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.createItemDocumentType(companyId, req.body ?? {});
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.updateItemDocumentType(companyId, req.params.id, req.body ?? {});
  res.json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.deleteItemDocumentType(companyId, req.params.id);
  res.json({ success: true, data });
});
