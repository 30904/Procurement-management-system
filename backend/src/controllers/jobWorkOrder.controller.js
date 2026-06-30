import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/jobWorkOrder.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const previewJwoNo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.previewJobWorkOrderNo(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const listJwo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listJobWorkOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const getJwo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getJobWorkOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createJwo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createJobWorkOrder(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updateJwo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updateJobWorkOrder(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deleteJwo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deleteJobWorkOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const approveJwo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.approveJobWorkOrder(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});
