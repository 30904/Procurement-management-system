import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listInventoryStores,
  getStoresByLocation,
  getInventoryStoreById,
  createInventoryStore,
  updateInventoryStore,
  deleteInventoryStore,
} from "../services/inventoryStore.service.js";
import { assertLocationAccess } from "../utils/locationScope.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const locationId = req.query.locationId;
  if (locationId && req.locationScope) {
    assertLocationAccess(req.locationScope, locationId);
  }
  const data = await listInventoryStores(companyId, { locationId });
  res.status(200).json({ success: true, data });
});

export const getById = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await getInventoryStoreById(companyId, req.params.id);
  if (req.locationScope) assertLocationAccess(req.locationScope, data.locationId);
  res.status(200).json({ success: true, data });
});

export const listByLocation = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const locationId = req.params.locationId;
  if (req.locationScope) assertLocationAccess(req.locationScope, locationId);
  const data = await getStoresByLocation(companyId, locationId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  if (req.body?.locationId && req.locationScope) {
    assertLocationAccess(req.locationScope, req.body.locationId);
  }
  const data = await createInventoryStore(companyId, req.body ?? {});
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await updateInventoryStore(companyId, req.params.id, req.body ?? {});
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await deleteInventoryStore(companyId, req.params.id);
  res.status(200).json({ success: true, data });
});
