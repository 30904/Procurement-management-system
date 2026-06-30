import styles from "./Spinner.module.css";

export default function Spinner({ label = "Signing in" }) {
  return (
    <span className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.ring} aria-hidden />
      <span className={styles.label}>{label}…</span>
    </span>
  );
}
