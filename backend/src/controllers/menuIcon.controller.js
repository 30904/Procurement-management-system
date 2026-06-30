import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listMenuIconsForCompany,
  uploadMenuIcon,
  deleteMenuIcon,
} from "../services/menuIcon.service.js";

function requireSuperAdmin(req) {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
}

export const listMenuIcons = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = req.rbac.companyId;
  const icons = await listMenuIconsForCompany(companyId);
  res.status(200).json({ success: true, data: icons });
});

export const createMenuIcon = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = req.rbac.companyId;
  const doc = await uploadMenuIcon(companyId, req.body, req.files);
  res.status(201).json({
    success: true,
    data: {
      code: doc.code,
      label: doc.label,
      source: "upload",
      iconUrl: doc.iconUrl,
      activeIconUrl: doc.activeIconUrl,
      id: doc._id,
    },
    message: "Icon uploaded successfully",
  });
});

export const removeMenuIcon = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);
  const companyId = req.rbac.companyId;
  const data = await deleteMenuIcon(companyId, req.params.id);
  res.status(200).json({ success: true, data, message: "Icon deleted" });
});
