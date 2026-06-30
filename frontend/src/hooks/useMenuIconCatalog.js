import { useCallback, useEffect, useState } from "react";
import { listFrameworkMenuIconsRequest } from "../services/api.js";
import { MENU_ICON_OPTIONS } from "../config/iconRegistry.js";

function builtinFallback() {
  return MENU_ICON_OPTIONS.map(({ key, label }) => ({
    code: key,
    label,
    source: "builtin",
    iconUrl: null,
    activeIconUrl: null,
  }));
}

export function useMenuIconCatalog({ enabled = true } = {}) {
  const [icons, setIcons] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listFrameworkMenuIconsRequest();
      setIcons(Array.isArray(res?.data) ? res.data : builtinFallback());
    } catch (err) {
      setIcons(builtinFallback());
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { icons: icons ?? builtinFallback(), loading, error, reload };
}
