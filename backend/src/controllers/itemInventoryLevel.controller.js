import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as itemInventoryLevelService from "../services/itemInventoryLevel.service.js";

function actorFromReq(req) {
  return {
    userId: req.appUser?._id,
    name: req.appUser?.name || req.appUser?.userName || "",
    userName: req.appUser?.userName || "",
    userEmail: req.appUser?.email || "",
  };
}

function companyIdFromReq(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return companyId;
}

export const list = asyncHandler(async (req, res) => {
  const companyId = companyIdFromReq(req);
  const data = await itemInventoryLevelService.listItemInventoryLevels(companyId, req.query);
  res.status(200).json({ success: true, data });
});

export const statusSummary = asyncHandler(async (req, res) => {
  const companyId = companyIdFromReq(req);
  const data = await itemInventoryLevelService.getItemInventoryLevelStatusSummary(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = companyIdFromReq(req);
  const data = await itemInventoryLevelService.getItemInventoryLevelById(companyId, req.params.id);
  res.status(200).json({ success: true, data });
});

export const preview = asyncHandler(async (req, res) => {
  const data = itemInventoryLevelService.previewItemInventoryLevels(req.body);
  res.status(200).json({ success: true, data });
});

export const save = asyncHandler(async (req, res) => {
  const companyId = companyIdFromReq(req);
  const data = await itemInventoryLevelService.saveItemInventoryLevels(
    companyId,
    req.params.id,
    req.body,
    actorFromReq(req)
  );
  res.status(200).json({ success: true, data });
});

export const saveDualUnit = asyncHandler(async (req, res) => {
  const companyId = companyIdFromReq(req);
  const data = await itemInventoryLevelService.updateItemDualUnit(
    companyId,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data });
});
