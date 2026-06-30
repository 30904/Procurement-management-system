import { useEffect, useRef, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { getAuthUser } from "../../utils/authStorage.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useMenuIconCatalog } from "../../hooks/useMenuIconCatalog.js";
import {
  uploadFrameworkMenuIconRequest,
  deleteFrameworkMenuIconRequest,
} from "../../services/api.js";
import { resolveMenuIcon } from "../../config/iconRegistry.js";
import { resolveMenuIconUrl } from "../../utils/menuIconUrl.js";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import layoutStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ApplicationSetupPage.module.css";
import styles from "./MenuIconsSetupPage.module.css";

function iconPreview(icon, active) {
  if (icon.source === "upload") {
    return resolveMenuIconUrl(active ? icon.activeIconUrl || icon.iconUrl : icon.iconUrl);
  }
  return resolveMenuIcon(icon.code, active);
}

export default function MenuIconsSetupPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = usePermissions();
  const user = getAuthUser();
  const { setFooterContent } = useFooter();
  const toast = useToast();
  const { icons, loading: iconsLoading, reload } = useMenuIconCatalog();
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const iconInputRef = useRef(null);
  const activeInputRef = useRef(null);

  const canAccess =
    isSuperAdmin || String(user?.userType || "").toUpperCase() === "SUPER_ADMIN";

  const customIcons = icons.filter((i) => i.source === "upload");
  const builtinIcons = icons.filter((i) => i.source === "builtin");

  useEffect(() => {
    setFooterContent(
      "Upload SVG/PNG icons for sidebar menus — no code deploy needed. Optional second file for the active (selected) state."
    );
    return () => setFooterContent(null);
  }, [setFooterContent]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!iconFile) {
      toast.error("Choose an icon file");
      return;
    }

    setUploading(true);
    try {
      await uploadFrameworkMenuIconRequest({
        label: label.trim(),
        code: code.trim() || undefined,
        iconFile,
        activeIconFile: activeFile || undefined,
      });
      toast.success("Icon uploaded");
      setLabel("");
      setCode("");
      setIconFile(null);
      setActiveFile(null);
      if (iconInputRef.current) iconInputRef.current.value = "";
      if (activeInputRef.current) activeInputRef.current.value = "";
      await reload();
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deleteFrameworkMenuIconRequest(deleteTarget.id);
      toast.success(`Deleted icon "${deleteTarget.label}"`);
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!loading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (loading) return null;

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-item">Menu Icons</span>
        </h1>
      </header>

      <section className={pageStyles.intro} aria-labelledby="icons-setup-intro">
        <h2 id="icons-setup-intro" className={pageStyles.introTitle}>
          Custom sidebar icons
        </h2>
        <p className={pageStyles.introText}>
          Upload icons here, then pick them in <strong>Menu Setup</strong> or when adding a
          menu. Built-in icons remain available without upload.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="upload-panel-title">
        <h2 id="upload-panel-title" className={styles.panelTitle}>
          Upload new icon
        </h2>
        <p className={styles.panelHint}>
          Use a short label and optional code (letters/numbers). If you skip the active-state
          file, the normal icon is used for both states.
        </p>
        <form onSubmit={handleUpload}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="icon-label">Label</label>
              <input
                id="icon-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Inventory"
                disabled={uploading}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="icon-code">Code (optional)</label>
              <input
                id="icon-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. inventory"
                disabled={uploading}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="icon-file">Icon (normal)</label>
              <input
                id="icon-file"
                ref={iconInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="active-icon-file">Icon (active, optional)</label>
              <input
                id="active-icon-file"
                ref={activeInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setActiveFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.uploadBtn} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload icon"}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="custom-icons-title">
        <h2 id="custom-icons-title" className={styles.panelTitle}>
          Your uploads
        </h2>
        {iconsLoading ? (
          <p className={styles.empty}>Loading…</p>
        ) : customIcons.length === 0 ? (
          <p className={styles.empty}>No custom icons yet. Upload one above.</p>
        ) : (
          <div className={styles.iconGrid}>
            {customIcons.map((icon) => (
              <article key={icon.id || icon.code} className={styles.iconCard}>
                <span className={styles.badge}>Custom</span>
                <span>
                  <img src={iconPreview(icon, false)} alt="" />
                  <img src={iconPreview(icon, true)} alt="" />
                </span>
                <span className={styles.iconCardLabel}>{icon.label}</span>
                <span className={styles.iconCardCode}>{icon.code}</span>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => setDeleteTarget(icon)}
                  disabled={deleting}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="builtin-icons-title">
        <h2 id="builtin-icons-title" className={styles.panelTitle}>
          Built-in icons
        </h2>
        <p className={styles.panelHint}>Shipped with the app — cannot be deleted here.</p>
        <div className={styles.iconGrid}>
          {builtinIcons.map((icon) => (
            <article key={icon.code} className={styles.iconCard}>
              <span>
                <img src={iconPreview(icon, false)} alt="" />
                <img src={iconPreview(icon, true)} alt="" />
              </span>
              <span className={styles.iconCardLabel}>{icon.label}</span>
              <span className={styles.iconCardCode}>{icon.code}</span>
            </article>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete icon?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.label}"? Menus using code "${deleteTarget.code}" will need a new icon.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
