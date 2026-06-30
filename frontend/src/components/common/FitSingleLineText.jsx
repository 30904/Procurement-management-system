import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Shrinks font size so text fits on one line inside its container (no ellipsis).
 */
export default function FitSingleLineText({
  text,
  className = "",
  minPx = 8.5,
  maxPx = 11.5,
}) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const span = textRef.current;
    if (!wrap || !span) return;

    const available = wrap.clientWidth;
    if (available <= 0) return;

    let size = maxPx;
    span.style.fontSize = `${size}px`;

    while (size > minPx && span.scrollWidth > available) {
      size -= 0.25;
      span.style.fontSize = `${size}px`;
    }
  }, [maxPx, minPx]);

  useLayoutEffect(() => {
    fit();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return undefined;

    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text, fit]);

  if (!text) return null;

  return (
    <div ref={wrapRef} className="fit-single-line">
      <span ref={textRef} className={className} style={{ fontSize: `${maxPx}px` }}>
        {text}
      </span>
    </div>
  );
}
