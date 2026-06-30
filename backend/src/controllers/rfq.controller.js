import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/rfq.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const previewRfqNo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.previewRfqNo(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const listRfqs = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listRfqs(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const getRfq = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getRfq(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createRfq(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updateRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updateRfq(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deleteRfq = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deleteRfq(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const submitRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.submitRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const openRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.openRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const closeRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.closeRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const awardRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.awardRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const cancelRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.cancelRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const expireRfq = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.expireRfq(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});
