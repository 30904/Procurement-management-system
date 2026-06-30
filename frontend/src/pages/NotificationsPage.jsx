import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../config/navigation.js";
import { useFooter } from "../context/FooterContext.jsx";
import styles from "../styles/page-toolbar.module.css";
import DataTable from "../components/common/DataTable.jsx";
import {
  listNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  deleteNotificationRequest,
  clearAllNotificationsRequest,
} from "../services/api.js";
import { useToast } from "../hooks/useToast.js";
import "../styles/theme.css";
import "../styles/global.css";
import "../styles/erp-layout.css";

const TYPE_COLORS = {
  info: "var(--brand-primary)",
  success: "#009696",
  warning: "#e07b00",
  error: "#e53e3e",
  system: "#7c3aed",
};

const COLUMNS = [
  {
    key: "isRead",
    label: "",
    width: "3%",
    align: "center",
    render: (val) => (
      <span
        style={{
          display: "inline-block",
          width: "0.5vw",
          height: "0.5vw",
          borderRadius: 0,
          background: val ? "transparent" : "var(--brand-primary)",
        }}
      />
    ),
  },
  {
    key: "type",
    label: "Type",
    width: "8%",
    align: "center",
    filterable: true,
    render: (val) => (
      <span
        style={{
          display: "inline-block",
          padding: "0.2vh 0.5vw",
          fontSize: "0.7vw",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          color: TYPE_COLORS[val] || TYPE_COLORS.info,
          background: `${TYPE_COLORS[val] || TYPE_COLORS.info}14`,
          borderRadius: 0,
        }}
      >
        {val}
      </span>
    ),
  },
  { key: "title", label: "Title", width: "25%", align: "left", sortable: true },
  { key: "body", label: "Message", width: "30%", align: "left" },
  { key: "category", label: "Category", width: "10%", align: "left", filterable: true, sortable: true },
  {
    key: "createdAt",
    label: "Date",
    width: "14%",
    align: "center",
    type: "date",
    sortable: true,
  },
  { key: "action", label: "Action", width: "10%", align: "center" },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setFooterContent } = useFooter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotificationsRequest({ limit: 200 });
      setRows(res?.data?.rows || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await deleteNotificationRequest(row._id || row.id);
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== (row._id || row.id)));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleMarkRead = async (row) => {
    try {
      await markNotificationReadRequest(row._id || row.id);
      setRows((prev) =>
        prev.map((r) =>
          (r._id || r.id) === (row._id || row.id) ? { ...r, isRead: true } : r
        )
      );
    } catch {
      /* silent */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadRequest();
      setRows((prev) => prev.map((r) => ({ ...r, isRead: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err?.message || "Failed to mark all as read");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    try {
      await clearAllNotificationsRequest();
      setRows([]);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error(err?.message || "Failed to clear");
    }
  };

  const ACTION_OPTIONS = [
    {
      label: "Mark as Read",
      onClick: (row) => handleMarkRead(row),
    },
    {
      label: "Delete",
      onClick: (row) => handleDelete(row),
    },
  ];

  const toolbarActions = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", marginLeft: "auto", marginRight: "0.8vw" }}>
      {rows.some((r) => !r.isRead) && (
        <button
          type="button"
          onClick={handleMarkAllRead}
          style={{
            border: "0.08vw solid var(--brand-primary)",
            background: "#ffffff",
            color: "var(--brand-primary)",
            fontSize: "0.82vw",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            padding: "0.5vh 0.8vw",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          Mark All Read
        </button>
      )}
      {rows.length > 0 && (
        <button
          type="button"
          onClick={handleClearAll}
          style={{
            border: "0.08vw solid #e53e3e",
            background: "#ffffff",
            color: "#e53e3e",
            fontSize: "0.82vw",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            padding: "0.5vh 0.8vw",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          Clear All
        </button>
      )}
    </div>
  );

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("dashboard"))} ariaLabel="Back to Dashboard" />
        <h1
          className="erp-breadcrumb erp-breadcrumb--page-title"
          style={{ cursor: "default" }}
        >
          <span className="erp-breadcrumb-item">Notifications</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        showNewBtn={false}
        toolbarRight={toolbarActions}
      />
    </div>
  );
}
