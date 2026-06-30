import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext.js";
import styles from "./ToastContext.module.css";

const TOAST_MS = 5000;

function genId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ToastTypeIcon({ type }) {
  if (type === "success") {
    return (
      <span className={styles.iconWrap} aria-hidden>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M1 5L4.2 8.2L11 1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (type === "error") {
    return (
      <span className={styles.iconWrap} aria-hidden>
        <span style={{ fontSize: "0.78rem", fontWeight: 800, lineHeight: 1, color: "#fff" }}>!</span>
      </span>
    );
  }
  if (type === "warning") {
    return (
      <span className={styles.iconWrap} aria-hidden>
        <svg width="18" height="16" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0L20 18H0L10 0Z" fill="#f59e0b" />
          <text
            x="10"
            y="14.5"
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
          >
            !
          </text>
        </svg>
      </span>
    );
  }
  if (type === "info") {
    return (
      <span className={styles.iconWrap} aria-hidden>
        <span style={{ fontSize: "0.72rem", fontWeight: 800, lineHeight: 1 }}>i</span>
      </span>
    );
  }
  return null;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [hoveringId, setHoveringId] = useState(null);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timerMeta = timersRef.current.get(id);
    if (timerMeta?.timeoutId) {
      window.clearTimeout(timerMeta.timeoutId);
    }
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTimer = useCallback(
    (id, ms) => {
      const timeoutId = window.setTimeout(() => dismiss(id), ms);
      timersRef.current.set(id, {
        timeoutId,
        startedAt: Date.now(),
        remainingMs: ms,
        paused: false,
      });
    },
    [dismiss]
  );

  const pauseTimer = useCallback((id) => {
    const meta = timersRef.current.get(id);
    if (!meta || meta.paused) return;
    window.clearTimeout(meta.timeoutId);
    const elapsed = Date.now() - meta.startedAt;
    const remainingMs = Math.max(0, meta.remainingMs - elapsed);
    timersRef.current.set(id, {
      ...meta,
      timeoutId: null,
      remainingMs,
      paused: true,
    });
  }, []);

  const resumeTimer = useCallback(
    (id) => {
      const meta = timersRef.current.get(id);
      if (!meta || !meta.paused) return;
      if (meta.remainingMs <= 0) {
        dismiss(id);
        return;
      }
      startTimer(id, meta.remainingMs);
    },
    [dismiss, startTimer]
  );

  const pushToast = useCallback(
    (type, message, options) => {
      const id = options?.id ?? genId();
      setToasts((prev) => {
        const rest = options?.id ? prev.filter((t) => t.id !== options.id) : prev;
        return [...rest, { id, type, message }];
      });
      startTimer(id, TOAST_MS);
    },
    [startTimer]
  );

  const api = useMemo(() => {
    return {
      error: (message) => pushToast("error", message, {}),
      success: (message, options) => pushToast("success", message, options ?? {}),
      warning: (message) => pushToast("warning", message, {}),
      info: (message) => pushToast("info", message, {}),
      loading: (message) => {
        const id = genId();
        setToasts((prev) => [...prev, { id, type: "loading", message }]);
        return id;
      },
      dismiss,
    };
  }, [dismiss, pushToast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className={styles.viewport}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => {
          const isError = t.type === "error";
          const isPaused = hoveringId === t.id;
          return (
            <div
              key={t.id}
              className={styles.toast}
              data-type={t.type}
              data-paused={isPaused ? "true" : "false"}
              role={isError ? "alert" : "status"}
              style={t.type === "loading" ? undefined : { "--toast-duration": `${TOAST_MS}ms` }}
              onMouseEnter={() => {
                setHoveringId(t.id);
                pauseTimer(t.id);
              }}
              onMouseLeave={() => {
                setHoveringId(null);
                resumeTimer(t.id);
              }}
            >
              <div className={styles.toastInner}>
                {t.type === "loading" ? (
                  <span className={styles.spinner} aria-hidden />
                ) : (
                  <ToastTypeIcon type={t.type} />
                )}
                <span className={styles.msg}>{t.message}</span>
                <button
                  type="button"
                  className={styles.close}
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
              {t.type !== "loading" ? (
                <div className={styles.progressTrack} aria-hidden>
                  <div className={styles.progressBar} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
