import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, editMenuItem } from "../../config/tableActionMenuItems.jsx";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import AutoIncrementModal from "../../components/modals/AutoIncrementModal.jsx";
import {
  listAutoIncrementRequest,
  createAutoIncrementRequest,
  updateAutoIncrementRequest,
  deleteAutoIncrementRequest,
  listLocationsRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { filterAutoIncrementRowsForLocation } from "../../utils/filterAutoIncrementByLocation.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "moduleName", label: "Module Name", width: "26%", align: "left", sortable: true },
  { key: "module", label: "Module", width: "10%", align: "left", sortable: true },
  { key: "allocationScope", label: "Scope", width: "10%", align: "center", sortable: true },
  { key: "locationCode", label: "Location", width: "10%", align: "left", sortable: true },
  { key: "modulePrefix", label: "Module Prefix", width: "12%", align: "left", sortable: true },
  { key: "autoIncrementValue", label: "Auto Increment value", width: "16%", align: "center", sortable: true },
  { key: "digit", label: "Digit", width: "8%", align: "center", sortable: true },
  { key: "nextPreview", label: "Next Preview", width: "14%", align: "left" },
  { key: "action", label: "Action", width: "10%", align: "center" },
];

function formatPreview(row) {
  const next = (Number(row.autoIncrementValue) || 0) + 1;
  const pad = Number(row.digit) || 4;
  const prefix = String(row.modulePrefix || row.module || "").toUpperCase();
  return `${prefix}/${String(next).padStart(pad, "0")}`;
}

function decorateRow(row, locationOptions = []) {
  const locationId = row.locationId ? String(row.locationId) : "";
  const loc = locationOptions.find((o) => o.value === locationId);
  return {
    ...row,
    allocationScope: row.allocationScope || (locationId ? "LOCATION" : "CENTRAL"),
    locationCode: row.locationCode || loc?.label || "",
    nextPreview: formatPreview(row),
  };
}

export default function AutoIncrementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const { setFooterContent } = useFooter();
  const { activeLocation, activeLocationId } = useLocationScope();

  const displayRows = useMemo(
    () => filterAutoIncrementRowsForLocation(rows, activeLocationId),
    [rows, activeLocationId]
  );

  const activeLocationLabel = useMemo(() => {
    if (!activeLocation) return "";
    const ho = activeLocation.isCentral ? "HO · " : "";
    return `${ho}${activeLocation.name || activeLocation.locationId || "Location"}`;
  }, [activeLocation]);

  const fetchData = useCallback(async (locOpts = []) => {
    setLoading(true);
    try {
      const res = await listAutoIncrementRequest();
      const list = Array.isArray(res?.data) ? res.data : [];
      setRows(list.map((r) => decorateRow(r, locOpts)));
    } catch (err) {
      console.error("Failed to fetch auto increment:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let locOpts = [];
      try {
        const locRes = await listLocationsRequest();
        const locRows = Array.isArray(locRes?.data) ? locRes.data : [];
        locOpts = locRows.map((loc) => ({
          value: String(loc._id || loc.id || ""),
          label: String(loc.locationId || loc.locationName || loc.name || "Location"),
        }));
        if (!cancelled) setLocationOptions(locOpts);
      } catch {
        if (!cancelled) setLocationOptions([]);
      }

      try {
        const res = await listAutoIncrementRequest();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setRows(list.map((r) => decorateRow(r, locOpts)));
      } catch (err) {
        console.error("Failed to fetch auto increment:", err);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  DataTable.useRecordCount(displayRows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete auto increment module "${row.module}"?`)) return;
    try {
      await deleteAutoIncrementRequest(row._id || row.id);
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== (row._id || row.id)));
      toast.success("Entry deleted.");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const ACTION_OPTIONS = [
    editMenuItem((row) => {
      setEditRow(row);
      setModalOpen(true);
    }),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  const handleSave = async (form, recordId) => {
    const targetId = recordId || editRow?._id || editRow?.id;

    if (targetId) {
      const res = await updateAutoIncrementRequest(targetId, form);
      const updated = res?.data || { ...form, _id: targetId };
      setRows((prev) =>
        prev.map((r) =>
          (r._id || r.id) === targetId ? decorateRow({ ...r, ...updated, ...form }, locationOptions) : r
        )
      );
    } else {
      const res = await createAutoIncrementRequest(form);
      const newDoc = res?.data || { ...form };
      setRows((prev) => [...prev, decorateRow(newDoc, locationOptions)]);
    }
    setModalOpen(false);
    setEditRow(null);
  };

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Auto Increment</span>
        </h1>
      </header>

      {activeLocationId ? (
        <p className={styles.locationScopeNote}>
          Showing central series and location-specific rules for{" "}
          <strong>{activeLocationLabel}</strong>. Change the header location to view another site.
        </p>
      ) : null}

      <DataTable
        columns={COLUMNS}
        rows={displayRows}
        loading={loading}
        actions={ACTION_OPTIONS}
        onNew={() => {
          setEditRow(null);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <AutoIncrementModal
          initialData={editRow}
          allRows={rows}
          onClose={() => {
            setModalOpen(false);
            setEditRow(null);
          }}
          onSave={handleSave}
          locationOptions={locationOptions}
          defaultActiveLocationId={activeLocationId || ""}
        />
      )}
    </div>
  );
}
