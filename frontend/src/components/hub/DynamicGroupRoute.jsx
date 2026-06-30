import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getFrameworkLandingRequest } from "../../services/api.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { appPath } from "../../config/navigation.js";
import HubLandingPage from "./HubLandingPage.jsx";

/**
 * Dynamic route for database-driven card_group pages.
 * Fetches all children of a sidebar parent, finds the card_group whose segment
 * ends with the current :groupSlug param, and renders HubLandingPage for it.
 *
 * @param {{ sidebarCode: string, basePath: string }} props
 *   sidebarCode — the sidebar code that owns the groups (e.g. "settings")
 *   basePath    — URL prefix before the slug (e.g. "configuration")
 */
export default function DynamicGroupRoute({ sidebarCode = "settings", basePath = "configuration" }) {
  const { groupSlug } = useParams();
  const { loading: permsLoading, checkPermission, isSuperAdmin } = usePermissions();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const expectedSegment = `${basePath}/${groupSlug}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await getFrameworkLandingRequest(sidebarCode);
        const cards = res?.data?.cards || [];
        const match = cards.find(
          (c) => c.segment === expectedSegment && c.menuType === "card_group"
        );
        if (!cancelled) {
          if (match) {
            setGroupData(match);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sidebarCode, expectedSegment]);

  if (loading || permsLoading) return null;

  if (notFound || !groupData) {
    return <Navigate to={appPath(basePath)} replace />;
  }

  if (!isSuperAdmin) {
    const perm = checkPermission(groupData.code);
    if (!perm?.enabled && !perm?.restricted) {
      return <Navigate to={appPath(basePath)} replace />;
    }
  }

  const showCompanySetupHelp =
    groupSlug === "company-setup" || groupData.code === "company_setup_group";

  return (
    <HubLandingPage
      parentCode={groupData.code}
      backSegment={basePath}
      title={groupData.label}
      showCompanySetupHelp={showCompanySetupHelp}
    />
  );
}
