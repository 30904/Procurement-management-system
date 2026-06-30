import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { hubReturnLabel, useHistoryBack } from "../../utils/hubNavigation.js";
import ErpBackButton from "../common/ErpBackButton.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";

/**
 * Standard masters list toolbar — back uses browser history when available.
 */
export default function MasterBreadcrumbToolbar({
  defaultHubReturn = "masters/purchase",
  summaryTitle,
  className = "",
}) {
  const navigate = useNavigate();
  const moduleHub = defaultHubReturn;
  const moduleLabel = hubReturnLabel(moduleHub);
  const goBack = useHistoryBack(moduleHub);
  return (
    <header className={`${styles.toolbar} ${className}`.trim()}>
      <ErpBackButton onClick={goBack} ariaLabel={`Back to ${moduleLabel}`} />
      <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
        <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>
          Masters
        </span>
        <SeparatorIcon className="erp-breadcrumb-sep" />
        <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(moduleHub))}>
          {moduleLabel}
        </span>
        <SeparatorIcon className="erp-breadcrumb-sep" />
        <span className="erp-breadcrumb-item">{summaryTitle}</span>
      </h1>
    </header>
  );
}
