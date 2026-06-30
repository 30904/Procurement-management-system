import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/servicePurchaseOrder.service.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const previewSpoNo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const category = req.query.serviceCategory === "Import" ? "Import" : "Domestic";
  const data = await svc.previewServicePurchaseOrderNo(companyId, scope, category);
  res.status(200).json({ success: true, data });
});

export const listServicesForSpo = asyncHandler(async (req, res) => {
  const { companyId } = ctx(req);
  const data = await svc.listActiveServicesForSpo(companyId);
  res.status(200).json({ success: true, data });
});

export const listSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listServicePurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const listSpoReport = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listServicePurchaseOrderReport(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const getSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getServicePurchaseOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const createSpo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.createServicePurchaseOrder(companyId, req.body ?? {}, scope, userId);
  res.status(201).json({ success: true, data });
});

export const updateSpo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.updateServicePurchaseOrder(
    companyId,
    req.params.id,
    req.body ?? {},
    scope,
    userId
  );
  res.status(200).json({ success: true, data });
});

export const deleteSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.deleteServicePurchaseOrder(companyId, req.params.id, scope);
  res.status(200).json({ success: true, data });
});

export const approveSpo = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  const data = await svc.approveServicePurchaseOrder(companyId, req.params.id, scope, userId);
  res.status(200).json({ success: true, data });
});

function actor(req) {
  return {
    userId: req.appUser?._id || req.user?.sub,
    name: req.appUser?.name || req.appUser?.userName || "",
    userName: req.appUser?.userName || "",
  };
}

export const listAmendableSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listAmendableServicePurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const listCancellableSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.listCancellableServicePurchaseOrders(companyId, scope, req.query);
  res.status(200).json({ success: true, data });
});

export const getSpoAmendmentHistory = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.getServicePurchaseOrderAmendmentHistory(
    companyId,
    req.params.id,
    scope
  );
  res.status(200).json({ success: true, data });
});

export const submitSpoAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.submitServicePurchaseOrderAmendment(
    companyId,
    req.params.id,
    req.body ?? {},
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const updateSpoAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.updateServicePurchaseOrderAmendment(
    companyId,
    req.params.id,
    req.body ?? {},
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const approveSpoAmendment = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.approveServicePurchaseOrderAmendment(
    companyId,
    req.params.id,
    scope,
    actor(req)
  );
  res.status(200).json({ success: true, data });
});

export const cancelApprovedSpo = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const data = await svc.cancelApprovedServicePurchaseOrder(
    companyId,
    req.params.id,
    scope,
    actor(req),
    req.body ?? {}
  );
  res.status(200).json({ success: true, data });
});
