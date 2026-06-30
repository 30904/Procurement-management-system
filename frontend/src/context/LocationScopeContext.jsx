import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getToken } from "../utils/authStorage.js";
import { getActiveLocationId, setActiveLocationId } from "../utils/activeLocationStorage.js";
import {
  getFrameworkSessionRequest,
  getMyLocationsRequest,
  setActiveLocationRequest,
} from "../services/api.js";

const LocationScopeContext = createContext(null);

export function LocationScopeProvider({ children }) {
  const [mode, setMode] = useState("restricted");
  const [locations, setLocations] = useState([]);
  const [activeLocationId, setActiveLocationIdState] = useState(getActiveLocationId());
  const [defaultLocationId, setDefaultLocationId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadScope = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLocations([]);
      setMode("restricted");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [sessionRes, mineRes] = await Promise.all([
        getFrameworkSessionRequest(),
        getMyLocationsRequest().catch(() => null),
      ]);

      const scope = sessionRes?.data?.locationScope || mineRes?.data || {};
      const locs = scope.locations || [];
      setLocations(locs);
      setMode(scope.mode || "restricted");
      setDefaultLocationId(scope.defaultLocationId ? String(scope.defaultLocationId) : null);

      const stored = getActiveLocationId();
      const sessionActive = scope.activeLocationId ? String(scope.activeLocationId) : null;
      const allowed = new Set(locs.map((l) => String(l._id)));

      let next = stored && allowed.has(stored) ? stored : sessionActive;
      if (!next && scope.defaultLocationId) next = String(scope.defaultLocationId);
      if (!next && locs[0]?._id) next = String(locs[0]._id);

      if (next) {
        setActiveLocationId(next);
        setActiveLocationIdState(next);
      }
    } catch (err) {
      console.error("Location scope load failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScope();
  }, [loadScope]);

  const setActiveLocation = useCallback(async (locationId) => {
    const id = locationId ? String(locationId) : "";
    if (!id) return;
    setActiveLocationId(id);
    setActiveLocationIdState(id);
    try {
      await setActiveLocationRequest(id);
    } catch {
      /* header is source of truth for APIs */
    }
    await loadScope();
  }, [loadScope]);

  const activeLocation = useMemo(
    () => locations.find((l) => String(l._id) === String(activeLocationId)) || null,
    [locations, activeLocationId]
  );

  const value = useMemo(
    () => ({
      mode,
      locations,
      activeLocationId,
      activeLocation,
      defaultLocationId,
      loading,
      setActiveLocation,
      refreshLocationScope: loadScope,
      showSwitcher: locations.length > 1 || mode === "all",
    }),
    [
      mode,
      locations,
      activeLocationId,
      activeLocation,
      defaultLocationId,
      loading,
      setActiveLocation,
      loadScope,
    ]
  );

  return (
    <LocationScopeContext.Provider value={value}>{children}</LocationScopeContext.Provider>
  );
}

export function useLocationScope() {
  const ctx = useContext(LocationScopeContext);
  if (!ctx) {
    return {
      mode: "restricted",
      locations: [],
      activeLocationId: null,
      activeLocation: null,
      loading: false,
      setActiveLocation: async () => {},
      refreshLocationScope: async () => {},
      showSwitcher: false,
    };
  }
  return ctx;
}
