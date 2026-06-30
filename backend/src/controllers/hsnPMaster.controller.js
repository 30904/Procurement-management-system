import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listHsnPMasters,
  createHsnPMaster,
  updateHsnPMaster,
  deleteHsnPMaster,
} from "../services/hsnPMaster.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const data = await listHsnPMasters(companyId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await createHsnPMaster(companyId, req.body ?? {});
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await updateHsnPMaster(companyId, req.params.id, req.body ?? {}, {
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

  const result = await deleteHsnPMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});
