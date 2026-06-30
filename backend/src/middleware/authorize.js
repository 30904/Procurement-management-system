import { hasPermission } from "../services/rbac.service.js";

/**
 * Requires authenticated user with RBAC loaded (use after requireAuth + loadRbac).
 */
export function requirePermission(menuCode, action = "view") {
  return (req, res, next) => {
    if (!req.rbac) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
    }

    if (hasPermission(req.rbac, menuCode, action)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission for this action",
      code: "FORBIDDEN",
      menuCode,
      action,
    });
  };
}
