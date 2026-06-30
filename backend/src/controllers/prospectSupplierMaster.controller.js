import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listProspectSuppliers,
  getProspectSupplier,
  createProspectSupplier,
  updateProspectSupplier,
  deleteProspectSupplier,
  previewRegistrationNo,
  convertProspectToSupplier,
} from "../services/prospectSupplierMaster.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await listProspectSuppliers(companyId);
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await getProspectSupplier(companyId, req.params.id);
  res.status(200).json({ success: true, data: doc });
});

export const previewRegistration = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await previewRegistrationNo(companyId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await createProspectSupplier(companyId, req.body ?? {}, req.appUser?._id);
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await updateProspectSupplier(companyId, req.params.id, req.body ?? {}, req.appUser?._id);
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const result = await deleteProspectSupplier(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const convertToSupplier = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const result = await convertProspectToSupplier(companyId, req.params.id, req.appUser?._id);
  res.status(200).json({ success: true, data: result });
});
