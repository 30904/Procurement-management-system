import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import MenuLucideIcon from "../common/MenuLucideIcon.jsx";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";

export default function ApplicationsFlyout({ open, items, activeSegment, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const trigger = e.target.closest?.("[data-applications-trigger]");
        if (!trigger) onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onClose]);

  if (!open || !items?.length) return null;

  return (
    <div
      ref={panelRef}
      className="erp-applications-flyout"
      role="menu"
      aria-label="Applications"
    >
      {items.map((item, index) => {
        const perm = item.permission || {};
        const isRestricted = perm.restricted;
        const canNavigate = !isRestricted && !!item.segment;
        const active =
          activeSegment &&
          (activeSegment === item.segment ||
            activeSegment.startsWith(`${item.segment}/`));
        const customIconUrl = item.iconUrl
          ? resolveMenuIconUrl(active ? item.activeIconUrl || item.iconUrl : item.iconUrl)
          : null;
        return (
          <button
            key={item.code}
            type="button"
            role="menuitem"
            className={`erp-applications-flyout-item${active ? " active" : ""}${isRestricted ? " restricted" : ""}${index === items.length - 1 ? " last" : ""}`}
            disabled={isRestricted}
            onClick={() => {
              if (!canNavigate) return;
              navigate(appPath(item.segment));
              onClose();
            }}
          >
            <span className="erp-applications-flyout-icon-wrap">
              {customIconUrl ? (
                <img src={customIconUrl} alt="" className="erp-applications-flyout-icon" />
              ) : (
                <MenuLucideIcon
                  iconKey={item.iconKey}
                  active={active}
                  className="erp-applications-flyout-icon"
                />
              )}
            </span>
            <span className="erp-applications-flyout-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
