import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, subLocationMenuItem } from "../../config/tableActionMenuItems.jsx";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { useFooter } from "../../context/FooterContext.jsx";
import {
  listSubLocationsRequest,
  deleteSubLocationRequest,
  getSubLocationSummaryRequest,
  getSubLocationStatusSummaryRequest,
} from "../../services/api.js";
import SubLocationModal from "../../components/modals/SubLocationModal.jsx";
import ActionDropdown from "../../components/common/ActionDropdown.jsx";
import SearchIcon from "../../assets/search-icon.svg?react";
import NoRecordsIcon from "../../assets/no_records.svg";
import ActionPinkIcon from "../../assets/action-pink.svg";
import layoutStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./SubLocationsPage.module.css";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "parentLocationLabel", label: "Parent Location", width: "16%", align: "left" },
  { key: "subLocationCode", label: "Code", width: "10%", align: "center" },
  { key: "subLocationName", label: "Sub Location Name", width: "18%", align: "left" },
  { key: "subLocationId", label: "Sub Location ID", width: "14%", align: "left" },
  { key: "description", label: "Description", width: "18%", align: "left" },
  { key: "status", label: "Status", width: "8%", align: "center" },
  { key: "action", label: "", width: "8%", align: "center" },
];

export default function SubLocationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isSuperAdmin, loading: permsLoading, checkPermission } = usePermissions();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationSummary, setShowLocationSummary] = useState(false);
  const [showStatusSummary, setShowStatusSummary] = useState(false);
  const [locationSummary, setLocationSummary] = useState(null);
  const [statusSummary, setStatusSummary] = useState(null);
  const [subLocParent, setSubLocParent] = useState(null);

  const canAccess = isSuperAdmin || checkPermission("sub_locations").enabled;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSubLocationsRequest(searchQuery);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.map((r) => ({
          ...r,
          id: String(r._id || r.id),
          parentLocationLabel:
            r.parentLocation?.locationId ||
            r.parentLocation?.name ||
            "—",
          subLocationName: r.subLocationName || r.subLocationId || "—",
        }))
      );
      if (res?.stats) setLocationSummary(res.stats);
    } catch (err) {
      toast.error(err?.message || "Failed to load sub-locations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  const fetchLocationSummary = useCallback(async () => {
    try {
      const res = await getSubLocationSummaryRequest();
      setLocationSummary(res?.data || null);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchStatusSummary = useCallback(async () => {
    try {
      const res = await getSubLocationStatusSummaryRequest();
      setStatusSummary(res?.data || null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    const t = setTimeout(() => fetchRows(), 300);
    return () => clearTimeout(t);
  }, [canAccess, fetchRows]);

  useEffect(() => {
    if (showLocationSummary) fetchLocationSummary();
  }, [showLocationSummary, fetchLocationSummary]);

  useEffect(() => {
    if (showStatusSummary) fetchStatusSummary();
  }, [showStatusSummary, fetchStatusSummary]);

  useEffect(() => {
    setFooterContent(`Total Records  ->  ${rows.length}`);
    return () => setFooterContent(null);
  }, [rows.length, setFooterContent]);

  const openCreate = () => setSubLocParent({});

  const refreshAfterModal = () => {
    fetchRows();
    if (showLocationSummary) fetchLocationSummary();
    if (showStatusSummary) fetchStatusSummary();
  };

  const openSubLocForRow = (row) => {
    const parentId =
      row.parentLocation?._id || row.parentLocation?.id || row.parentLocation;
    const parentLabel = row.parentLocation?.locationId || "";
    if (!parentId) {
      toast.error("Parent location not found for this row");
      return;
    }
    setSubLocParent({
      id: String(parentId),
      locationId: parentLabel,
      locationType: row.locationType,
      operationalCategory: row.operationalCategory,
      gstin: row.gstin,
    });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete sub-location "${row.subLocationId}"?`)) return;
    try {
      await deleteSubLocationRequest(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Sub-location deleted");
      if (showLocationSummary) fetchLocationSummary();
      if (showStatusSummary) fetchStatusSummary();
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const actionOptions = [
    subLocationMenuItem((row) => openSubLocForRow(row)),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  if (!permsLoading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (permsLoading) return null;

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.pageTitle}`}>
          Sub Location Master
        </h1>
        <span style={{ width: "2.5rem" }} aria-hidden />
      </header>

      {showLocationSummary && locationSummary && (
        <div className={pageStyles.summaryPanel}>
          <span className={pageStyles.summaryItem}>
            <strong>Total:</strong> {locationSummary.total ?? 0}
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Active:</strong> {locationSummary.active ?? 0}
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Inactive:</strong> {locationSummary.inactive ?? 0}
          </span>
          {locationSummary.byType &&
            Object.entries(locationSummary.byType).map(([type, count]) => (
              <span key={type} className={pageStyles.summaryItem}>
                <strong>{type}:</strong> {count}
              </span>
            ))}
          <button type="button" className={pageStyles.addBtn} onClick={openCreate}>
            + Sub-location
          </button>
        </div>
      )}

      {showStatusSummary && statusSummary && (
        <div className={`${pageStyles.summaryPanel} ${pageStyles.statusPanel}`}>
          <span className={pageStyles.summaryItem}>
            <strong>Total:</strong> {statusSummary.total ?? 0}
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Active:</strong> {statusSummary.active ?? 0} ({statusSummary.activePercent ?? 0}%)
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Inactive:</strong> {statusSummary.inactive ?? 0} ({statusSummary.inactivePercent ?? 0}%)
          </span>
        </div>
      )}

      <div className="im-toolbar">
        <div className={pageStyles.toolbarLeft}>
          <button
            type="button"
            className={`${pageStyles.summaryBtn} ${showLocationSummary ? pageStyles.summaryBtnActive : ""}`}
            onClick={() => setShowLocationSummary((s) => !s)}
          >
            Location Summary
          </button>
          <div className="erp-search-wrap">
            <SearchIcon className="erp-search-icon" aria-hidden />
            <input
              type="text"
              className="erp-search-input"
              placeholder="Search here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className={pageStyles.toolbarRight}>
          <button
            type="button"
            className={`${pageStyles.statusSummaryBtn} ${showStatusSummary ? pageStyles.statusSummaryBtnActive : ""}`}
            onClick={() => setShowStatusSummary((s) => !s)}
          >
            Status Summary
          </button>
        </div>
      </div>

      <div className="im-page-wrap">
        <div className="im-table-scroll">
          <table className="im-table im-table--master">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} style={{ width: col.width }}>
                    <div
                      className={`im-header-content ${col.align === "left" ? "im-table-name-column" : ""}`}
                      style={{
                        justifyContent: col.align === "left" ? "flex-start" : "center",
                      }}
                    >
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="im-empty-row">
                  <td colSpan={COLUMNS.length} className="im-empty-cell">
                    <span className="im-no-records__text">Loading…</span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr className="im-empty-row">
                  <td colSpan={COLUMNS.length} className="im-empty-cell">
                    <div className="im-no-records">
                      <img src={NoRecordsIcon} alt="" className="im-no-records__icon" />
                      <span className="im-no-records__text">No records found</span>
                      <button
                        type="button"
                        className={pageStyles.addBtn}
                        style={{ marginTop: "1rem" }}
                        onClick={openCreate}
                      >
                        + Sub-location
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align }}>
                        {col.key === "parentLocationLabel" && (
                          <span className="im-table-name-column">{row.parentLocationLabel}</span>
                        )}
                        {col.key === "subLocationCode" && (row.subLocationCode || "—")}
                        {col.key === "subLocationName" && (
                          <span className="im-table-name-column">{row.subLocationName}</span>
                        )}
                        {col.key === "subLocationId" && (row.subLocationId || "—")}
                        {col.key === "description" && (row.description || "—")}
                        {col.key === "status" && (
                          <span
                            className={`${pageStyles.statusDotActive} ${
                              row.status === "Inactive" ? pageStyles.statusDotInactive : ""
                            }`}
                            title={row.status || "Active"}
                            aria-label={row.status || "Active"}
                          />
                        )}
                        {col.key === "action" && (
                          <ActionDropdown
                            icon={ActionPinkIcon}
                            options={actionOptions}
                            row={row}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {subLocParent && (
        <SubLocationModal
          parentLocation={subLocParent.id ? subLocParent : null}
          onClose={() => setSubLocParent(null)}
          onSaved={refreshAfterModal}
        />
      )}
    </div>
  );
}
