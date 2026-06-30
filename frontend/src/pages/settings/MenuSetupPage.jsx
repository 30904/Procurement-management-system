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

export default function MenuSetupPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading, refreshPermissions } = usePermissions();
  const user = getAuthUser();
  const { setFooterContent } = useFooter();

  const canAccess =
    isSuperAdmin || String(user?.userType || "").toUpperCase() === "SUPER_ADMIN";

  useEffect(() => {
    setFooterContent(
      "Edit sidebar labels, order, active, and hidden — Save each row. Delete removes the menu and all its module cards."
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
          <span className="erp-breadcrumb-item">Menu Setup</span>
        </h1>
      </header>

      <section className={pageStyles.intro} aria-labelledby="menu-setup-intro">
        <h2 id="menu-setup-intro" className={pageStyles.introTitle}>
          Sidebar menus
        </h2>
        <p className={pageStyles.introText}>
          Use <strong>+ Add menu</strong> to create a new sidebar entry (with
          default module cards). Manage order and visibility, then Save each row.
        </p>
      </section>

      <MenuCatalogPanel mode="sidebar" onMenusUpdated={handleMenusUpdated} />
    </div>
  );
}
