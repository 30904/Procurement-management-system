import { resolveMenuIcon } from "../../config/iconRegistry.js";
import { useMenuIconCatalog } from "../../hooks/useMenuIconCatalog.js";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";
import styles from "./MenuIconPicker.module.css";

function previewSrc(icon, active) {
  if (icon.source === "upload") {
    const path = active ? icon.activeIconUrl || icon.iconUrl : icon.iconUrl;
    return resolveMenuIconUrl(path);
  }
  return resolveMenuIcon(icon.code, active);
}

/**
 * @param {{ value: string, onChange: (key: string) => void, disabled?: boolean, compact?: boolean }} props
 */
export default function MenuIconPicker({ value, onChange, disabled = false, compact = false }) {
  const { icons, loading } = useMenuIconCatalog();
  const selected = value || "menu";

  if (loading && !icons.length) {
    return <p className={styles.hint}>Loading icons…</p>;
  }

  if (compact) {
    const current = icons.find((i) => i.code === selected) || icons[0];
    return (
      <div className={styles.compact}>
        <img
          src={previewSrc(current, false) || resolveMenuIcon("menu")}
          alt=""
          className={styles.compactPreview}
          aria-hidden
        />
        <select
          className={styles.compactSelect}
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label="Menu icon"
        >
          {icons.map(({ code, label, source }) => (
            <option key={code} value={code}>
              {label}
              {source === "upload" ? " (custom)" : ""}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        Built-in icons or your uploads from Settings → Menu Icons. SVG or PNG recommended.
      </p>
      <div className={styles.grid} role="listbox" aria-label="Choose menu icon">
        {icons.map((icon) => {
          const isSelected = selected === icon.code;
          return (
            <button
              key={icon.code}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={`${styles.tile}${isSelected ? ` ${styles.tileSelected}` : ""}`}
              onClick={() => onChange(icon.code)}
              disabled={disabled}
              title={icon.label}
            >
              <span className={styles.tileIcons}>
                <img src={previewSrc(icon, false)} alt="" className={styles.icon} />
                <img src={previewSrc(icon, true)} alt="" className={styles.icon} />
              </span>
              <span className={styles.tileLabel}>
                {icon.label}
                {icon.source === "upload" ? (
                  <span className={styles.customBadge}>Custom</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
