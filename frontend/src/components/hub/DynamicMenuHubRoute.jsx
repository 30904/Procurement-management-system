import { useParams } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import HubLandingPage from "./HubLandingPage.jsx";
import NoAccessPage from "../../pages/NoAccessPage.jsx";

/** Resolves /app/menu-:menuNum to parentCode menu_:menuNum with permission check */
export default function DynamicMenuHubRoute() {
  const { menuNum } = useParams();
  const { isSuperAdmin, loading, checkPermission } = usePermissions();
  const parentCode = `menu_${menuNum}`;

  if (loading) return null;

  if (!isSuperAdmin) {
    const perm = checkPermission(parentCode);
    if (!perm.enabled) return <NoAccessPage />;
  }

  return <HubLandingPage parentCode={parentCode} backSegment="dashboard" />;
}
