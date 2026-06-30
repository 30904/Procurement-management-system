import { resolveDocumentStatusTone } from "../../utils/documentStatus.js";
import styles from "./DocumentStatusBadge.module.css";

/**
 * Standard procurement document status badge.
 * @param {{ status?: string, label?: string, className?: string }} props
 */
export default function DocumentStatusBadge({ status, label, className = "" }) {
  const text = label ?? status ?? "—";
  const tone = resolveDocumentStatusTone(status ?? text);
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`.trim()} title={text}>
      <span className={styles.dot} aria-hidden />
      {text}
    </span>
  );
}
