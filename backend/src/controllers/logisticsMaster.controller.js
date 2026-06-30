import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listLogisticsMasters,
  getLogisticsMaster,
  createLogisticsMaster,
  updateLogisticsMaster,
  deleteLogisticsMaster,
} from "../services/logisticsMaster.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const data = await listLogisticsMasters(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await getLogisticsMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: doc });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await createLogisticsMaster(companyId, req.body ?? {}, req.appUser?._id);
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await updateLogisticsMaster(companyId, req.params.id, req.body ?? {}, {
    userId: req.appUser?._id,
    name: req.appUser?.name,
    userName: req.appUser?.userName,
    userEmail: req.appUser?.userEmail,
  });
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const result = await deleteLogisticsMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});
