import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import closeBtnIcon from "../../assets/close-btn.svg";
import { createFrameworkSidebarMenuRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import MenuIconPicker from "./MenuIconPicker.jsx";
import styles from "./AddSidebarMenuModal.module.css";

const DEFAULT_MODULE_COUNT = 4;
function suggestNextRoute(sidebarRows) {
  let maxN = 0;
  for (const row of sidebarRows) {
    const fromCode = /^menu_(\d+)$/.exec(row.code || "");
    if (fromCode) maxN = Math.max(maxN, Number(fromCode[1]));
    const fromSegment = /^menu-(\d+)$/.exec(String(row.segment || "").replace(/^\/+/, ""));
    if (fromSegment) maxN = Math.max(maxN, Number(fromSegment[1]));
  }
  return `menu-${maxN + 1}`;
}

function suggestNextSequence(sidebarRows, placement) {
  const samePlacement = sidebarRows.filter((r) => r.menuType === placement);
  const maxSeq = samePlacement.reduce((max, r) => Math.max(max, Number(r.sequence) || 0), 0);
  return maxSeq + 10;
}

/**
 * @param {{ open: boolean, onClose: () => void, onCreated?: (data: unknown) => void, sidebarRows?: Array<object> }} props
 */
export default function AddSidebarMenuModal({ open, onClose, onCreated, sidebarRows = [] }) {
  const toast = useToast();
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [label, setLabel] = useState("");
  const [placement, setPlacement] = useState("sidebar_main");
  const [route, setRoute] = useState("");
  const [sequence, setSequence] = useState(10);
  const [moduleCount, setModuleCount] = useState(DEFAULT_MODULE_COUNT);
  const [iconKey, setIconKey] = useState("menu");
  const [saving, setSaving] = useState(false);

  const defaults = useMemo(
    () => ({
      route: suggestNextRoute(sidebarRows),
      sequence: suggestNextSequence(sidebarRows, "sidebar_main"),
    }),
    [sidebarRows]
  );

  useEffect(() => {
    if (!open) return;
    setLabel("");
    setPlacement("sidebar_main");
    setRoute(defaults.route);
    setSequence(defaults.sequence);
    setModuleCount(DEFAULT_MODULE_COUNT);
    setIconKey("menu");
    setSaving(false);
  }, [open, defaults.route, defaults.sequence]);

  useEffect(() => {
    if (!open) return;
    setSequence(suggestNextSequence(sidebarRows, placement));
  }, [placement, open, sidebarRows]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    const trimmedRoute = route.trim().toLowerCase().replace(/^\/+/, "");
    if (!trimmedLabel) {
      toast.error("Menu label is required.");
      return;
    }
    if (!trimmedRoute) {
      toast.error("Route is required.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedRoute.split("/")[0])) {
      toast.error("Route may only use lowercase letters, numbers, and hyphens.");
      return;
    }
    const seqNum = Number(sequence);
    if (!Number.isFinite(seqNum) || seqNum < 0) {
      toast.error("Sequence must be a non-negative number.");
      return;
    }

    setSaving(true);
    try {
      const res = await createFrameworkSidebarMenuRequest({
        label: trimmedLabel,
        menuType: placement,
        segment: trimmedRoute,
        sequence: seqNum,
        moduleCount: Number(moduleCount) || DEFAULT_MODULE_COUNT,
        iconKey,
      });
      const data = res?.data;
      toast.success(
        `Created "${data?.menu?.label}" with ${data?.modulesCreated ?? 0} module card(s).`
      );
      onCreated?.(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to create menu");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      style={overlayStyle}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={styles.dialog}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-menu-title"
      >
        <div className={styles.bar} />
        <header className={styles.header} onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <h2 id="add-menu-title" className={styles.title}>
            Add sidebar menu
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <img src={closeBtnIcon} alt="" />
          </button>
        </header>

        <form className={styles.body} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Menu label</span>
            <input
              type="text"
              className={styles.input}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Inventory"
              disabled={saving}
              autoFocus
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span className={styles.label}>Route</span>
              <input
                type="text"
                className={styles.input}
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="e.g. menu-9 or inventory"
                disabled={saving}
              />
              <span className={styles.hint}>Opens at /app/{route || "…"}</span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Sequence</span>
              <input
                type="number"
                min={0}
                className={styles.input}
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                disabled={saving}
              />
              <span className={styles.hint}>Sidebar sort order</span>
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Icon (SVG)</span>
            <MenuIconPicker value={iconKey} onChange={setIconKey} disabled={saving} />
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Placement</span>
            <select
              className={styles.input}
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              disabled={saving}
            >
              <option value="sidebar_main">Main sidebar</option>
              <option value="sidebar_bottom">Bottom sidebar</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Default module cards</span>
            <input
              type="number"
              min={0}
              max={12}
              className={styles.input}
              value={moduleCount}
              onChange={(e) => setModuleCount(e.target.value)}
              disabled={saving}
            />
            <span className={styles.hint}>
              Creates Module 1–{moduleCount || 0} on this menu&apos;s landing page (0 = none).
            </span>
          </label>

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Creating…" : "Create menu"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
