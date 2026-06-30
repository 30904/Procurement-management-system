import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listCategories,
  listByCategory,
  listAll,
  getNextSequence,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../services/masterData.service.js";

export const getCategories = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const categories = await listCategories(companyId);
  res.status(200).json({ success: true, data: categories });
});

export const getNextSequenceForCategory = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { category } = req.params;
  const next = await getNextSequence(companyId, category);
  res.status(200).json({ success: true, data: { sequence: next } });
});

export const getByCategory = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { category } = req.params;
  const data = await listByCategory(companyId, category);
  res.status(200).json({ success: true, data });
});

export const getAll = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { category } = req.query;
  const data = category
    ? await listByCategory(companyId, category)
    : await listAll(companyId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const doc = await createEntry(companyId, req.body ?? {});
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { id } = req.params;
  const doc = await updateEntry(companyId, id, req.body ?? {});
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const { id } = req.params;
  const result = await deleteEntry(companyId, id);
  res.status(200).json({ success: true, data: result });
});
