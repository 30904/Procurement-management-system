import { usePermissions } from "../context/PermissionsContext.jsx";

/**
 * Returns whether the current user has only view access (no edit) for a menu code.
 *
 * @param {string} menuCode - The MenuItem code to check
 * @returns {{ isViewOnly: boolean, canEdit: boolean, canView: boolean, loading: boolean }}
 */
export function useViewOnly(menuCode) {
  const { isSuperAdmin, loading, checkPermission } = usePermissions();

  if (loading) return { isViewOnly: false, canEdit: false, canView: false, loading: true };
  if (isSuperAdmin) return { isViewOnly: false, canEdit: true, canView: true, loading: false };
  if (!menuCode) return { isViewOnly: false, canEdit: true, canView: true, loading: false };

  const perm = checkPermission(menuCode);

  return {
    isViewOnly: perm.view && !perm.edit,
    canEdit: !!perm.edit,
    canView: !!perm.view || !!perm.enabled,
    loading: false,
  };
}
