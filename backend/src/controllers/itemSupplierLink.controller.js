import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listItemSupplierLinks,
  listSupplierLinkedItems,
  createItemSupplierLink,
  updateItemSupplierLink,
  deleteItemSupplierLink,
} from "../services/itemSupplierLink.service.js";

function getCompanyId(req) {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  return companyId;
}

export const list = asyncHandler(async (req, res) => {
  const data = await listItemSupplierLinks(getCompanyId(req), req.params.itemId);
  res.status(200).json({ success: true, data });
});

export const listBySupplier = asyncHandler(async (req, res) => {
  const data = await listSupplierLinkedItems(getCompanyId(req), req.params.supplierId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await createItemSupplierLink(getCompanyId(req), req.params.itemId, req.body ?? {}, req.appUser?._id);
  res.status(201).json({ success: true, data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateItemSupplierLink(getCompanyId(req), req.params.itemId, req.params.linkId, req.body ?? {}, req.appUser?._id);
  res.status(200).json({ success: true, data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await deleteItemSupplierLink(getCompanyId(req), req.params.itemId, req.params.linkId);
  res.status(200).json({ success: true, data });
});
