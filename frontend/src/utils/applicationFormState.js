import {
  ENTERPRISE_ACCENT,
  ENTERPRISE_PRIMARY,
  normalizeThemeAccentColor,
  normalizeThemePrimaryColor,
} from "./enterpriseTheme.js";

export function emptyApplicationForm() {
  return {
    applicationName: "",
    shortName: "",
    version: "",
    buildNumber: "",
    tagline: "",
    description: "",
    developerName: "",
    supportEmail: "",
    supportPhone: "",
    websiteUrl: "",
    copyrightText: "",
    environment: "production",
    themePrimaryColor: "#0F7C94",
    themeAccentColor: "#DC2626",
    logoUrl: "",
    logoSidebarUrl: "",
    faviconUrl: "",
    loginLogoUrl: "",
  };
}

export function applicationDocToForm(doc) {
  if (!doc) return emptyApplicationForm();
  return {
    applicationName: doc.applicationName ?? "",
    shortName: doc.shortName ?? "",
    version: doc.version ?? "",
    buildNumber: doc.buildNumber ?? "",
    tagline: doc.tagline ?? "",
    description: doc.description ?? "",
    developerName: doc.developerName ?? "",
    supportEmail: doc.supportEmail ?? "",
    supportPhone: doc.supportPhone ?? "",
    websiteUrl: doc.websiteUrl ?? "",
    copyrightText: doc.copyrightText ?? "",
    environment: doc.environment ?? "production",
    themePrimaryColor: normalizeThemePrimaryColor(doc.themePrimaryColor),
    themeAccentColor: normalizeThemeAccentColor(doc.themeAccentColor),
    logoUrl: doc.logoUrl ?? "",
    logoSidebarUrl: doc.logoSidebarUrl ?? "",
    faviconUrl: doc.faviconUrl ?? "",
    loginLogoUrl: doc.loginLogoUrl ?? "",
  };
}

export function applicationFormToPayload(form) {
  return {
    applicationName: form.applicationName.trim(),
    shortName: form.shortName.trim(),
    version: form.version.trim(),
    buildNumber: form.buildNumber.trim(),
    tagline: form.tagline.trim(),
    description: form.description.trim(),
    developerName: form.developerName.trim(),
    supportEmail: form.supportEmail.trim(),
    supportPhone: form.supportPhone.trim(),
    websiteUrl: form.websiteUrl.trim(),
    copyrightText: form.copyrightText.trim(),
    environment: form.environment,
    themePrimaryColor: form.themePrimaryColor.trim(),
    themeAccentColor: form.themeAccentColor.trim(),
  };
}

export function validateApplicationForm(form) {
  const errors = {};
  if (!form.applicationName.trim()) errors.applicationName = "Required";
  if (!form.version.trim()) errors.version = "Required";
  if (!form.developerName.trim()) errors.developerName = "Required";
  return errors;
}

/** Resolve stored upload path to a fetchable URL */
export function resolveAssetUrl(assetPath) {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return assetPath;
  const base = raw.replace(/\/api$/i, "");
  return `${base}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
