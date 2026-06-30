import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listAutoIncrements,
  createAutoIncrement,
  updateAutoIncrement,
  deleteAutoIncrement,
  previewNextCode,
  previewNextCodeForScope,
  listAutoIncrementRevisions,
} from "../services/autoIncrement.service.js";
import { resolveSupplierCategoryModule } from "../utils/supplierCategoryModule.js";
import { resolveLogisticsCategoryModule } from "../utils/logisticsCategoryModule.js";
import { resolveItemCategoryModule } from "../utils/itemCategoryModule.js";
import { resolveAssetCategoryModule } from "../utils/assetCategoryModule.js";
import { resolveServiceCategoryModule } from "../utils/serviceCategoryModule.js";

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await listAutoIncrements(companyId);
  res.status(200).json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await createAutoIncrement(companyId, req.body ?? {}, {
    userId: req.appUser?._id || req.user?.sub || null,
    userName: req.appUser?.userName || "",
    ip: req.ip || "",
  });
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await updateAutoIncrement(companyId, req.params.id, req.body ?? {}, {
    userId: req.appUser?._id || req.user?.sub || null,
    userName: req.appUser?.userName || "",
    ip: req.ip || "",
  });
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const result = await deleteAutoIncrement(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const preview = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const { module } = req.params;
  const data = await previewNextCode(companyId, module);
  res.status(200).json({ success: true, data });
});

export const previewScoped = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const { module } = req.params;
  const { locationId } = req.query;
  const data = await previewNextCodeForScope(companyId, module, { locationId });
  res.status(200).json({ success: true, data });
});

export const revisions = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await listAutoIncrementRevisions(companyId, req.params.id, req.query.limit);
  res.status(200).json({ success: true, data });
});

/** Preview supplier code from category (master data value or label). */
export const previewSupplierCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const categoryType = req.query.categoryType ?? req.params.categoryType;
  const moduleKey = await resolveSupplierCategoryModule(companyId, categoryType);
  const data = await previewNextCode(companyId, moduleKey);
  res.status(200).json({ success: true, data });
});

/** Preview logistics code from category (master data value or label). */
export const previewLogisticsCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const categoryType = req.query.categoryType ?? req.params.categoryType;
  const moduleKey = await resolveLogisticsCategoryModule(companyId, categoryType);
  const data = await previewNextCode(companyId, moduleKey);
  res.status(200).json({ success: true, data });
});

/** Preview service code from SER module. */
export const previewServiceCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const data = await previewNextCode(companyId, "SER");
  res.status(200).json({ success: true, data });
});

/** Preview item code from item category (master data value or label). */
export const previewItemCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const categoryType = req.query.categoryType ?? req.params.categoryType;
  const moduleKey = await resolveItemCategoryModule(companyId, categoryType);
  const data = await previewNextCode(companyId, moduleKey);
  res.status(200).json({ success: true, data });
});

/** Preview asset code from asset category (master data value or label). */
/** Preview service R1 ID from service category (master data value or label). */
export const previewServiceR1Code = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const categoryType = req.query.categoryType ?? req.params.categoryType;
  const moduleKey = await resolveServiceCategoryModule(companyId, categoryType);
  const data = await previewNextCode(companyId, moduleKey);
  res.status(200).json({ success: true, data });
});

export const previewAssetCode = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const categoryType = req.query.categoryType ?? req.params.categoryType;
  const moduleKey = await resolveAssetCategoryModule(companyId, categoryType);
  const data = await previewNextCode(companyId, moduleKey);
  res.status(200).json({ success: true, data });
});
