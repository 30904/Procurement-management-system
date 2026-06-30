import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { getAuthUser } from "../../utils/authStorage.js";
import { useFooter } from "../../context/FooterContext.jsx";
import MenuCatalogPanel from "../../components/settings/MenuCatalogPanel.jsx";
import layoutStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ApplicationSetupPage.module.css";

export default function GroupsSetupPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading, refreshPermissions } = usePermissions();
  const user = getAuthUser();
  const { setFooterContent } = useFooter();

  const canAccess =
    isSuperAdmin || String(user?.userType || "").toUpperCase() === "SUPER_ADMIN";

  useEffect(() => {
    setFooterContent(
      "Create card groups under any sidebar menu. Groups act as navigational containers for module cards."
    );
    return () => setFooterContent(null);
  }, [setFooterContent]);

  const handleMenusUpdated = async () => {
    if (refreshPermissions) await refreshPermissions();
  };

  if (!loading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (loading) return null;

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-item">Groups Setup</span>
        </h1>
      </header>

      <section className={pageStyles.intro} aria-labelledby="groups-setup-intro">
        <h2 id="groups-setup-intro" className={pageStyles.introTitle}>
          Card groups catalog
        </h2>
        <p className={pageStyles.introText}>
          Pick a sidebar menu from the dropdown, then create or edit card groups.
          Groups act as containers that organize module cards under collapsible
          sections on the landing page.
        </p>
      </section>

      <MenuCatalogPanel mode="groups" onMenusUpdated={handleMenusUpdated} />
    </div>
  );
}
