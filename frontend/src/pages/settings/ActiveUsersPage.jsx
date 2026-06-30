import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DataTable from "../../components/common/DataTable.jsx";
import { listUserSessionsRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";
import styles from "../../styles/page-toolbar.module.css";

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function LoggedInDot({ value }) {
  const isOnline = value === "Y";
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.6vw",
        height: "0.6vw",
        borderRadius: 0,
        background: isOnline ? "#22c55e" : "#ef4444",
      }}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}

function StatusBadge({ value }) {
  const isActive = value === "Active";
  return (
    <span style={{
      display: "inline-block", padding: "0.15vw 0.5vw",
      fontSize: "0.72vw", fontWeight: 600, fontFamily: "Inter, sans-serif",
      borderRadius: 0,
      background: isActive ? "#e8f5e9" : "#ffebee",
      color: isActive ? "#2e7d32" : "#c62828",
    }}>
      {value || "—"}
    </span>
  );
}

const COLUMNS = [
  {
    key: "name",
    label: "User Name",
    width: "13%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "userType",
    label: "User Type",
    width: "9%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "roleName",
    label: "Role",
    width: "12%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "userEmail",
    label: "Email",
    width: "15%",
    align: "left",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    width: "9%",
    align: "center",
    sortable: true,
    filterable: true,
    render: (val) => <StatusBadge value={val} />,
  },
  {
    key: "isLoggedIn",
    label: "Logged In",
    width: "9%",
    align: "center",
    sortable: true,
    filterable: true,
    render: (val) => <LoggedInDot value={val} />,
  },
  {
    key: "lastLoggedIn",
    label: "Last Logged In",
    width: "14%",
    align: "left",
    sortable: true,
    type: "date",
    render: (val) => formatDate(val),
  },
  {
    key: "userIP",
    label: "IP Address",
    width: "19%",
    align: "left",
  },
];

export default function ActiveUsersPage() {
  const navigate = useNavigate();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUserSessionsRequest();
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  DataTable.useRecordCount(rows, setFooterContent);

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/system"))} ariaLabel="Back to System" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>Settings</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration/system"))}>System</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Active Users</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        showNewBtn={false}
        searchPlaceholder="Search users..."
      />
    </div>
  );
}
