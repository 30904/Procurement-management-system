const KEY = "celeris_active_location_id";

export function getActiveLocationId() {
  try {
    return String(sessionStorage.getItem(KEY) || "").trim() || null;
  } catch {
    return null;
  }
}

export function setActiveLocationId(id) {
  try {
    if (!id) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(id));
  } catch {
    /* ignore */
  }
}
