import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/purchaseTransaction.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const previewPONo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.previewPurchaseOrderNo(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const listPO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listPurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const listPOReport = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listPurchaseOrderReport(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const listItemWisePOReport = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listItemWisePoReport(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const getPO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getPurchaseOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createPO = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createPurchaseOrder(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updatePO = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updatePurchaseOrder(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deletePO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deletePurchaseOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const approvePO = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.approvePurchaseOrder(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const cancelPO = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.cancelPurchaseOrder(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

function actor(req) {
  return {
    userId: req.appUser?._id || req.user?.sub,
    name: req.appUser?.name || req.appUser?.userName || "",
    userName: req.appUser?.userName || "",
  };
}

export const listAmendablePO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listAmendablePurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const getPOAmendmentHistory = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getPurchaseOrderAmendmentHistory(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const submitPOAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.submitPurchaseOrderAmendment(
    companyId,
    req.params.id,
    req.body ?? {},
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const updatePOAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.updatePurchaseOrderAmendment(
    companyId,
    req.params.id,
    req.body ?? {},
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const approvePOAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.approvePurchaseOrderAmendment(
    companyId,
    req.params.id,
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const listCancellablePO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listCancellablePurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const cancelApprovedPO = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.cancelApprovedPurchaseOrder(
    companyId,
    req.params.id,
    scope,
    actor(req),
    req.body ?? {}
  );
  res.status(200).json({ success: true, data });
});

export const listGRN = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listGoodsReceipts(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const getGRN = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getGoodsReceipt(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createGRN = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createGoodsReceipt(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updateGRN = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updateGoodsReceipt(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const postGRN = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.postGoodsReceipt(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deleteGRN = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deleteGoodsReceipt(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const listPI = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listPurchaseInvoices(companyId, scope);
  res.status(200).json({ success: true, data });
});

export const getPI = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getPurchaseInvoice(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createPI = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createPurchaseInvoice(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updatePI = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updatePurchaseInvoice(companyId, req.params.id, req.body ?? {}, scope, userId);
  res.status(200).json({ success: true, data });
});

export const deletePI = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deletePurchaseInvoice(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});
