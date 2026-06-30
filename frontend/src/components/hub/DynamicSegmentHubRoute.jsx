import { useParams, Navigate } from "react-router-dom";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { appPath } from "../../config/navigation.js";
import HubLandingPage from "./HubLandingPage.jsx";

/**
 * Hub for sidebar menus whose route is not menu-N (e.g. inventory, custom segments).
 * Resolves parentCode from the session navigation data (no admin API call needed).
 */
export default function DynamicSegmentHubRoute() {
  const { hubSegment } = useParams();
  const { navigation, loading } = usePermissions();

  if (loading) return null;

  const allItems = [
    ...(navigation?.main || []),
    ...(navigation?.bottom || []),
    ...(navigation?.applicationsFlyout || []),
  ];
  const match = allItems.find(
    (item) => item.segment === hubSegment || item.segment === `/${hubSegment}`
  );

  if (!match) {
    return (
      <div className="erp-page">
        <p>Menu not found for route &quot;{hubSegment}&quot;.</p>
      </div>
    );
  }

  const perm = match.permission || {};
  if (!perm.enabled && !match.isEssential) {
    return <Navigate to={appPath("dashboard")} replace />;
  }

  return <HubLandingPage parentCode={match.code} backSegment="dashboard" />;
}
