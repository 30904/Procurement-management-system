import MenuLucideIcon from "../common/MenuLucideIcon.jsx";

/**
 * Single hub / landing page card (Reports, Masters, Settings groups, etc.)
 */
export default function HubLandingTile({
  label,
  description,
  iconKey,
  variant,
  requiresSuperAdmin,
  disabled,
  disabledHint,
  isRestricted,
  isViewOnly,
  isHidden,
  canClick,
  onActivate,
}) {
  const desc = String(description || "").trim();

  const className = [
    "masters-tile",
    variant === "admin" ? "masters-tile--admin" : "",
    iconKey ? "masters-tile--with-icon" : "masters-tile--text-only",
    disabled ? "masters-tile--disabled" : "",
    isRestricted ? "masters-tile--restricted" : "",
    isViewOnly ? "masters-tile--view-only" : "",
    isHidden ? "masters-tile--hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      onClick={() => canClick && onActivate?.()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && canClick) {
          e.preventDefault();
          onActivate?.();
        }
      }}
      role="button"
      tabIndex={disabled || isRestricted ? -1 : 0}
      aria-disabled={disabled || isRestricted}
      title={desc}
      aria-label={
        disabled && disabledHint
          ? `${label}. ${disabledHint}`
          : isHidden
            ? `${label}. ${desc}. Hidden from other users`
            : isViewOnly
              ? `${label}. ${desc}. View only`
              : `${label}. ${desc}`
      }
    >
      {requiresSuperAdmin && (
        <span className="masters-tile-admin-mark" title="Super Admin only">
          S
        </span>
      )}
      {iconKey ? (
        <MenuLucideIcon iconKey={iconKey} className="masters-tile-icon" strokeWidth={2} />
      ) : null}
      <div className="masters-tile-content">
        <span className="masters-tile-label">{label}</span>
        {desc ? <span className="masters-tile-desc">{desc}</span> : null}
        {(isHidden || (isViewOnly && !isHidden)) && (
          <div className="masters-tile-badges">
            {isHidden && (
              <span
                className="masters-tile-badge masters-tile-badge--hidden"
                title="Hidden from non-admin users"
              >
                Hidden
              </span>
            )}
            {isViewOnly && !isHidden && (
              <span className="masters-tile-badge masters-tile-badge--view">View Only</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
