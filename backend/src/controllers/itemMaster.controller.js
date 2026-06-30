import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listItemMasters,
  getItemMaster,
  createItemMaster,
  updateItemMaster,
  deleteItemMaster,
} from "../services/itemMaster.service.js";
import {
  buildItemMasterUploadTemplate,
  importItemMasterWorkbook,
} from "../services/itemMasterUpload.service.js";

export const downloadUploadTemplate = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  const buffer = await buildItemMasterUploadTemplate(companyId);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Material_Master_Upload_Template.xlsx"'
  );
  res.send(Buffer.from(buffer));
});

export const uploadItems = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");

  if (!req.file?.buffer?.length) {
    throw new AppError("Please select an Excel file (.xlsx)", 400, "VALIDATION_ERROR");
  }

  const name = String(req.file.originalname || "").toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    throw new AppError("Only Excel files (.xlsx) are supported", 400, "VALIDATION_ERROR");
  }

  const result = await importItemMasterWorkbook(companyId, req.file.buffer, req.appUser?._id);
  res.status(200).json({ success: true, data: result });
});

export const list = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const locationOnly = String(req.query.locationOnly || "") === "1";
  const data = await listItemMasters(companyId, req.locationScope, { locationOnly });
  res.status(200).json({ success: true, data });
});

export const getOne = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await getItemMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: doc });
});

export const create = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await createItemMaster(companyId, req.body ?? {}, req.appUser?._id);
  res.status(201).json({ success: true, data: doc });
});

export const update = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const doc = await updateItemMaster(companyId, req.params.id, req.body ?? {}, {
    userId: req.appUser?._id,
    name: req.appUser?.name,
    userName: req.appUser?.userName,
    userEmail: req.appUser?.userEmail,
  });
  res.status(200).json({ success: true, data: doc });
});

export const remove = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found", 400, "NO_COMPANY");
  const result = await deleteItemMaster(companyId, req.params.id);
  res.status(200).json({ success: true, data: result });
});
