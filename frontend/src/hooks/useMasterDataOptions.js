import { useEffect, useState } from "react";
import { MASTER_DATA_CATEGORY } from "../config/masterDataCategories.js";
import { listMasterDataByCategoryRequest } from "../services/api.js";
import {
  masterDataRowsToOptions,
  masterDataRowsToIncidentalTemplates,
  sortMasterDataRows,
} from "../utils/masterDataOptions.js";

/**
 * Loads dropdown options for a Master Data category (logged-in company via API).
 */
export function useMasterDataOptions(category) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(Boolean(category));

  useEffect(() => {
    if (!category) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listMasterDataByCategoryRequest(category)
      .then((res) => {
        if (cancelled) return;
        setOptions(masterDataRowsToOptions(res?.data));
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  return { options, loading };
}

/** Loads active master data rows for a category (sorted by sequence). */
export function useMasterDataRows(category, { activeOnly = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(category));

  useEffect(() => {
    if (!category) {
      setRows([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    listMasterDataByCategoryRequest(category)
      .then((res) => {
        if (cancelled) return;
        let data = sortMasterDataRows(Array.isArray(res?.data) ? res.data : []);
        if (activeOnly) data = data.filter((r) => r.status === "Active");
        setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, activeOnly]);

  return { rows, loading };
}

/** Active incidental expense templates from master data. */
export function useIncidentalExpenseTemplates() {
  const { rows, loading } = useMasterDataRows(MASTER_DATA_CATEGORY.INCIDENTAL_EXPENSES);
  const templates = masterDataRowsToIncidentalTemplates(rows);
  return { templates, loading };
}
