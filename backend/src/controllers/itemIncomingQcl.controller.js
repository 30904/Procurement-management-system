import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/itemIncomingQcl.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const list = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.listActiveItemsIncomingQcl(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.getItemIncomingQcl(companyId, req.params.itemId);
  res.status(200).json({ success: true, data });
});

export const save = asyncHandler(async (req, res) => {
  const { companyId, userId } = ctx(req);
  const data = await svc.saveItemIncomingQcl(companyId, req.params.itemId, req.body ?? {}, userId);
  res.status(200).json({ success: true, data });
});
