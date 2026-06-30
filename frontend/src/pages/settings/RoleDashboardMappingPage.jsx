import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Info, Pencil } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./RoleDashboardMappingPage.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import RoleDashboardMappingModal from "../../components/modals/RoleDashboardMappingModal.jsx";
import {
  getDashboardCatalogRequest,
  listRoleDashboardMappingsRequest,
} from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "roleCode", label: "Role Code", width: "18%", align: "left", sortable: true, filterable: true },
  { key: "roleName", label: "Role Name", width: "28%", align: "left", sortable: true, filterable: true },
  { key: "dashboardLabel", label: "Dashboard Screen", width: "34%", align: "left", sortable: true, filterable: true },
  { key: "action", label: "Action", width: "12%", align: "center" },
];

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  return {
    ...doc,
    _id: id,
    id,
    roleCode: doc.roleCode ?? "",
    roleName: doc.displayRoleName || doc.roleName || "",
    dashboardKey: doc.dashboardKey || "default",
    dashboardLabel: doc.dashboardLabel || doc.dashboardKey || "Workspace Home",
  };
}

export default function RoleDashboardMappingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mapRes, catRes] = await Promise.all([
        listRoleDashboardMappingsRequest(),
        getDashboardCatalogRequest(),
      ]);
      const data = Array.isArray(mapRes?.data) ? mapRes.data : [];
      setRows(data.map(normalizeRow));
      setCatalog(Array.isArray(catRes?.data) ? catRes.data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load dashboard mappings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  DataTable.useRecordCount(rows, setFooterContent);

  const openMapping = (row) => setEditRow(row);

  const ACTION_OPTIONS = [
    {
      label: "Assign Dashboard",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: openMapping,
    },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/app-setup"))} ariaLabel="Back to Application Setup" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/app-setup"))}
          >
            Application Setup
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Role Dashboard Mapping</span>
        </h1>
      </header>

      <aside className={pageStyles.infoBanner}>
        <div className={pageStyles.infoIcon} aria-hidden>
          <Info size={18} strokeWidth={2.2} />
        </div>
        <div className={pageStyles.infoContent}>
          <p className={pageStyles.infoTitle}>How role → dashboard mapping works</p>
          <p className={pageStyles.infoText}>
            Each <strong>role</strong> in your system appears in the table below. There is no
            separate “add mapping” step — assign a dashboard to an existing role using{" "}
            <strong>Assign Dashboard</strong> in the Action column, or click a row.
          </p>
          <ol className={pageStyles.steps}>
            <li>
              Need a new role? Create it under{" "}
              <span
                className={pageStyles.infoLink}
                role="link"
                tabIndex={0}
                onClick={() => navigate(appPath("configuration/roles-access/access-management"))}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  navigate(appPath("configuration/roles-access/access-management"))
                }
              >
                Settings → Roles & Access → Access Management
              </span>
              .
            </li>
            <li>Return here — the new role will appear automatically in this list.</li>
            <li>Assign the dashboard screen that role should see.</li>
          </ol>
        </div>
      </aside>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        onRowClick={openMapping}
        showNewBtn={false}
        searchPlaceholder="Search role or dashboard..."
        emptyMessage="No roles found. Create roles in Access Management first."
      />

      {editRow && (
        <RoleDashboardMappingModal
          roleRow={editRow}
          catalog={catalog}
          onClose={() => setEditRow(null)}
          onSaved={async () => {
            await fetchData();
            setEditRow(null);
            toast.success("Dashboard mapping saved.");
          }}
        />
      )}
    </div>
  );
}
