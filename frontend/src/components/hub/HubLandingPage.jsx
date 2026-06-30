import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import {
  hubReturnForChildNavigation,
  resolveHubReturn,
} from "../../utils/hubNavigation.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { getFrameworkLandingRequest } from "../../services/api.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { mergeCompanySetupHubCards } from "../../config/companySetupHubCards.js";
import {
  applyHubLandingCardPolicy,
  shouldShowSuperAdminHiddenChrome,
} from "../../config/hubLandingCardPolicy.js";
import { resolveHubCardIconKey } from "../../config/hubCardIcons.js";
import ErpBackButton from "../common/ErpBackButton.jsx";
import HubLandingTile from "./HubLandingTile.jsx";
import PageTitleHelpButton from "../common/PageTitleHelpButton.jsx";
import CompanySetupHelpModal from "../help/CompanySetupHelpModal.jsx";
import styles from "../../styles/page-toolbar.module.css";

/**
 * Database-driven hub landing page (tile grid).
 * @param {{ parentCode: string, backSegment?: string, title?: string, showCompanySetupHelp?: boolean }} props
 */
export default function HubLandingPage({
  parentCode,
  backSegment = "dashboard",
  title,
  showCompanySetupHelp = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: permsLoading, checkPermission, isSuperAdmin, roles } = usePermissions();

  const hubReturnPath = useMemo(
    () => resolveHubReturn({ parentCode, backSegment, locationState: location.state }),
    [parentCode, backSegment, location.state]
  );
  const childHubReturn = useMemo(
    () => hubReturnForChildNavigation(parentCode, backSegment, location.state),
    [parentCode, backSegment, location.state]
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFrameworkLandingRequest(parentCode);
        if (!cancelled) setData(res?.data ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load menu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentCode]);

  const pageTitle = title || data?.parent?.label || "Menu";

  if (loading || permsLoading) return null;
  if (error) {
    return (
      <div className={`erp-page ${styles.page}`}>
        <p>{error}</p>
      </div>
    );
  }

  let cards = (data?.cards || []).filter(
    (card) => parentCode !== "masters" || card.code !== "masters_dashboard"
  );
  if (parentCode === "company_setup_group") {
    cards = mergeCompanySetupHubCards(cards, checkPermission, isSuperAdmin);
  }
  cards = applyHubLandingCardPolicy(cards, { isSuperAdmin, roles });
  const gridClass =
    cards.length <= 2 ? "masters-grid masters-grid--pair" : "masters-grid";

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton
          onClick={() => navigate(appPath(location.state?.hubReturn || backSegment))}
          ariaLabel="Back"
        />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${styles.toolbarTitle}`}>
          <span className="erp-breadcrumb-item">{pageTitle}</span>
        </h1>
        {showCompanySetupHelp ? (
          <PageTitleHelpButton
            onClick={() => setHelpOpen(true)}
            className={styles.toolbarHelp}
            label={`Open ${pageTitle} help guide`}
          />
        ) : null}
      </header>

      {showCompanySetupHelp ? (
        <CompanySetupHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      ) : null}
            <div className={gridClass}>
        {cards.map((card) => {
          const p = card.permission || {};
          const disabled = card.disabled === true;
          const isRestricted = p.restricted && !p.view && !p.edit;
          const isViewOnly = p.view && !p.edit && p.enabled;
          const showHiddenChrome = shouldShowSuperAdminHiddenChrome(card, isSuperAdmin);
          const canClick = !disabled && !isRestricted && card.segment;

          return (
            <HubLandingTile
              key={card.code}
              label={card.label}
              description={card.description}
              iconKey={resolveHubCardIconKey(card.code, card.iconKey)}
              variant={showHiddenChrome ? card.variant : ""}
              requiresSuperAdmin={showHiddenChrome && card.requiresSuperAdmin}
              disabled={disabled}
              disabledHint={card.disabledHint}
              isRestricted={isRestricted}
              isViewOnly={isViewOnly}
              isHidden={showHiddenChrome}
              canClick={canClick}
              onActivate={() => {
                const path = appPath(card.segment);
                if (
                  card.segment === "reports/purchase/purchase-order" ||
                  card.segment === "reports/purchase/item-wise-po" ||
                  card.segment === "reports/purchase/service-purchase-order" ||
                  card.segment === "maintenance/preventive-maintenance/pm-schedule-individual-assets" ||
                  card.segment === "maintenance/preventive-maintenance/pm-log-entry-individual-assets" ||
                  card.segment === "maintenance/preventive-maintenance/pm-line-schedule" ||
                  card.segment === "maintenance/preventive-maintenance/pm-line-log-entry" ||
                  card.segment === "maintenance/preventive-maintenance/pm-line-compliance-report"
                ) {
                  openAuthenticatedAppTab(path);
                  return;
                }
                navigate(path, { state: { hubReturn: childHubReturn } });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
