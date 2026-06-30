import styles from "./ProcurementBrandMark.module.css";

const DEFAULT_NAME = "Procurement Management System";
const DEFAULT_SHORT = "PMS";

/** Teal procurement icon — cart + checklist motif */
function BrandIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="2" width="36" height="36" rx="10" fill="currentColor" fillOpacity="0.12" />
      <rect x="2" y="2" width="36" height="36" rx="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 14h3.2l1.4 9.2a1.5 1.5 0 0 0 1.48 1.3h8.36a1.5 1.5 0 0 0 1.48-1.3L28.2 17H14.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="28.5" r="1.5" fill="currentColor" />
      <circle cx="24.5" cy="28.5" r="1.5" fill="currentColor" />
      <path
        d="M16 11h6.5M19.25 8.25V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M26.5 10.5l1.5 1.5 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function splitDisplayName(name) {
  const text = String(name || DEFAULT_NAME).trim();
  if (/procurement management system/i.test(text)) {
    return { line1: "Procurement", line2: "Management System" };
  }
  const words = text.split(/\s+/);
  if (words.length <= 1) return { line1: text, line2: "" };
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(" "),
    line2: words.slice(mid).join(" "),
  };
}

/**
 * Text-first brand mark for login, sidebar, and print headers.
 * @param {{ variant?: "login" | "sidebar" | "compact" | "icon", name?: string, shortName?: string, className?: string, iconOnly?: boolean }} props
 */
export default function ProcurementBrandMark({
  variant = "login",
  name = DEFAULT_NAME,
  shortName = DEFAULT_SHORT,
  className = "",
  iconOnly = false,
}) {
  const { line1, line2 } = splitDisplayName(name);
  const showShort = variant === "sidebar" && shortName?.trim();
  const resolvedVariant = iconOnly ? "icon" : variant;

  if (iconOnly || resolvedVariant === "icon") {
    return (
      <div
        className={`${styles.mark} ${styles["mark--icon"]} ${className}`.trim()}
        role="img"
        aria-label={name || DEFAULT_NAME}
      >
        <BrandIcon className={styles.icon} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.mark} ${styles[`mark--${resolvedVariant}`]} ${className}`.trim()}
      role="img"
      aria-label={name || DEFAULT_NAME}
    >
      <BrandIcon className={styles.icon} />
      <div className={styles.text}>
        {showShort ? (
          <>
            <span className={styles.shortBadge}>{shortName.trim()}</span>
            <span className={styles.linePrimary}>{line1}</span>
            {line2 ? <span className={styles.lineSecondary}>{line2}</span> : null}
          </>
        ) : (
          <>
            <span className={styles.linePrimary}>{line1}</span>
            {line2 ? <span className={styles.lineSecondary}>{line2}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_NAME, DEFAULT_SHORT };
