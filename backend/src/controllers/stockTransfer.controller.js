import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import * as svc from "../services/stockTransfer.service.js";
import { listStockBalances } from "../services/stock.service.js";
import { applyLocationFilter } from "../utils/locationScope.js";

function ctx(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return {
    companyId,
    scope: req.locationScope,
    userId: req.appUser?._id || req.user?.sub,
  };
}

export const list = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  res.status(200).json({ success: true, data: await svc.listStockTransfers(companyId, scope) });
});

export const getOne = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  res.status(200).json({
    success: true,
    data: await svc.getStockTransfer(companyId, req.params.id, scope),
  });
});

export const create = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  res.status(201).json({
    success: true,
    data: await svc.createStockTransfer(companyId, req.body ?? {}, scope, userId),
  });
});

export const complete = asyncHandler(async (req, res) => {
  const { companyId, scope, userId } = ctx(req);
  res.status(200).json({
    success: true,
    data: await svc.completeStockTransfer(companyId, req.params.id, scope, userId),
  });
});

export const remove = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  res.status(200).json({
    success: true,
    data: await svc.deleteStockTransfer(companyId, req.params.id, scope),
  });
});

export const listBalances = asyncHandler(async (req, res) => {
  const { companyId, scope } = ctx(req);
  const filter = applyLocationFilter({}, scope);
  if (req.query.inventoryStoreId) filter.inventoryStoreId = req.query.inventoryStoreId;
  if (req.query.itemId) filter.itemId = req.query.itemId;
  const data = await listStockBalances(companyId, filter);
  res.status(200).json({ success: true, data });
});
