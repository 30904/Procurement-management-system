import { User } from "../models/User.model.js";
import { Role } from "../models/Role.model.js";
import { MenuItem } from "../models/MenuItem.model.js";
import { AppError } from "../utils/AppError.js";
import { isAdminOnlyMenuCode } from "../config/adminOnlyMenus.js";

const SUPER_ADMIN_NAMES = new Set([
  "super admin",
  "super_admin",
  "superadmin",
]);

function normalizeRoleName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isAdminRole(role) {
  return normalizeRoleName(role?.roleName) === "admin";
}

function isSuperAdminRole(role) {
  const n = normalizeRoleName(role?.roleName);
  return SUPER_ADMIN_NAMES.has(n) || n === "super_admin";
}

/** Super Admin or users with the Admin role. */
export function isAdminOrSuperAdmin(rbac) {
  if (rbac?.isSuperAdmin) return true;
  return (rbac?.roles || []).some(isAdminRole);
}

function emptyPermissionFlags() {
  return {
    view: false,
    edit: false,
    create: false,
    approve: false,
    cancel: false,
    delete: false,
    reportGenerated: false,
    acknowledgment: false,
    download: false,
  };
}

function settingsPermission(row, allowed) {
  return {
    ...row,
    permission: {
      view: allowed,
      edit: allowed,
      enabled: allowed,
      restricted: !allowed,
    },
  };
}

function mergePermissionFlags(target, source) {
  for (const key of Object.keys(emptyPermissionFlags())) {
    target[key] = !!(target[key] || source[key]);
  }
}

/**
 * Resolves RBAC for a user: roles, permission map keyed by menu code.
 */
export async function resolveUserRbac(userId) {
  const user = await User.findById(userId)
    .select({ company: 1, role: 1, userType: 1, isActive: 1 })
    .lean();

  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  if (user.isActive === false) {
    throw new AppError("Account is deactivated", 403, "ACCOUNT_INACTIVE");
  }

  const roleIds = Array.isArray(user.role) ? user.role.filter(Boolean) : [];
  const roles =
    roleIds.length > 0
      ? await Role.find({ _id: { $in: roleIds } }).lean()
      : [];

  const isSuperAdmin =
    String(user.userType || "").toUpperCase() === "SUPER_ADMIN" ||
    roles.some(isSuperAdminRole);

  const permissionsByCode = {};

  if (!isSuperAdmin) {
    for (const role of roles) {
      for (const perm of role.permissions || []) {
        const code =
          perm.businessFunction ||
          (perm.menuItemId ? String(perm.menuItemId) : "");
        if (!code) continue;
        if (!permissionsByCode[code]) {
          permissionsByCode[code] = emptyPermissionFlags();
        }
        mergePermissionFlags(permissionsByCode[code], perm);
      }
    }
  }

  return {
    userId: user._id,
    companyId: user.company,
    roleIds,
    roles: roles.map((r) => ({
      _id: r._id,
      roleCode: r.roleCode,
      roleName: r.roleName,
      displayRoleName: r.displayRoleName,
    })),
    isSuperAdmin,
    permissionsByCode,
  };
}

/**
 * Checks whether user has a given action on a menu code.
 */
export function hasPermission(rbac, menuCode, action = "view") {
  if (!menuCode) return false;
  if (rbac?.isSuperAdmin) return true;
  if (menuCode === "settings" || isAdminOnlyMenuCode(menuCode)) {
    return isAdminOrSuperAdmin(rbac);
  }
  const flags = rbac?.permissionsByCode?.[menuCode];
  if (!flags) return false;
  return !!flags[action];
}

/**
 * Enriches menu rows with effective permission flags for the current user.
 */
export function attachMenuPermissions(menuRows, rbac) {
  return menuRows.map((row) => {
    const code = row.code;
    const essential = !!row.isEssential;
    const superOnly = !!row.requiresSuperAdmin;

    if (code === "settings" || row.requiresAdmin || isAdminOnlyMenuCode(code)) {
      return settingsPermission(row, isAdminOrSuperAdmin(rbac));
    }

    if (rbac.isSuperAdmin) {
      return {
        ...row,
        permission: {
          view: true,
          edit: true,
          enabled: true,
          restricted: false,
        },
      };
    }

    if (essential) {
      return {
        ...row,
        permission: {
          view: true,
          edit: true,
          enabled: true,
          restricted: false,
        },
      };
    }

    if (superOnly) {
      const allowed =
        rbac.isSuperAdmin ||
        String(rbac?.userType || "").toUpperCase() === "SUPER_ADMIN";
      return {
        ...row,
        permission: {
          view: allowed,
          edit: allowed,
          enabled: allowed,
          restricted: !allowed,
        },
      };
    }

    const flags = rbac.permissionsByCode[code] || emptyPermissionFlags();
    const view = !!flags.view;
    const edit = !!flags.edit;
    const anyAction = Object.values(flags).some(Boolean);

    return {
      ...row,
      permission: {
        view,
        edit,
        enabled: view || edit || anyAction,
        restricted: !view && !edit && anyAction,
        ...flags,
      },
    };
  });
}

/**
 * Loads all menu catalog entries for a company (admin).
 */
export async function listCompanyMenuCatalog(companyId) {
  return MenuItem.find({ company: companyId })
    .sort({ menuType: 1, parentCode: 1, sequence: 1, label: 1 })
    .lean();
}
