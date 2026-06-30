import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DropdownIcon       from "../../assets/dropdown-icon.svg?react";
import "../../styles/subcomponents.css";

const STATUS_OPTIONS = [
  { value: "Active" },
  { value: "Inactive" },
];

export default function StatusField({ label, required, value = "Active", onChange, disabled, locked }) {
  const [current, setCurrent] = useState(value);
  const [open, setOpen]       = useState(false);
  const [pos,  setPos]        = useState({ top: 0, left: 0, width: 0 });
  const triggerRef            = useRef(null);

  const isBlocked = locked || disabled;

  useEffect(() => { setCurrent(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function openDropdown() {
    if (isBlocked) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 2, left: rect.left + window.scrollX, width: rect.width });
    setOpen((p) => !p);
  }

  function handleSelect(val) {
    setCurrent(val);
    onChange?.(val);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDropdown(); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="sc-field">
      <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>

      <div className="sc-select-wrap">
        <div
          ref={triggerRef}
          className={`sc-custom-select sc-status-trigger${open ? " sc-custom-select--open" : ""}${locked ? " sc-custom-select--locked" : ""}${disabled ? " sc-custom-select--disabled" : ""}`}
          tabIndex={isBlocked ? -1 : 0}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={openDropdown}
          onKeyDown={handleKeyDown}
        >
          <span
            className={`sc-status-dot${current === "Inactive" ? " sc-status-dot--inactive" : ""}`}
            aria-hidden="true"
          />
          <span className="sc-custom-select__value">{current}</span>
          <DropdownIcon
            className={`sc-custom-select__arrow${open ? " sc-custom-select__arrow--open" : ""}`}
            aria-hidden="true"
          />
        </div>

        {open && createPortal(
          <ul
            className="sc-custom-dropdown"
            role="listbox"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <li
                key={opt.value}
                className={`sc-custom-dropdown__item sc-custom-dropdown__item--status${opt.value === current ? " sc-custom-dropdown__item--selected" : ""}`}
                role="option"
                aria-selected={opt.value === current}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value); }}
              >
                <span
                  className={`sc-status-dot${opt.value === "Inactive" ? " sc-status-dot--inactive" : ""}`}
                  aria-hidden="true"
                />
                {opt.value}
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
    </div>
  );
}
