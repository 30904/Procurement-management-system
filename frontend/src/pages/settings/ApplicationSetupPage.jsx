import { useCallback, useEffect, useRef, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { useAppBranding } from "../../context/AppBrandingContext.jsx";
import { getAuthUser } from "../../utils/authStorage.js";
import { useFooter } from "../../context/FooterContext.jsx";
import {
  getApplicationSettingsRequest,
  updateApplicationSettingsRequest,
  uploadApplicationAssetRequest,
} from "../../services/api.js";
import {
  applicationDocToForm,
  applicationFormToPayload,
  emptyApplicationForm,
  resolveAssetUrl,
  validateApplicationForm,
} from "../../utils/applicationFormState.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import { APP_BRANDING_DEFAULTS } from "../../config/appBrandingDefaults.js";
import { DEFAULT_ORGANIZATION_LOGO_URL } from "../../config/documentBranding.js";
import layoutStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ApplicationSetupPage.module.css";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/subcomponents.css";
import "../../styles/global.css";

const ENV_OPTIONS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

const LOGO_FIELDS = [
  { assetType: "logo", label: "Application logo", urlKey: "logoUrl" },
  { assetType: "logoSidebar", label: "Sidebar logo", urlKey: "logoSidebarUrl" },
  { assetType: "loginLogo", label: "Login logo", urlKey: "loginLogoUrl" },
  { assetType: "favicon", label: "Favicon", urlKey: "faviconUrl" },
];

function LogoUploadSlot({ label, url, onUpload, uploading }) {
  const inputRef = useRef(null);
  const src = resolveAssetUrl(url);

  return (
    <div className={pageStyles.logoCard}>
      <span className={pageStyles.logoLabel}>{label}</span>
      <div className={pageStyles.logoPreview}>
        {src ? (
          <img src={src} alt={label} />
        ) : (
          <img src={DEFAULT_ORGANIZATION_LOGO_URL} alt={label} />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={pageStyles.uploadBtn}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Upload image"}
      </button>
    </div>
  );
}

export default function ApplicationSetupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isSuperAdmin, loading: permsLoading } = usePermissions();
  const { refreshBranding } = useAppBranding();
  const user = getAuthUser();
  const { setFooterContent } = useFooter();
  const [form, setForm] = useState(emptyApplicationForm);
  const [snapshot, setSnapshot] = useState(emptyApplicationForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [errors, setErrors] = useState({});

  const canAccess =
    isSuperAdmin || String(user?.userType || "").toUpperCase() === "SUPER_ADMIN";

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApplicationSettingsRequest();
      const next = applicationDocToForm(res?.data);
      setForm(next);
      setSnapshot(next);
      setErrors({});
    } catch (err) {
      toast.error(err?.message || "Failed to load application settings");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canAccess) loadSettings();
  }, [canAccess, loadSettings]);

  useEffect(() => {
    setFooterContent("Configure application branding, version, and logo assets.");
    return () => setFooterContent(null);
  }, [setFooterContent]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleReset = () => {
    setForm(snapshot);
    setErrors({});
    toast.success("Reset to last saved values");
  };

  const handleSave = async () => {
    const validation = validateApplicationForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fill required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await updateApplicationSettingsRequest(
        applicationFormToPayload(form)
      );
      const next = applicationDocToForm(res?.data);
      setForm(next);
      setSnapshot(next);
      await refreshBranding();
      toast.success(res?.message || "Application settings saved");
    } catch (err) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (assetType, urlKey, file) => {
    setUploadingKey(urlKey);
    try {
      const res = await uploadApplicationAssetRequest(file, assetType);
      const app = res?.data?.application || res?.data;
      const url = res?.data?.url || app?.[urlKey];
      if (url) {
        setForm((prev) => ({ ...prev, [urlKey]: url }));
        setSnapshot((prev) => ({ ...prev, [urlKey]: url }));
      } else if (app) {
        const next = applicationDocToForm(app);
        setForm(next);
        setSnapshot(next);
      }
      await refreshBranding();
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  if (!permsLoading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (permsLoading) return null;

  const fieldClass = (key) => (errors[key] ? pageStyles.fieldError : "");

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-item">Application Set-up</span>
        </h1>
      </header>

      <section className={pageStyles.intro} aria-labelledby="app-setup-intro">
        <h2 id="app-setup-intro" className={pageStyles.introTitle}>
          Application configuration
        </h2>
        <p className={pageStyles.introText}>
          Set application name, version, support details, theme colors, and upload
          logos for login, sidebar, and favicon. Menu management is available
          under <strong>Menu Setup</strong> on the Settings page.
        </p>
      </section>

      <section className={pageStyles.formCard}>
        <h2 className={pageStyles.formCardTitle}>Application details</h2>

        {loading ? (
          <p className={pageStyles.introText}>Loading settings…</p>
        ) : (
          <>
            <div className={pageStyles.formGrid}>
              <div className={fieldClass("applicationName")}>
                <InputField
                  label="Application Name"
                  required
                  value={form.applicationName}
                  onChange={(v) => patch("applicationName", v)}
                  placeholder="e.g. Smart Ledger"
                />
              </div>
              <div>
                <InputField
                  label="Short Name"
                  value={form.shortName}
                  onChange={(v) => patch("shortName", v)}
                  placeholder="Short display name"
                />
              </div>
              <div className={fieldClass("version")}>
                <InputField
                  label="Version"
                  required
                  value={form.version}
                  onChange={(v) => patch("version", v)}
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <InputField
                  label="Build Number"
                  value={form.buildNumber}
                  onChange={(v) => patch("buildNumber", v)}
                  placeholder="100"
                />
              </div>

              <div>
                <SelectField
                  label="Environment"
                  options={ENV_OPTIONS}
                  value={form.environment}
                  onChange={(v) => patch("environment", v)}
                />
              </div>
              <div className={fieldClass("developerName")}>
                <InputField
                  label="Developer / Vendor"
                  required
                  value={form.developerName}
                  onChange={(v) => patch("developerName", v)}
                />
              </div>
              <div>
                <InputField
                  label="Support Email"
                  value={form.supportEmail}
                  onChange={(v) => patch("supportEmail", v)}
                />
              </div>
              <div>
                <InputField
                  label="Support Phone"
                  value={form.supportPhone}
                  onChange={(v) => patch("supportPhone", v)}
                />
              </div>

              <div>
                <InputField
                  label="Website URL"
                  value={form.websiteUrl}
                  onChange={(v) => patch("websiteUrl", v)}
                />
              </div>
              <div className={pageStyles.formGridWide}>
                <InputField
                  label="Tagline"
                  value={form.tagline}
                  onChange={(v) => patch("tagline", v)}
                  placeholder="Short tagline shown on login"
                />
              </div>
              <div className={pageStyles.formGridWide}>
                <InputField
                  label="Description"
                  value={form.description}
                  onChange={(v) => patch("description", v)}
                  placeholder="Application description"
                />
              </div>
              <div className={pageStyles.formGridWide}>
                <InputField
                  label="Copyright / Footer text"
                  value={form.copyrightText}
                  onChange={(v) => patch("copyrightText", v)}
                  placeholder="© Application, Developed by …"
                />
              </div>

              <div>
                <label className="sc-label">Primary color</label>
                <div className={pageStyles.colorRow}>
                  <input
                    type="color"
                    className={pageStyles.colorInput}
                    value={form.themePrimaryColor}
                    onChange={(e) => patch("themePrimaryColor", e.target.value)}
                    aria-label="Primary color"
                  />
                  <InputField
                    hideLabel
                    value={form.themePrimaryColor}
                    onChange={(v) => patch("themePrimaryColor", v)}
                  />
                </div>
              </div>
              <div>
                <label className="sc-label">Accent color</label>
                <div className={pageStyles.colorRow}>
                  <input
                    type="color"
                    className={pageStyles.colorInput}
                    value={form.themeAccentColor}
                    onChange={(e) => patch("themeAccentColor", e.target.value)}
                    aria-label="Accent color"
                  />
                  <InputField
                    hideLabel
                    value={form.themeAccentColor}
                    onChange={(v) => patch("themeAccentColor", v)}
                  />
                </div>
              </div>
            </div>

            <div className={pageStyles.logoSection}>
              <h3 className={pageStyles.logoSectionTitle}>Logo & branding assets</h3>
              <div className={pageStyles.logoGrid}>
                {LOGO_FIELDS.map(({ assetType, label, urlKey }) => (
                  <LogoUploadSlot
                    key={urlKey}
                    label={label}
                    url={form[urlKey]}
                    uploading={uploadingKey === urlKey}
                    onUpload={(file) => handleUpload(assetType, urlKey, file)}
                  />
                ))}
              </div>
            </div>

            <footer className={pageStyles.formFooter}>
              <ErpBackButton onClick={() => navigate(appPath("configuration"))} />
              <div className={pageStyles.formFooterRight}>
                <button
                  type="button"
                  className={pageStyles.btnReset}
                  onClick={handleReset}
                  disabled={saving || loading}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className={pageStyles.btnSave}
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
