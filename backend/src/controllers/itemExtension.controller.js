import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/itemExtension.service.js";

export const getApplicableConfig = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const itemCategory = String(req.query.itemCategory ?? "").trim();
  const data = await svc.getApplicableConfig(companyId, itemCategory);
  res.json({ success: true, data });
});

export const getAttributeValues = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.listItemAttributeValues(companyId, req.params.id);
  res.json({ success: true, data });
});

export const saveAttributeValues = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.saveItemAttributeValues(companyId, req.params.id, req.body?.values ?? {});
  res.json({ success: true, data });
});

export const getCompliance = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await svc.validateItemCompliance(companyId, req.params.id);
  res.json({ success: true, data });
});
