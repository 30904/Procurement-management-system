import { Navigate } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { appPath } from "../../config/navigation.js";
import { canAccessAdminOnlyMenu, canAccessSettingsHub } from "../../utils/adminAccess.js";
import NoAccessPage from "../../pages/NoAccessPage.jsx";

/**
 * Route-level RBAC guard.
 *
 * @param {{ menuCode: string, requireEdit?: boolean, redirectTo?: string, children: React.ReactNode }} props
 * - menuCode:     MenuItem.code to check (e.g. "menu_1", "roles_access")
 * - requireEdit:  if true, only "full" access may enter
 * - redirectTo:   optional override redirect (defaults to dashboard)
 */
export default function PermissionGuard({
  menuCode,
  requireEdit = false,
  redirectTo,
  children,
}) {
  const { isSuperAdmin, roles, loading, checkPermission } = usePermissions();

  if (loading) return null;

  if (menuCode === "settings") {
    if (!canAccessSettingsHub({ isSuperAdmin, roles, checkPermission })) {
      if (redirectTo) return <Navigate to={redirectTo} replace />;
      return <NoAccessPage />;
    }
    return children;
  }

  if (menuCode && !canAccessAdminOnlyMenu(menuCode, { isSuperAdmin, roles })) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <NoAccessPage />;
  }

  if (isSuperAdmin) return children;

  if (!menuCode) return children;

  const perm = checkPermission(menuCode);

  if (!perm.enabled) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <NoAccessPage />;
  }

  if (requireEdit && !perm.edit) {
    return <NoAccessPage viewOnly />;
  }

  return children;
}
