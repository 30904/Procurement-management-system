import { useEffect, useRef, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { deleteMenuItem, editMenuItem } from "../../config/tableActionMenuItems.jsx";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import UserManagementModal from "../../components/modals/UserManagementModal.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import { listUsersRequest, createUserRequest, updateUserRequest, deleteUserRequest, listRolesRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "createdAt", label: "User Enrollment Date", width: "18%", align: "center", type: "date", sortable: true },
  { key: "name", label: "User Name", width: "15%", align: "left", sortable: true },
  { key: "roleNameDisplay", label: "User Role", width: "20%", align: "left", sortable: true },
  { key: "userName", label: "User Name", width: "12%", align: "center" },
  { key: "password", label: "User Password", width: "12%", align: "center", type: "password" },
  { key: "status", label: "Status", width: "10%", align: "left", filterable: true, type: "status" },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setFooterContent } = useFooter();
  const tableWrapRef = useRef(null);
  const [roleMap, setRoleMap] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [usersRes, rolesRes] = await Promise.all([
          listUsersRequest(),
          listRolesRequest()
        ]);
        const usersData = Array.isArray(usersRes?.data) ? usersRes.data : [];
        const rolesData = Array.isArray(rolesRes?.data) ? rolesRes.data : [];

        const newRoleMap = {};
        rolesData.forEach(r => {
          const id = r._id?.$oid || r._id || r.id;
          if (id) {
            newRoleMap[String(id)] = r.displayRoleName || r.roleName || r.roleCode || String(id);
          }
        });
        setRoleMap(newRoleMap);

        const processed = usersData.map(u => {
          const roleEntry = Array.isArray(u.role) ? u.role[0] : u.role;
          let rName = "";
          if (roleEntry) {
            if (typeof roleEntry === "string") {
              rName = newRoleMap[roleEntry] || roleEntry;
            } else if (typeof roleEntry === "object") {
              const id = roleEntry.$oid || roleEntry._id || roleEntry.id;
              rName = roleEntry.displayRoleName || roleEntry.roleName || newRoleMap[String(id)] || "";
            }
          }
          return {
            ...u,
            id: u._id || u.id || String(Math.random()),
            roleNameDisplay: rName || u.userType || "No Role"
          };
        });

        const filtered = processed.filter(u => {
          const roleText = String(u.roleNameDisplay || "").toLowerCase();
          const typeText = String(u.userType || "").toLowerCase();
          return (
            roleText !== "super admin" &&
            roleText !== "super_admin" &&
            typeText !== "super admin" &&
            typeText !== "super_admin"
          );
        });
        setRows(filtered);
      } catch (err) {
        console.error("Failed to fetch users or roles:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete ${row.name}?`)) return;
    try {
      await deleteUserRequest(row._id || row.id);
      setRows(prev => prev.filter(r => (r._id || r.id) !== (row._id || row.id)));
    } catch (err) {
      window.alert(err?.message || "Failed to delete user");
    }
  };

  const ACTION_OPTIONS = [
    editMenuItem((row) => {
      setEditRow(row);
      setModalOpen(true);
    }),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  const handleSave = async (form, selectedRoleName) => {
    const [day, month, year] = form.enrollmentDate.split("/");
    const isoCreatedAt = new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();

    const payload = {
      name: form.name,
      userName: form.userName,
      role: form.roleId ? [form.roleId] : [],
      status: form.status,
      createdAt: isoCreatedAt,
      defaultLocationId: form.defaultLocationId || undefined,
      allowedLocationIds: Array.isArray(form.allowedLocationIds) ? form.allowedLocationIds : [],
      locationAccessMode: form.locationAccessMode || "restricted",
    };

    const passwordTrimmed = String(form.password ?? "").trim();
    if (passwordTrimmed) {
      payload.password = passwordTrimmed;
    } else if (!editRow) {
      throw new Error("Password is required when creating a user.");
    }

    const processRow = (u) => {
      const roleEntry = Array.isArray(u.role) ? u.role[0] : u.role;
      let rName = "";
      if (roleEntry) {
        if (typeof roleEntry === "string") {
          rName = (roleEntry === form.roleId ? selectedRoleName : null) || roleMap[roleEntry] || roleEntry;
        } else if (typeof roleEntry === "object") {
          const id = roleEntry.$oid || roleEntry._id || roleEntry.id;
          rName = roleEntry.displayRoleName || roleEntry.roleName || roleMap[String(id)] || "";
        }
      }
      return {
        ...u,
        id: u._id || u.id,
        roleNameDisplay: rName || u.userType || "No Role"
      };
    };

    if (selectedRoleName && form.roleId) {
      setRoleMap(prev => ({ ...prev, [form.roleId]: selectedRoleName }));
    }

    if (editRow) {
      const res = await updateUserRequest(editRow._id || editRow.id, payload);
      const updatedDoc = res?.data || { ...editRow, ...payload };
      const processed = processRow(updatedDoc);
      setRows((prev) =>
        prev.map((r) => ((r._id || r.id) === (editRow._id || editRow.id) ? processed : r))
      );
    } else {
      const createPayload = {
        ...payload,
        allowedSuppCatTypes: [],
        company: "6374766d73b2461348ffdbc8",
        department: null,
        departmentName: "Finance",
        groupLocationName: "All",
        isActive: true,
        isLoggedIn: "No",
        lastLoggedIn: null,
        locDet: [],
        userDevice: "",
        userIP: "",
        userType: "ADMIN",
      };
      const res = await createUserRequest(createPayload);
      const savedDoc = res?.data || { ...createPayload, id: String(Date.now()) };
      const processed = processRow(savedDoc);
      setRows((prev) => [...prev, processed]);
    }
    setModalOpen(false);
    setEditRow(null);
  };

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/roles-access"))} ariaLabel="Back to Roles & Access" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>Settings</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration/roles-access"))}>Roles & Access</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">User Management</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        onNew={() => { setEditRow(null); setModalOpen(true); }}
      />

      {modalOpen && (
        <UserManagementModal
          tableRect={tableWrapRef.current?.getBoundingClientRect()}
          initialData={editRow}
          onClose={() => { setModalOpen(false); setEditRow(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
