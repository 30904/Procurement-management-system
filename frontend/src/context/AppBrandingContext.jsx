import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getApplicationSettingsRequest,
  getPublicApplicationBrandingRequest,
} from "../services/api.js";
import { applicationDocToForm, resolveAssetUrl } from "../utils/applicationFormState.js";
import { setDocumentTitleBase } from "../utils/documentTitle.js";
import { getToken } from "../utils/authStorage.js";
import { APP_BRANDING_DEFAULTS } from "../config/appBrandingDefaults.js";
import { DEFAULT_ORGANIZATION_LOGO_URL } from "../config/documentBranding.js";
import {
  ENTERPRISE_ACCENT,
  ENTERPRISE_PRIMARY,
  normalizeThemeAccentColor,
  normalizeThemePrimaryColor,
} from "../utils/enterpriseTheme.js";

const AppBrandingContext = createContext(null);

const DEFAULT_BRANDING = applicationDocToForm({
  applicationName: APP_BRANDING_DEFAULTS.applicationName,
  shortName: APP_BRANDING_DEFAULTS.shortName,
  tagline: APP_BRANDING_DEFAULTS.tagline,
  developerName: APP_BRANDING_DEFAULTS.developerName,
  version: APP_BRANDING_DEFAULTS.version,
  themePrimaryColor: ENTERPRISE_PRIMARY,
  themeAccentColor: ENTERPRISE_ACCENT,
});

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function darken({ r, g, b }, amount = 0.12) {
  const f = 1 - amount;
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
}

function tint({ r, g, b }, amount) {
  return `rgb(${Math.round(r + (255 - r) * amount)}, ${Math.round(g + (255 - g) * amount)}, ${Math.round(b + (255 - b) * amount)})`;
}

function rgba({ r, g, b }, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function applyColorScale(root, prefix, hex) {
  const rgb = hexToRgb(hex);
  root.style.setProperty(`--${prefix}`, hex);
  root.style.setProperty(`--${prefix}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty(`--${prefix}-dark`, darken(rgb, 0.12));
  root.style.setProperty(`--${prefix}-light`, tint(rgb, 0.94));
  root.style.setProperty(`--${prefix}-bg`, tint(rgb, 0.88));
  root.style.setProperty(`--${prefix}-border`, tint(rgb, 0.75));
  root.style.setProperty(`--${prefix}-ring`, rgba(rgb, 0.18));
  root.style.setProperty(`--${prefix}-outline`, rgba(rgb, 0.25));
  root.style.setProperty(`--${prefix}-shadow`, rgba(rgb, 0.15));
  root.style.setProperty(`--${prefix}-subtle`, rgba(rgb, 0.08));
  root.style.setProperty(`--${prefix}-10`, rgba(rgb, 0.1));
  root.style.setProperty(`--${prefix}-20`, rgba(rgb, 0.2));
  root.style.setProperty(`--${prefix}-35`, rgba(rgb, 0.35));
  root.style.setProperty(`--${prefix}-80`, rgba(rgb, 0.8));
  root.style.setProperty(`--${prefix}-text`, darken(rgb, 0.35));

  if (prefix === "brand-primary") {
    root.style.setProperty("--erp-scrollbar-track", rgba(rgb, 0.1));
    root.style.setProperty("--erp-scrollbar-thumb", rgba(rgb, 0.42));
    root.style.setProperty("--erp-scrollbar-thumb-hover", rgba(rgb, 0.62));
    root.style.setProperty("--erp-scrollbar-thumb-active", hex);
  }
}

function buildChevronDataUri(hex) {
  const encoded = hex.replace("#", "%23");
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='${encoded}' stroke-width='1.2' fill='none'/%3E%3C/svg%3E")`;
}

function applyThemeToDocument(primary, accent) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolvedPrimary = normalizeThemePrimaryColor(primary);
  const resolvedRequired = normalizeThemeAccentColor(accent);
  if (resolvedPrimary) {
    applyColorScale(root, "brand-primary", resolvedPrimary);
    root.style.setProperty("--brand-chevron-svg", buildChevronDataUri(resolvedPrimary));
    /* Legacy: --brand-accent was used for primary CTAs (old pink / mis-set red accent) */
    applyColorScale(root, "brand-accent", resolvedPrimary);
  }
  if (resolvedRequired) {
    applyColorScale(root, "brand-required", resolvedRequired);
    root.style.setProperty("--brand-required", resolvedRequired);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && resolvedPrimary) meta.setAttribute("content", resolvedPrimary);
}

function applyFavicon(url) {
  if (!url || typeof document === "undefined") return;
  const selectors = ['link[rel="icon"]', 'link[rel="apple-touch-icon"]'];
  for (const sel of selectors) {
    let link = document.querySelector(sel);
    if (!link) {
      link = document.createElement("link");
      link.rel = sel.includes("apple") ? "apple-touch-icon" : "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }
}

export function AppBrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const applyBranding = useCallback((form) => {
    const raw = form || DEFAULT_BRANDING;
    const next = {
      ...raw,
      themePrimaryColor: normalizeThemePrimaryColor(raw.themePrimaryColor),
      themeAccentColor: normalizeThemeAccentColor(raw.themeAccentColor),
    };
    setBranding(next);
    applyThemeToDocument(next.themePrimaryColor, next.themeAccentColor);
    const favicon =
      resolveAssetUrl(next.faviconUrl) ||
      resolveAssetUrl(next.logoUrl) ||
      DEFAULT_ORGANIZATION_LOGO_URL;
    if (favicon) applyFavicon(favicon);
    if (next.applicationName) {
      setDocumentTitleBase(next.applicationName);
    }
    if (typeof document !== "undefined" && next.applicationName) {
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitle) appleTitle.setAttribute("content", next.applicationName);
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const token = getToken();
      const res = token
        ? await getApplicationSettingsRequest()
        : await getPublicApplicationBrandingRequest();
      applyBranding(applicationDocToForm(res?.data));
    } catch {
      applyBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  }, [applyBranding]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const logos = useMemo(
    () => ({
      application:
        resolveAssetUrl(branding.logoUrl) || DEFAULT_ORGANIZATION_LOGO_URL,
      sidebar:
        resolveAssetUrl(branding.logoSidebarUrl) ||
        resolveAssetUrl(branding.logoUrl) ||
        DEFAULT_ORGANIZATION_LOGO_URL,
      login:
        resolveAssetUrl(branding.loginLogoUrl) ||
        resolveAssetUrl(branding.logoUrl) ||
        DEFAULT_ORGANIZATION_LOGO_URL,
      favicon:
        resolveAssetUrl(branding.faviconUrl) ||
        resolveAssetUrl(branding.logoUrl) ||
        DEFAULT_ORGANIZATION_LOGO_URL,
    }),
    [branding]
  );

  const value = useMemo(
    () => ({
      branding,
      logos,
      loading,
      applicationName: branding.applicationName || DEFAULT_BRANDING.applicationName,
      shortName: branding.shortName || APP_BRANDING_DEFAULTS.shortName,
      developerName: branding.developerName || DEFAULT_BRANDING.developerName,
      copyrightText: branding.copyrightText || "",
      refreshBranding,
    }),
    [branding, logos, loading, refreshBranding]
  );

  return (
    <AppBrandingContext.Provider value={value}>{children}</AppBrandingContext.Provider>
  );
}

export function useAppBranding() {
  const ctx = useContext(AppBrandingContext);
  if (!ctx) {
    throw new Error("useAppBranding must be used within AppBrandingProvider");
  }
  return ctx;
}
