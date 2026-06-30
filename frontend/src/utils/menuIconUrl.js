/** Resolve API-relative menu icon URL to a fetchable URL */
export function resolveMenuIconUrl(assetPath) {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return assetPath;
  const base = raw.replace(/\/api$/i, "");
  return `${base}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
}
