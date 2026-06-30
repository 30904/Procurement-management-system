import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "../../styles/theme.css";

export default function ActionDropdown({ icon, options = [], row, onOpenChange }) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 0, left: 0 });
  const triggerRef        = useRef(null);

  function closeMenu() {
    setOpen(false);
    onOpenChange?.(false);
  }

  /* Close on outside click or Escape */
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) closeMenu();
    }
    function handleKey(e) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown",   handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown",   handleKey);
    };
  }, [open]);

  function handleClick(e) {
    e.stopPropagation();
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top:  rect.bottom + window.scrollY + 4,
      left: rect.left   + window.scrollX + rect.width / 2,
    });
    setOpen((p) => {
      const next = !p;
      onOpenChange?.(next);
      return next;
    });
  }

  const isDisabled = (opt) =>
    typeof opt.disabled === "function" ? Boolean(opt.disabled(row)) : Boolean(opt.disabled);

  function handleOption(opt) {
    if (isDisabled(opt)) return;
    closeMenu();
    opt.onClick?.(row);
  }

  return (
    <span ref={triggerRef} className="im-action-wrap">
      <img
        src={icon}
        alt="Action"
        className={`im-action-icon${open ? " im-action-icon--active" : ""}`}
        onClick={handleClick}
      />

      {open && createPortal(
        <ul
          className="im-action-dropdown"
          style={{ top: pos.top, left: pos.left }}
          role="menu"
        >
          {options.map((opt) => {
            const disabled = isDisabled(opt);
            const toneClass =
              opt.variant === "danger"
                ? " im-action-dropdown__item--danger"
                : opt.variant === "muted"
                  ? " im-action-dropdown__item--muted"
                  : "";
            const disabledClass = disabled ? " im-action-dropdown__item--disabled" : "";
            return (
              <li
                key={opt.label}
                className={`im-action-dropdown__item${toneClass}${disabledClass}`}
                role="menuitem"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleOption(opt);
                }}
              >
                {opt.icon && (
                  <span className="im-action-dropdown__icon" aria-hidden="true">
                    {opt.icon}
                  </span>
                )}
                <span className="im-action-dropdown__label">{opt.label}</span>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </span>
  );
}
