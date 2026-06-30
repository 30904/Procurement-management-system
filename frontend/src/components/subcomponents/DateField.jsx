import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CalendarIcon from "../../assets/calendar.svg?react";
import "../../styles/subcomponents.css";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function monthNameToIndex(token) {
  if (!token) return -1;
  const key = String(token).trim().toLowerCase().slice(0, 3);
  const map = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  return Number.isInteger(map[key]) ? map[key] : -1;
}

function isValidYmd(y, m, d) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function parseTypedDateInput(raw, type) {
  const text = String(raw || "").trim();
  if (!text) return "";

  if (type === "year") {
    const y = Number(text.replace(/\D/g, ""));
    if (!Number.isFinite(y) || String(Math.floor(y)).length !== 4) return null;
    return String(y);
  }

  if (type === "month") {
    const normalized = text.replace(/[./]/g, "-").replace(/\s+/g, "-");
    const bits = normalized.split("-").filter(Boolean);
    if (bits.length !== 2) return null;

    const yearFirst = bits[0].length === 4 ? Number(bits[0]) : NaN;
    const yearSecond = bits[1].length === 4 ? Number(bits[1]) : NaN;
    let y = yearFirst;
    let m = Number(bits[1]);
    if (!Number.isFinite(y)) {
      y = yearSecond;
      m = Number(bits[0]);
    }
    if (!Number.isFinite(m)) {
      m = monthNameToIndex(bits[0]) + 1;
      if (Number.isFinite(yearSecond) && m > 0) y = yearSecond;
    }
    if (!Number.isFinite(y) || !Number.isFinite(m) || y < 1900 || y > 2200 || m < 1 || m > 12) return null;
    return `${y}-${pad2(m)}`;
  }

  const normalized = text.replace(/[./]/g, "-").replace(/\s+/g, "-");
  const bits = normalized.split("-").filter(Boolean);
  if (bits.length !== 3) return null;

  let y;
  let m;
  let d;

  if (bits[0].length === 4) {
    y = Number(bits[0]);
    m = Number(bits[1]);
    d = Number(bits[2]);
  } else {
    d = Number(bits[0]);
    m = Number(bits[1]);
    y = Number(bits[2]);
    if (!Number.isFinite(m)) m = monthNameToIndex(bits[1]) + 1;
  }

  if (!isValidYmd(y, m, d)) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function parseValueToDate(value, type) {
  if (!value) return new Date();
  if (type === "year") {
    const y = Number(value);
    return Number.isFinite(y) ? new Date(y, 0, 1) : new Date();
  }
  if (type === "month") {
    const [y, m] = String(value).split("-").map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return new Date();
    return new Date(y, Math.max(0, m - 1), 1);
  }
  const [y, m, d] = String(value).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date();
  return new Date(y, Math.max(0, m - 1), d);
}

function formatDisplay(value, type) {
  if (!value) return "";
  if (type === "year") return String(value);
  if (type === "month") {
    const [y, m] = String(value).split("-").map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return String(value);
    return `${MONTH_NAMES[m - 1] ?? ""} ${y}`;
  }
  const [y, m, d] = String(value).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return String(value);
  return `${pad2(d)}-${pad2(m)}-${y}`;
}

function buildCalendarDays(baseDate) {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const leading = first.getDay();
  const days = [];
  for (let i = 0; i < leading; i += 1) days.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) days.push(new Date(y, m, d));
  return days;
}

function sameDate(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DateField({
  label,
  hideLabel,
  required,
  placeholder,
  value,
  onChange,
  disabled,
  type = "date",
  max,
  locked,
  "aria-label": ariaLabel,
  ..._props
}) {
  const noLabel = hideLabel || label == null || label === false;
  const inputAria =
    (typeof ariaLabel === "string" && ariaLabel) ||
    (!noLabel && typeof label === "string" ? label : undefined);
  const isDisabled = disabled || locked;
  const normalizedType = type === "month" || type === "year" ? type : "date";

  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [viewDate, setViewDate] = useState(() => parseValueToDate(value, normalizedType));
  const [inputText, setInputText] = useState(() => formatDisplay(value, normalizedType));

  const selectedDate = useMemo(() => parseValueToDate(value, normalizedType), [value, normalizedType]);
  const maxDate = useMemo(
    () => (max ? parseValueToDate(max, normalizedType) : null),
    [max, normalizedType]
  );
  const displayText = formatDisplay(value, normalizedType);

  useEffect(() => {
    setViewDate(parseValueToDate(value, normalizedType));
    setInputText(formatDisplay(value, normalizedType));
  }, [value, normalizedType]);

  useEffect(() => {
    if (!open) return undefined;
    function handleOutside(e) {
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inPopup = popupRef.current && popupRef.current.contains(e.target);
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
      const popupW = rect.width;
      const popupH = normalizedType === "date" ? 290 : 210;
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
  }, [open, normalizedType]);

  function openPicker() {
    if (isDisabled) return;
    setOpen((prev) => !prev);
    triggerRef.current?.querySelector("input")?.focus();
  }

  function emit(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  function handleDateSelect(d) {
    if (maxDate && d.getTime() > maxDate.getTime()) return;
    emit(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
  }

  function handleMonthSelect(monthIndex) {
    if (maxDate) {
      const candidate = new Date(viewDate.getFullYear(), monthIndex, 1);
      const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      if (candidate.getTime() > maxMonth.getTime()) return;
    }
    emit(`${viewDate.getFullYear()}-${pad2(monthIndex + 1)}`);
  }

  function handleYearSelect(year) {
    if (maxDate && year > maxDate.getFullYear()) return;
    emit(String(year));
  }

  const calendarDays = normalizedType === "date" ? buildCalendarDays(viewDate) : [];
  const today = new Date();
  const yearBlockStart = Math.floor(viewDate.getFullYear() / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => yearBlockStart + i);

  const defaultPlaceholder =
    normalizedType === "year"
      ? "YYYY"
      : normalizedType === "month"
        ? "MM-YYYY"
        : "DD-MMM-YYYY";

  return (
    <div className={`sc-field${noLabel ? " sc-field--no-label" : ""}`}>
      {!noLabel && <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>}

      <div
        ref={triggerRef}
        className={`sc-date-trigger${isDisabled ? " sc-date-trigger--disabled" : ""}${open ? " sc-date-trigger--open" : ""}`}
        onClick={() => triggerRef.current?.querySelector("input")?.focus()}
      >
        <input
          type="text"
          className="sc-date-trigger__input"
          value={inputText}
          placeholder={placeholder || defaultPlaceholder}
          aria-label={inputAria}
          disabled={isDisabled}
          readOnly={locked}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => {
            if (!inputText && displayText) setInputText(displayText);
          }}
          onBlur={() => {
            const parsed = parseTypedDateInput(inputText, normalizedType);
            if (parsed === null) {
              setInputText(displayText);
              return;
            }
            if (parsed === "") {
              onChange?.("");
              setInputText("");
              return;
            }
            if (maxDate) {
              const candidate = parseValueToDate(parsed, normalizedType);
              if (candidate.getTime() > maxDate.getTime()) {
                setInputText(displayText);
                return;
              }
            }
            onChange?.(parsed);
            setInputText(formatDisplay(parsed, normalizedType));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setInputText(displayText);
              setOpen(false);
              e.currentTarget.blur();
            }
          }}
          {..._props}
        />
        <button
          type="button"
          className="sc-date-trigger__icon-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openPicker();
          }}
          disabled={isDisabled}
          aria-label={`Open ${normalizedType} picker`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <CalendarIcon aria-hidden="true" className="sc-date-trigger__icon" />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={popupRef}
            className="sc-date-popup"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="dialog"
            aria-modal="false"
          >
            <div className="sc-date-popup__header">
              <button
                type="button"
                className="sc-date-popup__nav"
                onClick={() => {
                  if (normalizedType === "year") setViewDate(new Date(viewDate.getFullYear() - 12, 0, 1));
                  else if (normalizedType === "month") setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
                  else setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
                }}
              >
                ‹
              </button>
              <span className="sc-date-popup__title">
                {normalizedType === "year"
                  ? `${yearBlockStart} - ${yearBlockStart + 11}`
                  : normalizedType === "month"
                    ? String(viewDate.getFullYear())
                    : `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
              </span>
              <button
                type="button"
                className="sc-date-popup__nav"
                onClick={() => {
                  if (normalizedType === "year") setViewDate(new Date(viewDate.getFullYear() + 12, 0, 1));
                  else if (normalizedType === "month") setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
                  else setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
                }}
              >
                ›
              </button>
            </div>

            {normalizedType === "date" && (
              <>
                <div className="sc-date-popup__week">
                  {WEEK_DAYS.map((d) => (
                    <span key={d} className="sc-date-popup__week-label">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="sc-date-popup__grid sc-date-popup__grid--days">
                  {calendarDays.map((d, idx) =>
                    d ? (
                      <button
                        key={`${d.toISOString()}-${idx}`}
                        type="button"
                        disabled={Boolean(maxDate && d.getTime() > maxDate.getTime())}
                        className={`sc-date-popup__cell${
                          sameDate(d, selectedDate) ? " is-selected" : sameDate(d, today) ? " is-today" : ""
                        }`}
                        onClick={() => handleDateSelect(d)}
                      >
                        {d.getDate()}
                      </button>
                    ) : (
                      <span key={`blank-${idx}`} className="sc-date-popup__blank" />
                    )
                  )}
                </div>
              </>
            )}

            {normalizedType === "month" && (
              <div className="sc-date-popup__grid sc-date-popup__grid--months">
                {MONTH_NAMES.map((m, i) => {
                  const selected =
                    String(value || "") === `${viewDate.getFullYear()}-${pad2(i + 1)}`;
                  const disabled =
                    Boolean(
                      maxDate &&
                        new Date(viewDate.getFullYear(), i, 1).getTime() >
                          new Date(maxDate.getFullYear(), maxDate.getMonth(), 1).getTime()
                    );
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={disabled}
                      className={`sc-date-popup__cell sc-date-popup__cell--month${selected ? " is-selected" : ""}`}
                      onClick={() => handleMonthSelect(i)}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            {normalizedType === "year" && (
              <div className="sc-date-popup__grid sc-date-popup__grid--years">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    disabled={Boolean(maxDate && y > maxDate.getFullYear())}
                    className={`sc-date-popup__cell sc-date-popup__cell--year${String(value || "") === String(y) ? " is-selected" : ""}`}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}

    </div>
  );
}
