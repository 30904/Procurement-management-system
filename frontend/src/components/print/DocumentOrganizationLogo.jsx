import {
  resolveOrganizationLogoAlt,
  resolveOrganizationLogoUrl,
} from "../../config/documentBranding.js";

/** Organization logo for procurement print documents (PO, GRN, indent, etc.). */
export default function DocumentOrganizationLogo({ company, className = "", alt }) {
  const src = resolveOrganizationLogoUrl(company);
  const label = alt || resolveOrganizationLogoAlt(company);
  return <img src={src} alt={label} className={className} />;
}
