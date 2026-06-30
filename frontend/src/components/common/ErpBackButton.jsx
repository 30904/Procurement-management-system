import BackIcon from "../../assets/back.svg?react";
import BackHoveredIcon from "../../assets/back-hovered.svg?react";

/**
 * Standard ERP back control — outlined default, filled on hover only.
 * Blurs on click so hover/focus does not stick after navigation.
 */
export default function ErpBackButton({
  onClick,
  ariaLabel = "Back",
  className = "",
  type = "button",
  ...rest
}) {
  const handleClick = (e) => {
    e.currentTarget.blur();
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={`erp-back-btn ${className}`.trim()}
      onClick={handleClick}
      aria-label={ariaLabel}
      {...rest}
    >
      <BackIcon className="erp-back-icon erp-back-icon--default" aria-hidden />
      <BackHoveredIcon className="erp-back-icon erp-back-icon--hover" aria-hidden />
    </button>
  );
}
