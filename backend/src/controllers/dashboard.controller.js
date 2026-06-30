import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  listDashboardCatalog,
  listRoleDashboardMappings,
  resolveDashboardForUser,
  updateRoleDashboardMapping,
} from "../services/dashboard.service.js";
import { isValidDashboardKey } from "../config/dashboardCatalog.js";
import { getPurchaseDashboardStats } from "../services/purchaseDashboard.service.js";
import { getSingletonCompanyId } from "../utils/singleTenant.js";

export const getCatalog = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: listDashboardCatalog() });
});

export const resolveForCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  const data = await resolveDashboardForUser(userId);
  res.status(200).json({ success: true, data });
});

export const listMappings = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
  const companyId = req.rbac.companyId || (await getSingletonCompanyId());
  const data = await listRoleDashboardMappings(companyId);
  res.status(200).json({ success: true, data });
});

export const getPurchaseDashboardStatsHandler = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId || (await getSingletonCompanyId());
  const locationId = req.query?.locationId ? String(req.query.locationId).trim() : "";
  const data = await getPurchaseDashboardStats(companyId, {
    locationId: locationId || undefined,
  });
  res.status(200).json({ success: true, data });
});

export const updateMapping = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
  const { roleId } = req.params;
  const dashboardKey = String(req.body?.dashboardKey ?? "").trim();
  if (!isValidDashboardKey(dashboardKey)) {
    throw new AppError("Invalid dashboard selection", 400, "VALIDATION_ERROR");
  }
  const data = await updateRoleDashboardMapping(roleId, dashboardKey);
  if (!data) {
    throw new AppError("Role not found", 404, "NOT_FOUND");
  }
  res.status(200).json({ success: true, data, message: "Dashboard mapping updated" });
});
