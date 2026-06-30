import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, editMenuItem, subLocationMenuItem } from "../../config/tableActionMenuItems.jsx";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import { useFooter } from "../../context/FooterContext.jsx";
import {
  listLocationsRequest,
  deleteLocationRequest,
  getLocationSummaryRequest,
} from "../../services/api.js";
import SubLocationModal from "../../components/modals/SubLocationModal.jsx";
import ActionDropdown from "../../components/common/ActionDropdown.jsx";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import SearchIcon from "../../assets/search-icon.svg?react";
import NoRecordsIcon from "../../assets/no_records.svg";
import ActionPinkIcon from "../../assets/action-pink.svg";
import layoutStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./LocationMasterPage.module.css";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "registrationDate", label: "Registration Date", width: "11%", align: "center" },
  { key: "locationId", label: "Location ID", width: "13%", align: "left" },
  { key: "name", label: "Name", width: "13%", align: "left" },
  { key: "isCentral", label: "HO", width: "6%", align: "center" },
  { key: "locationType", label: "Location Type", width: "13%", align: "left" },
  { key: "operationalCategory", label: "Operational Category", width: "14%", align: "left" },
  { key: "gstin", label: "GSTIN", width: "14%", align: "center" },
  { key: "status", label: "Status", width: "8%", align: "center" },
  { key: "action", label: "", width: "8%", align: "center" },
];

function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function LocationMasterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isSuperAdmin, loading: permsLoading, checkPermission } = usePermissions();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [subLocParent, setSubLocParent] = useState(null);

  const listPath = appPath("configuration/location-master");

  const canAccess = isSuperAdmin || checkPermission("location_master").enabled;

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLocationsRequest(searchQuery);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.map((r) => ({
          ...r,
          id: String(r._id || r.id),
        }))
      );
      if (res?.stats) setSummary(res.stats);
    } catch (err) {
      toast.error(err?.message || "Failed to load locations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getLocationSummaryRequest();
      setSummary(res?.data || null);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    const t = setTimeout(() => fetchLocations(), 300);
    return () => clearTimeout(t);
  }, [canAccess, fetchLocations]);

  useEffect(() => {
    if (showSummary) fetchSummary();
  }, [showSummary, fetchSummary]);

  useEffect(() => {
    setFooterContent(`Total Records  ->  ${rows.length}`);
    return () => setFooterContent(null);
  }, [rows.length, setFooterContent]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete location "${row.locationId}"?`)) return;
    try {
      await deleteLocationRequest(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Location deleted");
      fetchSummary();
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const actionOptions = [
    editMenuItem((row) => navigate(`${listPath}/${row.id}/edit`)),
    subLocationMenuItem((row) => setSubLocParent(row)),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  if (!permsLoading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (permsLoading) return null;

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton
          onClick={() => navigate(appPath("configuration"))}
          ariaLabel="Back to Settings"
        />
        <h1 className={`erp-breadcrumb erp-breadcrumb--page-title ${pageStyles.pageTitle}`}>
          Location Master
        </h1>
        <span style={{ width: "2.5rem" }} aria-hidden />
      </header>

      {showSummary && summary && (
        <div className={pageStyles.summaryPanel}>
          <span className={pageStyles.summaryItem}>
            <strong>Total:</strong> {summary.total ?? 0}
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Active:</strong> {summary.active ?? 0}
          </span>
          <span className={pageStyles.summaryItem}>
            <strong>Inactive:</strong> {summary.inactive ?? 0}
          </span>
          {summary.byType &&
            Object.entries(summary.byType).map(([type, count]) => (
              <span key={type} className={pageStyles.summaryItem}>
                <strong>{type}:</strong> {count}
              </span>
            ))}
        </div>
      )}

      <div className="im-toolbar">
        <div className={pageStyles.toolbarLeft}>
          <button
            type="button"
            className={`${pageStyles.summaryBtn} ${showSummary ? pageStyles.summaryBtnActive : ""}`}
            onClick={() => setShowSummary((s) => !s)}
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
        <button
          type="button"
          className={pageStyles.addLocationBtn}
          onClick={() => navigate(`${listPath}/new`)}
        >
          + Location
        </button>
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
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align }}>
                        {col.key === "registrationDate" && formatDate(row.registrationDate)}
                        {col.key === "locationId" && (
                          <button
                            type="button"
                            className={`im-table-name-column ${pageStyles.linkName}`}
                            onClick={() => navigate(`${listPath}/${row.id}/edit`)}
                          >
                            {row.locationId}
                          </button>
                        )}
                        {col.key === "name" && (row.name || row.locationId || "—")}
                        {col.key === "isCentral" && (row.isCentral ? "Yes" : "—")}
                        {col.key === "locationType" && (row.locationType || "—")}
                        {col.key === "operationalCategory" && (row.operationalCategory || "—")}
                        {col.key === "gstin" && (row.gstin || "—")}
                        {col.key === "status" && (
                          <span className="im-status">
                            <span
                              className={`im-status-dot ${
                                row.status === "Inactive" ? "im-status-dot--inactive" : ""
                              }`}
                            />
                            {row.status || "Active"}
                          </span>
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
          parentLocation={subLocParent}
          onClose={() => setSubLocParent(null)}
          onSaved={() => fetchLocations()}
        />
      )}
    </div>
  );
}
