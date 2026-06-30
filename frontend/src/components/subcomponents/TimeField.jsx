import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import "../../styles/subcomponents.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseTime(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return { hour: null, minute: null };
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { hour: null, minute: null };
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return { hour: null, minute: null };
  return { hour, minute };
}

function formatTime(hour, minute) {
  if (hour == null || minute == null) return "";
  return `${pad2(hour)}:${pad2(minute)}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function TimeField({
  label,
  hideLabel,
  required,
  placeholder = "--:--",
  value,
  onChange,
  disabled,
  locked,
  "aria-label": ariaLabel,
}) {
  const noLabel = hideLabel || label == null || label === false;
  const isDisabled = disabled || locked;
  const inputAria =
    (typeof ariaLabel === "string" && ariaLabel) ||
    (!noLabel && typeof label === "string" ? label : undefined);

  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour, setHour] = useState(parsed.hour ?? 0);
  const [minute, setMinute] = useState(parsed.minute ?? 0);

  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const displayText = parsed.hour != null && parsed.minute != null ? formatTime(parsed.hour, parsed.minute) : "";

  useEffect(() => {
    const p = parseTime(value);
    if (p.hour != null) setHour(p.hour);
    if (p.minute != null) setMinute(p.minute);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    function handleOutside(e) {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inPopup = popupRef.current?.contains(e.target);
      if (!inTrigger && !inPopup) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const updatePos = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popupW = Math.max(rect.width, 200);
      const popupH = 220;
      const gap = 6;
      let top = rect.bottom + gap;
      let left = rect.left;
      if (left + popupW > window.innerWidth - 10) left = Math.max(10, window.innerWidth - popupW - 10);
      if (top + popupH > window.innerHeight - 10 && rect.top - popupH - gap > 10) {
        top = rect.top - popupH - gap;
      }
      setPos({ top, left, width: popupW });
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector("[data-selected='true']")
        ?.scrollIntoView({ block: "center" });
      minuteListRef.current
        ?.querySelector("[data-selected='true']")
        ?.scrollIntoView({ block: "center" });
    });
  }, [open, hour, minute]);

  function toggleOpen() {
    if (isDisabled) return;
    setOpen((prev) => !prev);
  }

  function emitSelection(h, m) {
    onChange?.(formatTime(h, m));
    setOpen(false);
  }

  function selectHour(h) {
    setHour(h);
  }

  function selectMinute(m) {
    setMinute(m);
    emitSelection(hour, m);
  }

  const popup =
    open &&
    createPortal(
      <div
        ref={popupRef}
        className="sc-time-popup"
        role="dialog"
        aria-label="Select time"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        <div className="sc-time-popup__columns">
          <div className="sc-time-popup__col">
            <span className="sc-time-popup__col-title">Hour</span>
            <ul ref={hourListRef} className="sc-time-popup__list" role="listbox" aria-label="Hour">
              {HOURS.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    className={`sc-time-popup__item${hour === h ? " sc-time-popup__item--selected" : ""}`}
                    data-selected={hour === h ? "true" : "false"}
                    onClick={() => selectHour(h)}
                  >
                    {pad2(h)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="sc-time-popup__col">
            <span className="sc-time-popup__col-title">Min</span>
            <ul ref={minuteListRef} className="sc-time-popup__list" role="listbox" aria-label="Minute">
              {MINUTES.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    className={`sc-time-popup__item${minute === m ? " sc-time-popup__item--selected" : ""}`}
                    data-selected={minute === m ? "true" : "false"}
                    onClick={() => selectMinute(m)}
                  >
                    {pad2(m)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className={`sc-field${noLabel ? " sc-field--no-label" : ""}`}>
      {!noLabel && <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>}

      <div
        ref={triggerRef}
        className={`sc-date-trigger sc-time-trigger${isDisabled ? " sc-date-trigger--disabled" : ""}${open ? " sc-date-trigger--open" : ""}`}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={inputAria}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <span
          className={`sc-date-trigger__text${displayText ? "" : " sc-date-trigger__placeholder"}`}
        >
          {displayText || placeholder}
        </span>
        <Clock
          className="sc-time-trigger__icon"
          size={18}
          strokeWidth={1.9}
          color="var(--brand-primary, #0f7c94)"
          aria-hidden
        />
      </div>
      {popup}
    </div>
  );
}
