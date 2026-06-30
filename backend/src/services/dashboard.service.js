import { User } from "../models/User.model.js";
import { Role } from "../models/Role.model.js";
import {
  DASHBOARD_CATALOG,
  DEFAULT_DASHBOARD_KEY,
  getDashboardMeta,
  isValidDashboardKey,
} from "../config/dashboardCatalog.js";
import { resolveUserRbac } from "./rbac.service.js";

/**
 * Resolve which dashboard variant the user should see (first assigned role wins).
 */
export async function resolveDashboardForUser(userId) {
  const rbac = await resolveUserRbac(userId);
  const user = await User.findById(userId).select({ role: 1 }).lean();
  const roleIds = Array.isArray(user?.role) ? user.role.filter(Boolean) : [];

  if (rbac.isSuperAdmin && !roleIds.length) {
    const key = "purchase";
    return { dashboardKey: key, dashboard: getDashboardMeta(key), roles: rbac.roles };
  }

  if (!roleIds.length) {
    const key = DEFAULT_DASHBOARD_KEY;
    return { dashboardKey: key, dashboard: getDashboardMeta(key), roles: rbac.roles };
  }

  const roles = await Role.find({ _id: { $in: roleIds } })
    .select({ roleCode: 1, roleName: 1, displayRoleName: 1, dashboardKey: 1 })
    .lean();

  const orderMap = new Map(roleIds.map((id, i) => [String(id), i]));
  const sorted = [...roles].sort(
    (a, b) => (orderMap.get(String(a._id)) ?? 99) - (orderMap.get(String(b._id)) ?? 99)
  );

  let key = DEFAULT_DASHBOARD_KEY;
  for (const role of sorted) {
    const candidate = String(role.dashboardKey || "").trim();
    if (isValidDashboardKey(candidate)) {
      key = candidate;
      break;
    }
  }

  return {
    dashboardKey: key,
    dashboard: getDashboardMeta(key),
    roles: sorted.map((r) => ({
      _id: r._id,
      roleCode: r.roleCode,
      roleName: r.roleName,
      displayRoleName: r.displayRoleName,
      dashboardKey: r.dashboardKey || DEFAULT_DASHBOARD_KEY,
    })),
  };
}

export function listDashboardCatalog() {
  return DASHBOARD_CATALOG;
}

export async function listRoleDashboardMappings(companyId) {
  const rows = await Role.find({ company: companyId })
    .sort({ roleCode: 1 })
    .select({
      _id: 1,
      roleCode: 1,
      roleName: 1,
      displayRoleName: 1,
      dashboardKey: 1,
    })
    .lean();

  return rows.map((row) => ({
    ...row,
    dashboardKey: row.dashboardKey || DEFAULT_DASHBOARD_KEY,
    dashboardLabel: getDashboardMeta(row.dashboardKey || DEFAULT_DASHBOARD_KEY)?.label,
  }));
}

export async function updateRoleDashboardMapping(roleId, dashboardKey) {
  if (!isValidDashboardKey(dashboardKey)) {
    throw new Error("Invalid dashboard key");
  }
  const doc = await Role.findByIdAndUpdate(
    roleId,
    { $set: { dashboardKey: String(dashboardKey).trim() } },
    { new: true }
  )
    .select({ _id: 1, roleCode: 1, roleName: 1, displayRoleName: 1, dashboardKey: 1 })
    .lean();

  return doc;
}
