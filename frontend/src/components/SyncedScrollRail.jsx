import { useCallback, useLayoutEffect, useRef, useState } from "react";
import UpArrowIcon from "../assets/up-arrow.svg?react";
import DownArrowIcon from "../assets/down-arrow.svg?react";
import styles from "./CustomVerticalScroll.module.css";

const SCROLL_BTN_FACTOR = 0.22;

/**
 * DOM scrollbar rail (same visuals as CustomVerticalScroll) driven by an external scroll container ref.
 */
export default function SyncedScrollRail({
  viewportRef,
  headerRef,
  /** When set, vertical placement uses `viewport` vs this root; use with `position: relative` root + rail `right: 0`. */
  alignRootRef,
  /** Row-group that defines rail outer height (e.g. `<table>`). Defaults to viewport when omitted. */
  railBoundsRef,
  enabled,
  className = "",
  /** Resets observers when content/layout changes */
  layoutKey = "",
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [thumb, setThumb] = useState({ h: 0, top: 0 });
  const [canScroll, setCanScroll] = useState(false);

  const computeThumb = useCallback(() => {
    const vp = viewportRef?.current;
    const tr = trackRef.current;
    if (!vp || !tr || !enabled) return;
    const { scrollTop, scrollHeight, clientHeight } = vp;
    const trackH = tr.clientHeight;
    const overflow = scrollHeight > clientHeight + 0.5;
    setCanScroll(overflow);

    if (!overflow || trackH <= 0) {
      setThumb({ h: Math.max(trackH, 0), top: 0 });
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const minThumbPx = 12;
    const thumbH = Math.max(trackH * ratio, minThumbPx);
    const maxScroll = scrollHeight - clientHeight;
    const maxThumbTop = Math.max(0, trackH - thumbH);
    const rawTop = maxScroll <= 0 ? 0 : (scrollTop / maxScroll) * maxThumbTop;
    const thumbTop = Math.min(Math.max(0, rawTop), maxThumbTop);
    setThumb({ h: thumbH, top: thumbTop });
  }, [viewportRef, enabled]);

  useLayoutEffect(() => {
    const vp = viewportRef?.current;
    if (!vp || !enabled) return;
    const onScroll = () => computeThumb();
    vp.addEventListener("scroll", onScroll, { passive: true });
    computeThumb();
    return () => vp.removeEventListener("scroll", onScroll);
  }, [viewportRef, enabled, computeThumb, layoutKey]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const vp = viewportRef?.current;
    const head = headerRef?.current;
    const box = containerRef.current;
    if (!vp || !head || !box) return;

    const layoutChrome = () => {
      const root = alignRootRef?.current;
      const boundsEl = railBoundsRef?.current ?? vp;
      if (root) {
        const rr = root.getBoundingClientRect();
        const br = boundsEl.getBoundingClientRect();
        box.style.top = `${Math.round(br.top - rr.top)}px`;
        box.style.height = `${Math.round(br.height)}px`;
      } else {
        box.style.top = `${head.offsetHeight}px`;
        box.style.height = `${vp.clientHeight}px`;
      }
    };

    layoutChrome();
    computeThumb();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            layoutChrome();
            computeThumb();
          })
        : null;

    if (ro) {
      ro.observe(vp);
      const boundsObserve = railBoundsRef?.current;
      if (boundsObserve && boundsObserve !== vp) ro.observe(boundsObserve);
      ro.observe(head);
      const rootEl = alignRootRef?.current;
      if (rootEl) ro.observe(rootEl);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    let mo = null;
    if (typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(() => computeThumb());
      mo.observe(vp, { childList: true, subtree: true });
    }

    const onWin = () => {
      layoutChrome();
      computeThumb();
    };
    window.addEventListener("resize", onWin);

    return () => {
      if (ro) ro.disconnect();
      if (mo) mo.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [enabled, viewportRef, headerRef, alignRootRef, railBoundsRef, computeThumb, layoutKey]);

  const scrollByAmount = useCallback(
    (delta) => {
      const el = viewportRef?.current;
      if (!el) return;
      el.scrollTop += delta;
      requestAnimationFrame(computeThumb);
    },
    [viewportRef, computeThumb]
  );

  const scrollUpBtn = () => {
    const vp = viewportRef?.current;
    if (!vp) return;
    scrollByAmount(-Math.max(24, vp.clientHeight * SCROLL_BTN_FACTOR));
  };

  const scrollDownBtn = () => {
    const vp = viewportRef?.current;
    if (!vp) return;
    scrollByAmount(Math.max(24, vp.clientHeight * SCROLL_BTN_FACTOR));
  };

  const onTrackPointerDown = (e) => {
    if (e.target.closest(`.${styles.thumb}`)) return;
    const tr = trackRef.current;
    const vp = viewportRef?.current;
    if (!tr || !vp) return;
    const overflow = vp.scrollHeight > vp.clientHeight + 0.5;
    if (!overflow) return;
    const rect = tr.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const { h: thumbH, top: thumbTop } = thumb;
    const mid = thumbTop + thumbH / 2;
    const page = Math.max(24, vp.clientHeight * 0.85);
    if (y < mid) scrollByAmount(-page);
    else scrollByAmount(page);
  };

  const onThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const vp = viewportRef?.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const maxScroll = vp.scrollHeight - vp.clientHeight;
    const trackH = tr.clientHeight;
    const thumbH = thumb.h;
    const maxThumbTop = Math.max(0, trackH - thumbH);
    if (maxScroll <= 0 || maxThumbTop <= 0) return;

    const startY = e.clientY;
    const startScroll = vp.scrollTop;

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const dScroll = (dy / maxThumbTop) * maxScroll;
      vp.scrollTop = startScroll + dScroll;
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      computeThumb();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  if (!enabled) return null;

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <div className={`${styles.rail} ${styles.railJournalHost} ${!canScroll ? styles.railMuted : ""}`.trim()}>
        <button type="button" className={styles.arrowBtn} onClick={scrollUpBtn} disabled={!canScroll} aria-label="Scroll up">
          <UpArrowIcon className={styles.arrowIcon} />
        </button>
        <div ref={trackRef} className={styles.track} role="presentation" onPointerDown={onTrackPointerDown}>
          <div
            className={styles.thumb}
            style={{
              height: `${thumb.h}px`,
              top: `${thumb.top}px`,
            }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
        <button type="button" className={styles.arrowBtn} onClick={scrollDownBtn} disabled={!canScroll} aria-label="Scroll down">
          <DownArrowIcon className={styles.arrowIcon} />
        </button>
      </div>
    </div>
  );
}
