const KEY = "celeris_pms_auth";
const AUTH_TAB_BRIDGE_KEY = `${KEY}_new_tab_bridge`;

export function getStoredAuth() {
  try {
    const fromSession = sessionStorage.getItem(KEY);
    if (fromSession) return JSON.parse(fromSession);
    const fromLocal = localStorage.getItem(KEY);
    if (fromLocal) return JSON.parse(fromLocal);
  } catch {
    return null;
  }
  return null;
}

export function getToken() {
  return getStoredAuth()?.token ?? null;
}

export function setStoredAuth(payload, remember) {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
  const raw = JSON.stringify(payload);
  if (remember) localStorage.setItem(KEY, raw);
  else sessionStorage.setItem(KEY, raw);
}

export function clearAuth() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
  localStorage.removeItem(AUTH_TAB_BRIDGE_KEY);
}

/** Copy current auth into localStorage so a new tab can restore session-scoped login. */
export function publishAuthForNewTab() {
  try {
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (raw) localStorage.setItem(AUTH_TAB_BRIDGE_KEY, raw);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Open an /app route in a new tab with auth bridged (sessionStorage is not shared across tabs).
 * @param {string} absoluteOrAppPath — full URL or path like `/app/reports/...`
 */
export function openAuthenticatedAppTab(absoluteOrAppPath) {
  publishAuthForNewTab();
  const url = absoluteOrAppPath.startsWith("http")
    ? absoluteOrAppPath
    : `${window.location.origin}${absoluteOrAppPath.startsWith("/") ? absoluteOrAppPath : `/${absoluteOrAppPath}`}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Restore auth in this tab from a help/documentation new-tab bridge, if needed. */
export function consumeAuthTabBridge() {
  if (getToken()) return;
  try {
    const bridged = localStorage.getItem(AUTH_TAB_BRIDGE_KEY);
    if (!bridged) return;
    sessionStorage.setItem(KEY, bridged);
    localStorage.removeItem(AUTH_TAB_BRIDGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Logged-in user object from last login response, or null. */
export function getAuthUser() {
  return getStoredAuth()?.user ?? null;
}

/** Display name for pre-filling revision / profile fields. */
export function getUserDisplayName() {
  const u = getAuthUser();
  if (!u) return "";
  return (
    String(u.name ?? "").trim() ||
    String(u.userCode ?? "").trim() ||
    String(u.userName ?? u.userEmail ?? "").trim() ||
    ""
  );
}
