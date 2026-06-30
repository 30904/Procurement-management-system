import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useFooter } from "../context/FooterContext.jsx";
import { useMobileNav } from "../context/MobileNavContext.jsx";
import AppSidebar from "../components/layout/AppSidebar.jsx";
import { getStoredAuth, clearAuth } from "../utils/authStorage.js";
import { useToast } from "../hooks/useToast.js";
import { applyDocumentTitle } from "../utils/documentTitle.js";
import { useAppBranding } from "../context/AppBrandingContext.jsx";
import { appPath } from "../config/navigation.js";
import { usePermissions } from "../context/PermissionsContext.jsx";
import { getCurrentCompanyRequest } from "../services/api.js";
import NotificationBell from "../components/layout/NotificationBell.jsx";
import LocationSwitcher from "../components/layout/LocationSwitcher.jsx";
import AccountIcon from "../assets/account-icon.svg?react";
import AccountActiveIcon from "../assets/account-active.svg?react";
import closeBtnIcon from "../assets/close-btn.svg";

const COMPANY_NAME =
  import.meta.env.VITE_COMPANY_NAME || "Your Company";

export default function AppShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [hoveredSquare, setHoveredSquare] = useState(null);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [companyName, setCompanyName] = useState(COMPANY_NAME);
  const userPanelRef = useRef(null);
  const accountButtonRef = useRef(null);
  const { footerContent, footerBarHidden } = useFooter();
  const { refreshPermissions, company: sessionCompany } = usePermissions();
  const { applicationName } = useAppBranding();
  const { isOpen: mobileNavOpen, toggleNav, closeNav } = useMobileNav();

  useEffect(() => {
    applyDocumentTitle(location.pathname, applicationName);
  }, [location.pathname, applicationName]);

  useEffect(() => {
    closeNav();
  }, [location.pathname, closeNav]);

  useEffect(() => {
    document.body.classList.toggle("erp-mobile-nav-open", mobileNavOpen);
    return () => document.body.classList.remove("erp-mobile-nav-open");
  }, [mobileNavOpen]);

  useEffect(() => {
    const fromSession = String(sessionCompany?.companyName ?? "").trim();
    if (fromSession) {
      setCompanyName(fromSession);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await getCurrentCompanyRequest();
        const fetchedName = String(res?.data?.companyName ?? "").trim();
        if (isMounted && fetchedName) {
          setCompanyName(fetchedName);
        }
      } catch {
        // Keep env/default company label if the company API is unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [sessionCompany?.companyName]);

  const pathNormalized = location.pathname.replace(/\/$/, "");
  const isStandaloneReport =
    pathNormalized === "/app/reports/purchase/purchase-order" ||
    pathNormalized === "/app/reports/purchase/item-wise-po" ||
    pathNormalized === "/app/reports/purchase/service-purchase-order" ||
    /^\/app\/reports\/leads-npd\/quotation-report\/[^/]+\/print$/.test(pathNormalized) ||
    /^\/app\/reports\/purchase\/service-purchase-order\/[^/]+\/print$/.test(pathNormalized) ||
    /^\/app\/purchase\/purchase-order\/generate-po\/[^/]+\/print$/.test(pathNormalized) ||
    /^\/app\/purchase\/purchase-order-domestic\/[^/]+\/print$/.test(pathNormalized) ||
    /^\/app\/purchase\/purchase-order-import\/[^/]+\/print$/.test(pathNormalized) ||
    /^\/app\/purchase\/service-po\/generate-spo\/[^/]+\/print$/.test(pathNormalized) ||
    pathNormalized === "/app/maintenance/preventive-maintenance/pm-schedule-individual-assets" ||
    pathNormalized === "/app/maintenance/preventive-maintenance/pm-log-entry-individual-assets" ||
    pathNormalized === "/app/maintenance/preventive-maintenance/pm-line-schedule" ||
    pathNormalized === "/app/maintenance/preventive-maintenance/pm-line-log-entry" ||
    pathNormalized === "/app/maintenance/preventive-maintenance/pm-line-compliance-report";
  const isGenericMenuHub = /^\/app\/menu-\d+$/.test(pathNormalized);
  const noFooter =
    location.pathname === "/app/dashboard" ||
    location.pathname === "/app" ||
    location.pathname === "/app/" ||
    isGenericMenuHub ||
    location.pathname === "/app/masters" ||
    location.pathname === "/app/configuration" ||
    location.pathname.includes("/app/configuration/roles-access/module-management");


  const user = getStoredAuth()?.user;
  const displayName = user?.name || user?.userEmail || user?.email || "User";
  const userUid = user?.userCode || user?.userName || user?.email || "—";
  const userMail = user?.userEmail || user?.email || "—";

  const handleLogout = useCallback(() => {
    setAccountPanelOpen(false);
    clearAuth();
    if (refreshPermissions) refreshPermissions();
    toast.success("You have been signed out.");
    navigate("/login", { replace: true });
  }, [navigate, toast, refreshPermissions]);

  const [notifActive, setNotifActive] = useState(false);

  const isAccountActive = hoveredSquare === "account" || accountPanelOpen;

  useEffect(() => {
    if (!accountPanelOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAccountPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [accountPanelOpen]);

  useEffect(() => {
    if (!accountPanelOpen) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (userPanelRef.current?.contains(t)) return;
      if (accountButtonRef.current?.contains(t)) return;
      setAccountPanelOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountPanelOpen]);

  if (isStandaloneReport) {
    return (
      <div className="erp-standalone-report">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="erp-layout">
      {mobileNavOpen ? (
        <button
          type="button"
          className="erp-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeNav}
        />
      ) : null}

      {/* Zone 1 : Sidebar */}
      <AppSidebar mobileOpen={mobileNavOpen} onNavigate={closeNav} />

      {/* Zone 2 : Header */}
      <header className="erp-header">
        <div className="erp-header-left">
          <button
            type="button"
            className="erp-mobile-menu-btn"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={toggleNav}
          >
            <Menu size={24} strokeWidth={2} aria-hidden />
          </button>
          <span className="erp-company-name">{companyName}</span>
          <LocationSwitcher />
        </div>

        <div className="erp-header-squares">
          <NotificationBell
            isActive={notifActive || hoveredSquare === "notification"}
            onActiveChange={(v) => {
              setNotifActive(v);
              if (v) setAccountPanelOpen(false);
            }}
          />
          <button
            ref={accountButtonRef}
            type="button"
            className={`erp-header-square${isAccountActive ? " erp-header-square--active" : ""}`}
            aria-label="Account"
            aria-expanded={accountPanelOpen}
            onClick={() => {
              setAccountPanelOpen((o) => !o);
              setNotifActive(false);
            }}
            onMouseEnter={() => setHoveredSquare("account")}
            onMouseLeave={() => setHoveredSquare(null)}
            onFocus={() => setHoveredSquare("account")}
            onBlur={() => setHoveredSquare(null)}
          >
            {isAccountActive
              ? <AccountActiveIcon className="erp-square-icon" aria-hidden />
              : <AccountIcon className="erp-square-icon" aria-hidden />
            }
          </button>
        </div>
      </header>

      {accountPanelOpen &&
        createPortal(
          <div
            ref={userPanelRef}
            className="erp-user-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="erp-user-panel-title"
          >
            <button
              type="button"
              className="erp-user-panel__close"
              aria-label="Close"
              onClick={() => setAccountPanelOpen(false)}
            >
              <img src={closeBtnIcon} alt="" />
            </button>
            <div className="erp-user-panel__head">
              <div className="erp-user-panel__avatar-box">
                <AccountIcon className="erp-user-panel__avatar" />
              </div>
              <div className="erp-user-panel__meta">
                <p id="erp-user-panel-title" className="erp-user-panel__name">
                  {displayName}
                </p>
                <p className="erp-user-panel__line">
                  <span className="erp-user-panel__label">UID :</span>{" "}
                  <span className="erp-user-panel__value">{userUid}</span>
                </p>
                <p className="erp-user-panel__line">
                  <span className="erp-user-panel__label">Mail :</span>{" "}
                  <span className="erp-user-panel__value">{userMail}</span>
                </p>
              </div>
            </div>
            <div className="erp-user-panel__sep" />
            <button
              type="button"
              className="erp-user-panel__action"
              onClick={() => {
                setAccountPanelOpen(false);
                navigate(appPath("profile"));
              }}
            >
              My Profile
            </button>
            <button
              type="button"
              className="erp-user-panel__action"
              onClick={() => {
                setAccountPanelOpen(false);
                navigate(appPath("configuration"));
              }}
            >
              Settings
            </button>
            <button type="button" className="erp-user-panel__action" onClick={handleLogout}>
              Sign out
            </button>
          </div>,
          document.body
        )}

      {/* Zone 3 : Main area */}
      <div className="erp-main">
        <div className="erp-content slim-scrollbar">
          <Outlet />
        </div>

        {!noFooter && !footerBarHidden && (
          <div className="erp-footer">
            {typeof footerContent === "string" || typeof footerContent === "number" ? (
              <span className="erp-footer-records">{footerContent}</span>
            ) : (
              footerContent
            )}
          </div>
        )}
      </div>
    </div>
  );
}
