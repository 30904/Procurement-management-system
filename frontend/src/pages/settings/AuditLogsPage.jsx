import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { deleteMenuItem, viewDetailsMenuItem } from "../../config/tableActionMenuItems.jsx";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import {
  listAuditLogsRequest,
  getAuditModelNamesRequest,
  deleteAuditLogRequest,
  clearAllAuditLogsRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";
import styles from "../../styles/page-toolbar.module.css";

const ACTION_CHOICES = ["CREATE", "UPDATE", "DELETE"];

const COLUMNS = [
  { key: "createdAt",  label: "Date & Time",  width: "16%", align: "left", sortable: true, type: "date" },
  { key: "action",     label: "Action",        width: "10%", align: "left", filterable: true, sortable: true },
  { key: "modelName",  label: "Model",         width: "12%", align: "left", filterable: true, sortable: true },
  { key: "summary",    label: "Summary",       width: "30%", align: "left" },
  { key: "userName",   label: "User",          width: "14%", align: "left", filterable: true, sortable: true },
  { key: "ipAddress",  label: "IP",            width: "10%", align: "left" },
  { key: "action_col", label: "Action",        width: "8%",  align: "center" },
];

const ACTION_TAG_COLORS = {
  CREATE: { bg: "#e8f5e9", color: "#2e7d32" },
  UPDATE: { bg: "#fff3e0", color: "#e65100" },
  DELETE: { bg: "#ffebee", color: "#c62828" },
};

export default function AuditLogsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelNames, setModelNames] = useState([]);

  const [filterAction, setFilterAction] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filterAction) params.action = filterAction;
      if (filterModel) params.modelName = filterModel;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const res = await listAuditLogsRequest(params);
      setRows(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.totalPages || 1);
      setTotal(res?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterModel, filterFrom, filterTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAuditModelNamesRequest();
        setModelNames(Array.isArray(res?.data) ? res.data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this audit log entry?")) return;
    try {
      await deleteAuditLogRequest(row._id || row.id);
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== (row._id || row.id)));
      toast.success("Log entry deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will permanently delete ALL audit logs. Continue?")) return;
    try {
      const res = await clearAllAuditLogsRequest();
      setRows([]);
      setTotal(0);
      toast.success(res?.message || "All logs cleared");
    } catch (err) {
      toast.error(err?.message || "Failed to clear logs");
    }
  };

  const resetFilters = () => {
    setFilterAction("");
    setFilterModel("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
  };

  const hasFilters = filterAction || filterModel || filterFrom || filterTo;

  const actionOptions = [
    viewDetailsMenuItem((row) => setDetailRow(row)),
    deleteMenuItem(handleDelete),
  ];

  const [detailRow, setDetailRow] = useState(null);

  const renderDateCell = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const renderActionTag = (val) => {
    const style = ACTION_TAG_COLORS[val] || { bg: "#f1f5f9", color: "#334155" };
    return (
      <span style={{
        display: "inline-block", padding: "0.15vw 0.5vw",
        fontSize: "0.72vw", fontWeight: 600, fontFamily: "Inter, sans-serif",
        borderRadius: 0, background: style.bg, color: style.color,
      }}>
        {val}
      </span>
    );
  };

  const enhancedColumns = COLUMNS.map((col) => {
    if (col.key === "createdAt") return { ...col, render: (val) => renderDateCell(val) };
    if (col.key === "action") return { ...col, render: (val) => renderActionTag(val) };
    return col;
  });

  const selectStyle = {
    padding: "0.5vh 0.6vw", fontSize: "0.82vw", fontFamily: "Inter, sans-serif",
    border: "0.08vw solid #d2d2d2", background: "#fff", color: "#334155",
    minWidth: "8vw", outline: "none", cursor: "pointer",
  };

  const dateInputStyle = {
    ...selectStyle,
    minWidth: "9vw",
  };

  const filterBtnStyle = {
    padding: "0.5vh 1vw", fontSize: "0.82vw", fontFamily: "Inter, sans-serif",
    fontWeight: 500, border: "0.08vw solid", cursor: "pointer",
  };

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/system"))} ariaLabel="Back to System" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration/system"))}>
            System
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Audit Logs</span>
        </h1>
      </header>

      {/* Filter bar */}
      <div className="dropdown-settings-card" style={{
        border: "0.08vw solid #d2d2d2", background: "#ffffff",
        padding: "1.2vh 1.5vw", display: "flex", alignItems: "center", gap: "1vw", flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 550, color: "#334155", fontFamily: "Inter, sans-serif" }}>
          Filters
        </span>

        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Actions</option>
          {ACTION_CHOICES.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select value={filterModel} onChange={(e) => { setFilterModel(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">All Models</option>
          {modelNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <input
          type="date"
          value={filterFrom}
          onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
          style={dateInputStyle}
          title="From date"
        />
        <span style={{ fontSize: "0.78vw", color: "#94a3b8" }}>to</span>
        <input
          type="date"
          value={filterTo}
          onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
          style={dateInputStyle}
          title="To date"
        />

        {hasFilters && (
          <button type="button" onClick={resetFilters}
            style={{ ...filterBtnStyle, borderColor: "#94a3b8", background: "#f8fafc", color: "#64748b" }}>
            Reset
          </button>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: "0.8vw", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
          {total} record{total !== 1 ? "s" : ""}
        </span>

        {rows.length > 0 && (
          <button type="button" onClick={handleClearAll}
            style={{ ...filterBtnStyle, borderColor: "#ef4444", background: "#fff", color: "#ef4444" }}>
            Clear All Logs
          </button>
        )}
      </div>

      <DataTable
        columns={enhancedColumns}
        rows={rows}
        loading={loading}
        showNewBtn={false}
        actions={actionOptions}
        searchPlaceholder="Search logs..."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.8vw",
          padding: "1vh 0", fontSize: "0.82vw", fontFamily: "Inter, sans-serif",
        }}>
          <button type="button" disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ ...filterBtnStyle, borderColor: page <= 1 ? "#e2e8f0" : "var(--brand-primary)", background: "#fff", color: page <= 1 ? "#cbd5e1" : "var(--brand-primary)", cursor: page <= 1 ? "not-allowed" : "pointer" }}>
            Previous
          </button>
          <span style={{ color: "#334155" }}>
            Page {page} of {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{ ...filterBtnStyle, borderColor: page >= totalPages ? "#e2e8f0" : "var(--brand-primary)", background: "#fff", color: page >= totalPages ? "#cbd5e1" : "var(--brand-primary)", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>
            Next
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailRow && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailRow(null); }}
        >
          <div style={{
            background: "#fff", width: "46vw", maxHeight: "80vh", overflow: "auto",
            borderTop: "0.22vw solid var(--brand-primary)", boxShadow: "0 0.4vw 1.5vw rgba(0,0,0,0.18)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.5vh 1.5vw", borderBottom: "0.06vw solid #e8eef5",
            }}>
              <span style={{ fontSize: "1vw", fontWeight: 600, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
                Audit Log Detail
              </span>
              <button type="button" onClick={() => setDetailRow(null)}
                style={{ background: "none", border: "none", fontSize: "1.2vw", cursor: "pointer", color: "#64748b" }}>
                &times;
              </button>
            </div>
            <div style={{ padding: "2vh 1.5vw", display: "flex", flexDirection: "column", gap: "1.2vh" }}>
              <DetailRow label="Date" value={renderDateCell(detailRow.createdAt)} />
              <DetailRow label="Action" value={detailRow.action} />
              <DetailRow label="Model" value={detailRow.modelName} />
              <DetailRow label="Document ID" value={detailRow.documentId || "—"} />
              <DetailRow label="Summary" value={detailRow.summary || "—"} />
              <DetailRow label="User" value={detailRow.userName || "—"} />
              <DetailRow label="IP Address" value={detailRow.ipAddress || "—"} />
              {detailRow.changes && (
                <div>
                  <span style={{ fontSize: "0.85vw", fontWeight: 550, color: "#334155", fontFamily: "Inter, sans-serif" }}>
                    Changes
                  </span>
                  <pre style={{
                    background: "#f8fafc", border: "0.06vw solid #e2e8f0",
                    padding: "1vh 0.8vw", fontSize: "0.76vw", fontFamily: "monospace",
                    overflow: "auto", maxHeight: "25vh", marginTop: "0.5vh", whiteSpace: "pre-wrap",
                  }}>
                    {JSON.stringify(detailRow.changes, null, 2)}
                  </pre>
                </div>
              )}
              {detailRow.previousData && (
                <div>
                  <span style={{ fontSize: "0.85vw", fontWeight: 550, color: "#334155", fontFamily: "Inter, sans-serif" }}>
                    Previous Data
                  </span>
                  <pre style={{
                    background: "#fff8f0", border: "0.06vw solid #fde2c8",
                    padding: "1vh 0.8vw", fontSize: "0.76vw", fontFamily: "monospace",
                    overflow: "auto", maxHeight: "25vh", marginTop: "0.5vh", whiteSpace: "pre-wrap",
                  }}>
                    {JSON.stringify(detailRow.previousData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "1vw", fontSize: "0.85vw", fontFamily: "Inter, sans-serif" }}>
      <span style={{ width: "8vw", flexShrink: 0, fontWeight: 550, color: "#64748b" }}>{label}</span>
      <span style={{ color: "#0f172a", wordBreak: "break-all" }}>{typeof value === "string" || typeof value === "number" ? value : value}</span>
    </div>
  );
}
