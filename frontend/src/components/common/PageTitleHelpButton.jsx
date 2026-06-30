import { CircleHelp } from "lucide-react";
import styles from "./PageTitleHelpButton.module.css";

/**
 * Small help control for page titles — calls onClick to open in-page help.
 */
export default function PageTitleHelpButton({
  onClick,
  label = "Open help guide",
  className = "",
}) {
  if (!onClick) return null;

  const handleClick = () => onClick();

  return (
    <button
      type="button"
      className={[styles.helpBtn, className].filter(Boolean).join(" ")}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <CircleHelp size={18} strokeWidth={2} aria-hidden />
      <span className={styles.helpText}>Help</span>
    </button>
  );
}
