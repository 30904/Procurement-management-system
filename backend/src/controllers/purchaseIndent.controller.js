import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/purchaseIndent.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const previewIndentNo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.previewPurchaseIndentNo(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const listIndents = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listPurchaseIndents(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const listApprovedIndents = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listApprovedPurchaseIndents(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const getIndent = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getPurchaseIndent(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createIndent = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createPurchaseIndent(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updateIndent = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updatePurchaseIndent(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deleteIndent = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deletePurchaseIndent(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const approveIndent = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.approvePurchaseIndent(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const cancelIndent = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.cancelPurchaseIndent(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});
