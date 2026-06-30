import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listPaymentTermsMasters,
  createPaymentTermsMaster,
  updatePaymentTermsMaster,
  deletePaymentTermsMaster,
  getNextPaymentTermsCode,
} from "../services/paymentTermsMaster.service.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const data = await listPaymentTermsMasters(companyId);
  res.status(200).json({ success: true, data });
});

export const nextCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const code = await getNextPaymentTermsCode(companyId);
  res.status(200).json({ success: true, data: { paymentTermsCode: code } });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await createPaymentTermsMaster(companyId, req.body ?? {});
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await updatePaymentTermsMaster(companyId, req.params.id, req.body ?? {}, {
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

  const result = await deletePaymentTermsMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});
