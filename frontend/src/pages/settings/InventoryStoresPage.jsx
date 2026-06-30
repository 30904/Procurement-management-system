import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  listInventoryStoresRequest,
  listLocationsRequest,
  deleteInventoryStoreRequest,
} from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "configuration/inventory-stores";

function StatusCell({ row }) {
  const inactive = String(row.statusRaw || row.status) === "Inactive";
  return (
    <span className="im-status" style={{ justifyContent: "center" }}>
      <span className={`im-status-dot ${inactive ? "im-status-dot--inactive" : ""}`} />
      {inactive ? "Inactive" : "Active"}
    </span>
  );
}

const COLUMNS = [
  { key: "storeCode", label: "Code", width: "12%", minWidth: "5rem", align: "center", sortable: true, filterable: true },
  { key: "storeName", label: "Store Name", width: "22%", minWidth: "8rem", align: "left", sortable: true, filterable: true },
  { key: "locationLabel", label: "Location", width: "18%", minWidth: "6rem", align: "left", sortable: true, filterable: true },
  { key: "isDefault", label: "Default", width: "8%", minWidth: "4rem", align: "center", sortable: true },
  {
    key: "statusLabel",
    label: "Status",
    width: "10%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "8%", minWidth: "3.5rem", align: "center" },
];

function normalizeRow(doc, locMap) {
  const id = String(doc._id || doc.id);
  const statusRaw = doc.status ?? "Active";
  return {
    ...doc,
    id,
    _id: id,
    locationLabel: locMap[String(doc.locationId)] || "—",
    isDefault: doc.isDefault ? "Yes" : "No",
    statusRaw,
    statusLabel: statusRaw,
    statusInactive: statusRaw === "Inactive",
  };
}

export default function InventoryStoresPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const [storesRes, locRes] = await Promise.all([
        listInventoryStoresRequest(),
        listLocationsRequest(),
      ]);
      const locs = Array.isArray(locRes?.data) ? locRes.data : [];
      const locMap = Object.fromEntries(
        locs.map((l) => [String(l._id), l.name || l.locationId])
      );
      const data = Array.isArray(storesRes?.data) ? storesRes.data : [];
      setRows(data.map((s) => normalizeRow(s, locMap)));
    } catch (err) {
      toast.error(err?.message || "Failed to load stores");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!row) return;
    setDeleting(true);
    try {
      await deleteInventoryStoreRequest(row.id);
      toast.success("Store deleted");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const ACTION_OPTIONS = [
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => navigate(appPath(`${LIST_PATH}/${row.id}/edit`)),
    },
    {
      label: "Delete",
      icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />,
      variant: "danger",
      onClick: (row) => setConfirmTarget(row),
    },
  ];

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/company-setup"))} ariaLabel="Back to Company Setup" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/company-setup"))}
          >
            Company Setup
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Inventory Stores</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search store code or name..."
        pageSize={10}
        onNew={() => navigate(appPath(`${LIST_PATH}/new`))}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Inventory Store"
        message={
          confirmTarget
            ? `Delete store "${confirmTarget.storeName}" (${confirmTarget.storeCode})? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />
    </div>
  );
}
