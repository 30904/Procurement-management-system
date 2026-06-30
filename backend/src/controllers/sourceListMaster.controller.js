import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listSourceListMasters,
  getSourceListMaster,
  createSourceListMaster,
  updateSourceListMaster,
  deleteSourceListMaster,
  getNextSourceListCode,
} from "../services/sourceListMaster.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await listSourceListMasters(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await getSourceListMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data });
});

export const nextCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const code = await getNextSourceListCode(companyId);
  res.status(200).json({ success: true, data: { sourceListCode: code } });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await createSourceListMaster(companyId, req.body ?? {}, req.appUser?._id);
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await updateSourceListMaster(companyId, req.params.id, req.body ?? {}, req.appUser?._id);
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const result = await deleteSourceListMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});
