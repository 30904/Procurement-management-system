import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getPoTermsConfig, savePoTermsConfig } from "../services/poTermsConfig.service.js";

export const getConfig = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await getPoTermsConfig(companyId);
  res.status(200).json({ success: true, data });
});

export const saveConfig = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const userId = req.appUser?._id || req.user?.sub;
  const data = await savePoTermsConfig(companyId, req.body ?? {}, userId);
  res.status(200).json({ success: true, data });
});
