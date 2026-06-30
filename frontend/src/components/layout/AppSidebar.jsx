import { Fragment, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import MenuLucideIcon from "../common/MenuLucideIcon.jsx";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";
import ApplicationsFlyout from "./ApplicationsFlyout.jsx";
import { useAppBranding } from "../../context/AppBrandingContext.jsx";
import ProcurementBrandMark from "../branding/ProcurementBrandMark.jsx";

const FLYOUT_SEGMENTS = ["hrm", "accounts", "finance"];

export default function AppSidebar({ mobileOpen = false, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigation, loading } = usePermissions();
  const { logos, applicationName, shortName } = useAppBranding();
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const mainItems = navigation?.main || [];
  const bottomItems = navigation?.bottom || [];
  const flyoutItems = useMemo(
    () => navigation?.applicationsFlyout || [],
    [navigation?.applicationsFlyout]
  );

  const activeFlyoutSegment = useMemo(() => {
    const hit = FLYOUT_SEGMENTS.find((seg) => {
      const path = appPath(seg);
      return (
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
      );
    });
    return hit || null;
  }, [location.pathname]);

  const pathMatches = (segment) => {
    if (!segment) return false;
    const path = appPath(segment);
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const isApplicationsActive = () =>
    flyoutOpen || !!activeFlyoutSegment;

  const isFooterItemActive = (item) => {
    if (item.code === "applications") return isApplicationsActive();
    return pathMatches(item.segment);
  };

  const renderMainItem = (item) => {
    const perm = item.permission || {};
    const isNoAccess = !perm.enabled && !item.isEssential;
    const isRestricted = perm.restricted;
    const isViewOnly = perm.view && !perm.edit && perm.enabled && !item.isEssential;
    const active = pathMatches(item.segment);
    const customIconUrl = item.iconUrl
      ? resolveMenuIconUrl(active ? item.activeIconUrl || item.iconUrl : item.iconUrl)
      : null;
    if (isNoAccess) return null;

    const canClick = !isRestricted && !!item.segment;

    return (
      <div
        key={item.code}
        className={`erp-sidebar-item${active ? " active" : ""}${isRestricted ? " restricted" : ""}${isViewOnly ? " view-only" : ""}`}
        onClick={() => {
          if (!canClick) return;
          setFlyoutOpen(false);
          onNavigate?.();
          navigate(appPath(item.segment));
        }}
        title={
          isRestricted
            ? "Access Restricted"
            : isViewOnly
              ? "View Only"
              : item.label
        }
        style={
          isRestricted
            ? {
                opacity: 0.5,
                filter: "grayscale(100%)",
                cursor: "not-allowed",
                pointerEvents: "auto",
              }
            : undefined
        }
      >
        {customIconUrl ? (
          <img src={customIconUrl} alt={item.label} className="erp-sidebar-icon" />
        ) : (
          <MenuLucideIcon
            iconKey={item.iconKey}
            active={active}
            className="erp-sidebar-icon"
          />
        )}
        <span className="erp-sidebar-label">{item.label}</span>
      </div>
    );
  };

  const renderFooterItem = (item) => {
    const perm = item.permission || {};
    const isNoAccess = !perm.enabled && !item.isEssential;
    const isRestricted = perm.restricted;
    const active = isFooterItemActive(item);
    const isApplications = item.code === "applications";
    const customIconUrl = item.iconUrl
      ? resolveMenuIconUrl(active ? item.activeIconUrl || item.iconUrl : item.iconUrl)
      : null;
    const iconKey = isApplications ? "applications" : item.iconKey;
    if (isNoAccess) return null;

    const canClick = !isRestricted && (!!item.segment || isApplications);

    return (
      <button
        key={item.code}
        type="button"
        data-applications-trigger={isApplications ? "true" : undefined}
        className={`erp-sidebar-bottom-item${active ? " active" : ""}${isRestricted ? " restricted" : ""}${isApplications && flyoutOpen ? " flyout-open" : ""}`}
        onClick={() => {
          if (isRestricted) return;
          if (isApplications) {
            setFlyoutOpen((prev) => !prev);
            return;
          }
          if (!item.segment) return;
          setFlyoutOpen(false);
          onNavigate?.();
          navigate(appPath(item.segment));
        }}
        title={item.label}
        aria-label={item.label}
        aria-expanded={isApplications ? flyoutOpen : undefined}
        aria-haspopup={isApplications ? "menu" : undefined}
        aria-current={active && !isApplications ? "page" : undefined}
        disabled={isRestricted}
      >
        {customIconUrl ? (
          <img src={customIconUrl} alt="" className="erp-sidebar-bottom-icon" />
        ) : (
          <MenuLucideIcon
            iconKey={iconKey}
            active={active}
            className="erp-sidebar-bottom-icon"
          />
        )}
      </button>
    );
  };

  const sidebarClass = `erp-sidebar${mobileOpen ? " erp-sidebar--mobile-open" : ""}`;

  if (loading) {
    return (
      <aside className={sidebarClass}>
        <div className="erp-sidebar-accent" />
        <div className="erp-sidebar-inner" />
      </aside>
    );
  }

  return (
    <aside className={sidebarClass}>
      <div className="erp-sidebar-accent" />

      <div className="erp-sidebar-inner">
        <div className="erp-sidebar-logo-slot">
          {logos.sidebar ? (
            <img src={logos.sidebar} alt={applicationName} className="erp-sidebar-logo" />
          ) : (
            <ProcurementBrandMark
              variant="sidebar"
              name={applicationName}
              shortName={shortName}
            />
          )}
        </div>

        <nav className="erp-sidebar-nav">
          {mainItems.map((item) => (
            <Fragment key={item.code}>
              {item.code === "reports" && (
                <div
                  className="erp-sidebar-separator"
                  role="separator"
                  aria-hidden="true"
                />
              )}
              {renderMainItem(item)}
            </Fragment>
          ))}
        </nav>

        <div className="erp-sidebar-bottom">
          <div className="erp-sidebar-bottom-row">
            {bottomItems.map((item) => renderFooterItem(item))}
          </div>
        </div>
      </div>

      <ApplicationsFlyout
        open={flyoutOpen}
        items={flyoutItems}
        activeSegment={activeFlyoutSegment}
        onClose={() => setFlyoutOpen(false)}
      />
    </aside>
  );
}
