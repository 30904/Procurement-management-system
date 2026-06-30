import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { deleteMenuItem, previewDownloadMenuItem } from "../../config/tableActionMenuItems.jsx";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import FileUploader from "../../components/common/FileUploader.jsx";
import {
  listFilesRequest,
  listFileCategoriesRequest,
  deleteFileRequest,
  getApiRoot,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  {
    key: "originalName", label: "File Name", width: "26%", align: "left", sortable: true,
    render: (val, row) => {
      const isImage = /^image\//.test(row.mimeType);
      const baseUrl = getApiRoot().replace(/\/api$/, "");
      return (
        <span style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
          {isImage ? (
            <img
              src={`${baseUrl}${row.url}`} alt=""
              style={{ width: "1.8vw", height: "1.8vw", objectFit: "cover", border: "0.06vw solid #e2e8f0", flexShrink: 0 }}
            />
          ) : (
            <span style={{
              width: "1.8vw", height: "1.8vw", display: "flex", alignItems: "center", justifyContent: "center",
              background: "#f1f5f9", border: "0.06vw solid #e2e8f0", fontSize: "0.55vw", color: "#64748b", flexShrink: 0,
            }}>
              {(row.mimeType || "").split("/").pop()?.toUpperCase()?.slice(0, 4) || "FILE"}
            </span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
        </span>
      );
    },
  },
  { key: "category", label: "Category", width: "12%", align: "left", filterable: true, sortable: true },
  {
    key: "size", label: "Size", width: "10%", align: "left", sortable: true,
    render: (val) => {
      if (!val) return "—";
      if (val < 1024) return `${val} B`;
      if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
      return `${(val / (1024 * 1024)).toFixed(1)} MB`;
    },
  },
  { key: "mimeType", label: "Type", width: "12%", align: "left", filterable: true },
  { key: "uploaderName", label: "Uploaded By", width: "14%", align: "left", sortable: true },
  { key: "createdAt", label: "Date", width: "14%", align: "left", sortable: true, type: "date" },
  { key: "action", label: "Action", width: "12%", align: "center" },
];

export default function FileManagerPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (activeCategory) params.category = activeCategory;
      const res = await listFilesRequest(params);
      setRows(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.totalPages || 1);
      setTotal(res?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await listFileCategoriesRequest();
        setCategories(Array.isArray(res?.data) ? res.data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.originalName}"?`)) return;
    try {
      await deleteFileRequest(row._id || row.id);
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== (row._id || row.id)));
      toast.success("File deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handlePreview = (row) => {
    const baseUrl = getApiRoot().replace(/\/api$/, "");
    window.open(`${baseUrl}${row.url}`, "_blank");
  };

  const actionOptions = [
    previewDownloadMenuItem(handlePreview),
    deleteMenuItem(handleDelete),
  ];

  const categoryTabs = ["All", ...categories.map((c) => c.label)];
  const categoryKeyMap = {};
  categories.forEach((c) => { categoryKeyMap[c.label] = c.key; });

  const selectStyle = {
    padding: "0.5vh 0.6vw", fontSize: "0.82vw", fontFamily: "Inter, sans-serif",
    border: "0.08vw solid #d2d2d2", background: "#fff", color: "#334155", cursor: "pointer",
  };

  const btnStyle = {
    padding: "0.6vh 1.2vw", fontSize: "0.85vw", fontWeight: 500, fontFamily: "Inter, sans-serif",
    border: "0.08vw solid", cursor: "pointer",
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
          <span className="erp-breadcrumb-item">File Manager</span>
        </h1>
      </header>

      {/* Category tabs */}
      {categoryTabs.length > 1 && (
        <div className="dropdown-settings-subheaders">
          {categoryTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`dropdown-settings-subheader${
                (tab === "All" && !activeCategory) || categoryKeyMap[tab] === activeCategory
                  ? " dropdown-settings-subheader--active" : ""
              }`}
              onClick={() => { setActiveCategory(tab === "All" ? "" : categoryKeyMap[tab] || ""); setPage(1); }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Upload section (collapsible) */}
      <div className="dropdown-settings-card" style={{ border: "0.08vw solid #d2d2d2", background: "#ffffff", padding: "1.5vh 1.5vw" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1vw", fontWeight: 550, color: "#0046d2", fontFamily: "Inter, sans-serif" }}>
              Upload Files
            </h3>
            <p style={{ margin: "0.3vh 0 0", fontSize: "0.8vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
              {total} file{total !== 1 ? "s" : ""} stored
            </p>
          </div>
          <button type="button"
            onClick={() => setShowUploader(!showUploader)}
            style={{ ...btnStyle, borderColor: "var(--brand-primary)", background: showUploader ? "var(--brand-primary)" : "#fff", color: showUploader ? "#fff" : "var(--brand-primary)" }}>
            {showUploader ? "Hide Uploader" : "Upload New"}
          </button>
        </div>

        {showUploader && (
          <div style={{ marginTop: "1.5vh" }}>
            <div style={{ marginBottom: "1vh", display: "flex", alignItems: "center", gap: "1vw" }}>
              <span style={{ fontSize: "0.82vw", fontWeight: 500, color: "#334155", fontFamily: "Inter, sans-serif" }}>Category:</span>
              <select
                value={activeCategory || "general"}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={selectStyle}
              >
                {categories.map((c) => <option key={c.key} value={c.key}>{c.label} (max {c.maxSizeMB} MB)</option>)}
              </select>
            </div>
            <FileUploader
              category={activeCategory || "general"}
              multiple
              onUpload={() => fetchData()}
            />
          </div>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        showNewBtn={false}
        actions={actionOptions}
        searchPlaceholder="Search files..."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.8vw",
          padding: "1vh 0", fontSize: "0.82vw", fontFamily: "Inter, sans-serif",
        }}>
          <button type="button" disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ ...btnStyle, borderColor: page <= 1 ? "#e2e8f0" : "var(--brand-primary)", background: "#fff", color: page <= 1 ? "#cbd5e1" : "var(--brand-primary)", cursor: page <= 1 ? "not-allowed" : "pointer" }}>
            Previous
          </button>
          <span style={{ color: "#334155" }}>Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ ...btnStyle, borderColor: page >= totalPages ? "#e2e8f0" : "var(--brand-primary)", background: "#fff", color: page >= totalPages ? "#cbd5e1" : "var(--brand-primary)", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
