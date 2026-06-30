import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import DropdownIcon from "../../assets/dropdown-icon.svg?react";
import "../../styles/subcomponents.css";

export default function SelectField({
  label,
  hideLabel,
  required,
  options = [],
  value,
  onChange,
  disabled,
  locked,
  allowCreate = false,
  createLabel = "+ Add new entry",
  createPlaceholder = "Type new entry",
  onCreate,
  "aria-label": ariaLabel,
  "data-nav-id": dataNavId,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [highlightIdx, setHighlightIdx] = useState(0);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = value ?? "";

  const selectableOptions = useMemo(() => {
    return options
      .map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lbl = typeof opt === "string" ? opt : opt.label;
        const isDisabled = typeof opt === "object" && opt && opt.disabled;
        return { val, lbl, isDisabled };
      })
      .filter((o) => !o.isDisabled);
  }, [options]);

  function getSelectedLabel() {
    if (selected === "" || selected == null) return "";
    for (const opt of options) {
      const val = typeof opt === "string" ? opt : opt.value;
      if (val === selected) return typeof opt === "string" ? opt : opt.label;
    }
    return String(selected);
  }
  const displayText = getSelectedLabel();

  const selectedSelectableIdx = useMemo(() => {
    const idx = selectableOptions.findIndex((o) => o.val === selected);
    return idx >= 0 ? idx : 0;
  }, [selectableOptions, selected]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inDropdown = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!inTrigger && !inDropdown) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) return;
    setIsAdding(false);
    setNewEntry("");
    setCreating(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHighlightIdx(selectedSelectableIdx);
  }, [open, selectedSelectableIdx]);

  useEffect(() => {
    if (!open) return;
    const el = itemRefs.current[highlightIdx];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlightIdx]);

  function openDropdown() {
    if (disabled || locked) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 2, left: rect.left + window.scrollX, width: rect.width });
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
  }

  function handleSelect(val) {
    onChange?.(val);
    closeDropdown();
  }

  const moveHighlight = useCallback(
    (delta) => {
      if (selectableOptions.length === 0) return;
      setHighlightIdx((prev) => {
        const next = prev + delta;
        if (next < 0) return selectableOptions.length - 1;
        if (next >= selectableOptions.length) return 0;
        return next;
      });
    },
    [selectableOptions.length]
  );

  function handleKeyDown(e) {
    if (disabled || locked) return;

    if (e.key === "Tab") {
      if (open) closeDropdown();
      return;
    }

    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        closeDropdown();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      if (!open) {
        openDropdown();
      } else {
        moveHighlight(1);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      if (!open) {
        openDropdown();
      } else {
        moveHighlight(-1);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (open) {
        const opt = selectableOptions[highlightIdx];
        if (opt) handleSelect(opt.val);
      } else {
        openDropdown();
      }
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (open) closeDropdown();
      else openDropdown();
    }
  }

  async function handleCreate() {
    const name = String(newEntry ?? "").trim();
    if (!name || !onCreate || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(name);
      if (created?.value != null) {
        onChange?.(created.value);
        closeDropdown();
      }
    } finally {
      setCreating(false);
    }
  }

  const isDisabled = disabled || locked;
  const triggerCls = [
    "sc-custom-select",
    open ? "sc-custom-select--open" : "",
    locked ? "sc-custom-select--locked" : "",
    isDisabled ? "sc-custom-select--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const noLabel = hideLabel || label == null || label === false;
  const comboboxLabel =
    typeof ariaLabel === "string" && ariaLabel
      ? ariaLabel
      : !noLabel && label != null && typeof label === "string"
        ? label
        : undefined;

  return (
    <div className={`sc-field${noLabel ? " sc-field--no-label" : ""}`}>
      {!noLabel && <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>}

      <div className="sc-select-wrap">
        <div
          ref={triggerRef}
          className={triggerCls}
          tabIndex={isDisabled ? -1 : 0}
          role="combobox"
          aria-label={comboboxLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          data-nav-id={dataNavId || undefined}
          onClick={() => {
            if (isDisabled) return;
            if (open) closeDropdown();
            else openDropdown();
          }}
          onKeyDown={handleKeyDown}
        >
          <span
            className={`sc-custom-select__value${!selected ? " sc-custom-select__placeholder" : ""}`}
            title={displayText || undefined}
          >
            {displayText || placeholder}
          </span>
          {!locked && (
            <DropdownIcon
              className={`sc-custom-select__arrow${open ? " sc-custom-select__arrow--open" : ""}`}
              aria-hidden="true"
            />
          )}
        </div>

        {open &&
          createPortal(
            <ul
              className={`sc-custom-dropdown${allowCreate ? " dd-settings-type-menu" : ""}`}
              ref={dropdownRef}
              role="listbox"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              onKeyDown={handleKeyDown}
            >
              {options.map((opt) => {
                const val = typeof opt === "string" ? opt : opt.value;
                const lbl = typeof opt === "string" ? opt : opt.label;
                const optDisabled = typeof opt === "object" && opt && opt.disabled;
                const selectableIdx = selectableOptions.findIndex((o) => o.val === val);
                const isHighlighted = open && selectableIdx === highlightIdx;
                const showPersistedSelected = val === selected && !open;
                return (
                  <li
                    key={val}
                    ref={(el) => {
                      if (selectableIdx >= 0) itemRefs.current[selectableIdx] = el;
                    }}
                    className={`sc-custom-dropdown__item${showPersistedSelected ? " sc-custom-dropdown__item--selected" : ""}${
                      isHighlighted ? " sc-custom-dropdown__item--highlight" : ""
                    }${optDisabled ? " sc-custom-dropdown__item--disabled" : ""}`}
                    role="option"
                    aria-selected={val === selected}
                    aria-disabled={optDisabled || undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (optDisabled) return;
                      handleSelect(val);
                    }}
                    onMouseEnter={() => {
                      if (optDisabled || selectableIdx < 0) return;
                      setHighlightIdx(selectableIdx);
                    }}
                  >
                    {lbl}
                  </li>
                );
              })}
              {allowCreate && typeof onCreate === "function" && (
                <li
                  className="sc-custom-dropdown__item dd-settings-type-add-wrap"
                  style={{ padding: isAdding ? 0 : undefined, cursor: "default" }}
                >
                  {isAdding ? (
                    <input
                      type="text"
                      className="dd-settings-type-trigger-input"
                      value={newEntry}
                      placeholder={createPlaceholder}
                      autoFocus
                      disabled={creating}
                      onChange={(e) => setNewEntry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCreate();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setIsAdding(false);
                          setNewEntry("");
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="dd-settings-type-add"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsAdding(true);
                      }}
                    >
                      {createLabel}
                    </button>
                  )}
                </li>
              )}
            </ul>,
            document.body
          )}
      </div>
    </div>
  );
}
