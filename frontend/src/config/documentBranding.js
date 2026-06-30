import mpbcdcLogo from "../assets/mpbcdc.jpg";
import { resolveAssetUrl } from "../utils/applicationFormState.js";

/** Bundled MPBCDC emblem — used when no logo is uploaded in Application Setup. */
export const DEFAULT_ORGANIZATION_LOGO_URL = mpbcdcLogo;

export const DEFAULT_ORGANIZATION_LOGO_ALT =
  "Mahatma Phule Backward Class Development Corporation Ltd., Mumbai";

/**
 * Logo for print/PDF documents: Application Setup upload wins, else bundled MPBCDC logo.
 * @param {{ application?: object, companyName?: string } | null | undefined} company
 */
export function resolveOrganizationLogoUrl(company) {
  const app = company?.application || {};
  const uploaded =
    resolveAssetUrl(app.logoUrl) ||
    resolveAssetUrl(app.logoSidebarUrl) ||
    resolveAssetUrl(app.loginLogoUrl);
  return uploaded || DEFAULT_ORGANIZATION_LOGO_URL;
}

export function resolveOrganizationLogoAlt(company) {
  return (
    String(company?.companyName || "").trim() ||
    DEFAULT_ORGANIZATION_LOGO_ALT
  );
}
