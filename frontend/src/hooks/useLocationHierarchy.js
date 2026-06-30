import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listLocationsRequest,
  listSubLocationsRequest,
  listInventoryStoresRequest,
} from "../services/api.js";

function parentLocationIdFromRow(row) {
  const p = row?.parentLocation ?? row?.locationId;
  if (!p) return "";
  if (typeof p === "object" && p._id != null) return String(p._id);
  return String(p);
}

function isActiveRow(row) {
  if (row?.isActive === false) return false;
  const status = String(row?.status ?? "Active").trim().toLowerCase();
  return status !== "inactive";
}

/**
 * Location Master + sub-locations + inventory stores for a selected location.
 * Sub-locations and stores reload when `selectedLocationId` changes.
 * @param {string} selectedLocationId — Location Master `_id`
 */
export function useLocationHierarchy(selectedLocationId) {
  const [locations, setLocations] = useState([]);
  const [subLocations, setSubLocations] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingLocations(true);
    listLocationsRequest()
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setLocations(rows.filter(isActiveRow));
      })
      .catch(() => {
        if (active) setLocations([]);
      })
      .finally(() => {
        if (active) setLoadingLocations(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const parentId = String(selectedLocationId || "").trim();
    if (!parentId) {
      setSubLocations([]);
      setStores([]);
      setLoadingChildren(false);
      return undefined;
    }

    let active = true;
    setLoadingChildren(true);
    setSubLocations([]);
    setStores([]);

    Promise.all([
      listSubLocationsRequest("", parentId),
      listInventoryStoresRequest(parentId),
    ])
      .then(([subRes, storeRes]) => {
        if (!active) return;
        const subRows = Array.isArray(subRes?.data) ? subRes.data : [];
        const filteredSubs = subRows.filter((row) => {
          if (!isActiveRow(row)) return false;
          return parentLocationIdFromRow(row) === parentId;
        });
        setSubLocations(filteredSubs);
        const storeRows = Array.isArray(storeRes?.data) ? storeRes.data : [];
        setStores(storeRows.filter(isActiveRow));
      })
      .catch(() => {
        if (!active) return;
        setSubLocations([]);
        setStores([]);
      })
      .finally(() => {
        if (active) setLoadingChildren(false);
      });

    return () => {
      active = false;
    };
  }, [selectedLocationId]);

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        value: String(l._id),
        label: l.isCentral ? `HO · ${l.name || l.locationId}` : l.name || l.locationId,
      })),
    [locations]
  );

  const subLocationOptions = useMemo(
    () =>
      subLocations.map((s) => ({
        value: String(s._id),
        label: s.subLocationName || s.subLocationId || s.subLocationCode,
      })),
    [subLocations]
  );

  const storeOptions = useMemo(
    () =>
      stores.map((s) => ({
        value: String(s._id),
        label: `${s.storeCode} — ${s.storeName}`,
        storeCode: s.storeCode,
        storeName: s.storeName,
      })),
    [stores]
  );

  const getStoreOption = useCallback(
    (id) => storeOptions.find((o) => o.value === String(id)),
    [storeOptions]
  );

  const getSubLocationOption = useCallback(
    (id) => subLocationOptions.find((o) => o.value === String(id)),
    [subLocationOptions]
  );

  return {
    locationOptions,
    subLocationOptions,
    storeOptions,
    loadingLocations,
    loadingChildren,
    getStoreOption,
    getSubLocationOption,
  };
}
