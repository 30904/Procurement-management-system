import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAuthUser, getToken } from "../utils/authStorage.js";
import { getFrameworkSessionRequest } from "../services/api.js";
import { isAdminOrSuperAdmin, isAdminOnlyMenuCode } from "../utils/adminAccess.js";

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(null);
  const [navigation, setNavigation] = useState({
    main: [],
    bottom: [],
    applicationsFlyout: [],
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [roles, setRoles] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setPermissions(null);
      setNavigation({ main: [], bottom: [], applicationsFlyout: [] });
      setIsSuperAdmin(false);
      setRoles([]);
      setDashboard(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      const res = await getFrameworkSessionRequest();
      const data = res?.data;
      const rbac = data?.rbac;
      setIsSuperAdmin(!!rbac?.isSuperAdmin);
      setPermissions(rbac?.permissionsByCode || {});
      setRoles(rbac?.roles || []);
      setDashboard(data?.dashboard || null);
      const nav = data?.navigation || {};
      setNavigation({
        main: nav.main || [],
        bottom: nav.bottom || [],
        applicationsFlyout: nav.applicationsFlyout || [],
      });
      setCompany(data?.company || null);
    } catch (err) {
      console.error("Framework session load error:", err);
      await loadPermissionsLegacy();
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fallback when framework API unavailable (legacy role fetch). */
  const loadPermissionsLegacy = async () => {
    const user = getAuthUser();
    const roleId = Array.isArray(user?.role) ? user.role[0] : user?.role;
    if (!roleId) {
      setPermissions(null);
      setIsSuperAdmin(false);
      return;
    }
    const { getRoleRequest } = await import("../services/api.js");
    const res = await getRoleRequest(roleId);
    const role = res?.data;
    if (!role) return;

    const roleName = String(role.roleName || "").toLowerCase();
    if (roleName === "super admin" || roleName === "super_admin" || roleName === "super_admin") {
      setIsSuperAdmin(true);
      setPermissions({});
      return;
    }

    const permsMap = {};
    (role.permissions || []).forEach((p) => {
      const code = p.businessFunction || String(p.menuItemId || "");
      permsMap[code] = {
        view: !!p.view,
        edit: !!p.edit,
        restricted: !p.view && !p.edit,
      };
    });
    setPermissions(permsMap);
  };

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const checkPermission = (id) => {
    if (isSuperAdmin) return { view: true, edit: true, enabled: true };
    if (loading) return { view: false, edit: false, enabled: false, loading: true };

    if (id === "settings" || isAdminOnlyMenuCode(id)) {
      const allowed = isAdminOrSuperAdmin({ isSuperAdmin, roles });
      return allowed
        ? { view: true, edit: true, enabled: true }
        : { view: false, edit: false, enabled: false };
    }

    if (["dashboard", "applications", "support"].includes(id)) {
      return { view: true, edit: true, enabled: true };
    }

    const p = permissions?.[id];
    if (!p) return { view: false, edit: false, enabled: false };

    const view = !!p.view;
    const edit = !!p.edit;
    const anyAction = Object.keys(p).some(
      (k) => k !== "restricted" && p[k] === true
    );

    return {
      view,
      edit,
      restricted: !view && !edit && anyAction,
      enabled: view || edit || anyAction,
    };
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        navigation,
        company,
        roles,
        dashboard,
        isSuperAdmin,
        loading,
        checkPermission,
        refreshPermissions: loadSession,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
