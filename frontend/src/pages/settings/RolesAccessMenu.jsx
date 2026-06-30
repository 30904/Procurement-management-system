import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { resolveHubCardIconKey } from "../../config/hubCardIcons.js";
import { canAccessRolesHub } from "../../utils/adminAccess.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/global.css";
import HubLandingTile from "../../components/hub/HubLandingTile.jsx";

const TILES = [
  {
    id: "user-management",
    label: "User Management",
    description: "Create and manage user accounts",
    path: appPath("configuration/roles-access/user-management"),
  },
  {
    id: "access-management",
    label: "Access Management",
    description: "Define roles and access policies",
    path: appPath("configuration/roles-access/access-management"),
  },
  {
    id: "permission-management",
    label: "Permission Management",
    description: "View and edit permission matrix",
    path: appPath("configuration/roles-access/permission-management"),
  },
];

export default function RolesAccessMenu() {
  const navigate = useNavigate();
  const { isSuperAdmin, roles, loading: permsLoading, checkPermission } = usePermissions();

  const canAccess = canAccessRolesHub({ isSuperAdmin, roles, checkPermission });

  if (permsLoading) return null;

  if (!canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Roles & Access</span>
        </h1>
      </header>

      <div className="masters-grid">
        {TILES.map((tile) => (
          <HubLandingTile
            key={tile.id}
            label={tile.label}
            description={tile.description}
            iconKey={resolveHubCardIconKey(tile.id, "roles_access")}
            canClick
            onActivate={() => navigate(tile.path)}
          />
        ))}
      </div>
    </div>
  );
}
