import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import CsvImportModal from "../../components/modals/CsvImportModal.jsx";
import { listCsvProfilesRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function BulkImportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await listCsvProfilesRequest();
        setProfiles(Array.isArray(res?.data) ? res.data : []);
      } catch {
        toast.error("Failed to load import profiles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cardStyle = {
    border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2.5vh 2vw",
    display: "flex", flexDirection: "column", gap: "1vh", cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const colDotStyle = (req) => ({
    display: "inline-block", width: "0.4vw", height: "0.4vw", borderRadius: 0,
    background: req ? "#dc2626" : "#94a3b8", marginRight: "0.3vw",
  });

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Bulk CSV Import</span>
        </h1>
      </header>

      {/* Description */}
      <div className="dropdown-settings-card" style={{
        border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "2vh 2vw",
      }}>
        <h3 style={{ margin: 0, fontSize: "1.05vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
          Import Data via CSV
        </h3>
        <p style={{ margin: "0.5vh 0 0", fontSize: "0.85vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
          Select a data type below to download its CSV template, fill in your data, upload, preview, and import.
          Any application module can register its own import profile — the framework handles parsing, validation, and insertion.
        </p>
      </div>

      {/* Profile cards grid */}
      {loading ? null : profiles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "6vh 0", fontSize: "0.9vw", color: "#94a3b8", fontFamily: "Inter, sans-serif" }}>
          No import profiles registered.
        </div>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(22vw, 1fr))",
          gap: "1.5vw",
        }}>
          {profiles.map((p) => (
            <div
              key={p.key}
              style={cardStyle}
              className="dropdown-settings-card"
              onClick={() => setActiveProfile(p)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-primary)"; e.currentTarget.style.boxShadow = "0 0.15vw 0.6vw var(--brand-primary-10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#d2d2d2"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h4 style={{ margin: 0, fontSize: "1vw", fontWeight: 600, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
                  {p.label}
                </h4>
                <span style={{
                  fontSize: "0.7vw", fontWeight: 500, color: "var(--brand-primary)", background: "#e8f2ff",
                  padding: "0.15vw 0.5vw", fontFamily: "Inter, sans-serif",
                }}>
                  {p.modelName}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vw 1vw", marginTop: "0.5vh" }}>
                {p.columns.map((col) => (
                  <span key={col.field} style={{
                    fontSize: "0.76vw", color: "#64748b", fontFamily: "Inter, sans-serif",
                    display: "flex", alignItems: "center",
                  }}>
                    <span style={colDotStyle(col.required)} />
                    {col.csv}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "1vh" }}>
                <span style={{
                  fontSize: "0.8vw", fontWeight: 500, color: "var(--brand-primary)",
                  fontFamily: "Inter, sans-serif",
                }}>
                  Start Import &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {!loading && profiles.length > 0 && (
        <div style={{ display: "flex", gap: "1.5vw", fontSize: "0.76vw", color: "#94a3b8", fontFamily: "Inter, sans-serif", paddingTop: "0.5vh" }}>
          <span><span style={{ ...colDotStyle(true), verticalAlign: "middle" }} /> Required</span>
          <span><span style={{ ...colDotStyle(false), verticalAlign: "middle" }} /> Optional</span>
        </div>
      )}

      {activeProfile && (
        <CsvImportModal
          profileKey={activeProfile.key}
          profileLabel={activeProfile.label}
          onClose={() => setActiveProfile(null)}
          onComplete={() => toast.success("Import completed")}
        />
      )}
    </div>
  );
}
