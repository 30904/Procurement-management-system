import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { deleteMenuItem, manageAccessMenuItem } from "../../config/tableActionMenuItems.jsx";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import { listRolesRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";
import { useToast } from "../../hooks/useToast.js";

const COLUMNS = [
  { key: "roleCode", label: "Role Code", width: "25%", align: "left", sortable: true },
  { key: "roleName", label: "Role Name", width: "45%", align: "left", sortable: true },
  { key: "status", label: "Status", width: "15%", align: "left", filterable: true, type: "status" },
  { key: "action", label: "Action", width: "15%", align: "center" },
];

export default function AccessManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setFooterContent } = useFooter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await listRolesRequest();
        const data = Array.isArray(res?.data) ? res.data : [];
        const filtered = data.filter(r => {
          const name = String(r.displayRoleName || r.roleName || "").toLowerCase();
          return name !== "super admin" && name !== "super_admin";
        });
        const sorted = [...filtered].sort((a, b) =>
          String(a.roleCode || "").localeCompare(String(b.roleCode || ""), undefined, { numeric: true })
        );
        setRows(sorted);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete role ${row.roleName || row.roleCode}?`)) return;
    try {
      setRows(prev => prev.filter(r => (r._id || r.id) !== (row._id || row.id)));
      toast.success("Role deleted successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to delete role");
    }
  };

  const ACTION_OPTIONS = [
    manageAccessMenuItem((row) => {
      navigate(appPath(`configuration/roles-access/module-management/${row._id || row.id}`));
    }),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/roles-access"))} ariaLabel="Back to Roles & Access" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>Settings</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration/roles-access"))}>Roles & Access</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Access Management</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        showNewBtn={false}
      />
    </div>
  );
}
