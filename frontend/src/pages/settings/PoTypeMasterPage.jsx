import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, editMenuItem } from "../../config/tableActionMenuItems.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterDataModal from "../../components/modals/MasterDataModal.jsx";
import {
  listMasterDataRequest,
  createMasterDataRequest,
  updateMasterDataRequest,
  deleteMasterDataRequest,
} from "../../services/api.js";
import { sortMasterDataRows } from "../../utils/masterDataOptions.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const PO_TYPE_CATEGORY = MASTER_DATA_CATEGORY.PO_TYPE;

const COLUMNS = [
  { key: "sequence", label: "Order", width: "10%", align: "center", sortable: true },
  { key: "label", label: "PO Type", width: "24%", align: "left", sortable: true, filterable: true },
  { key: "value", label: "Value", width: "18%", align: "left", sortable: true },
  { key: "description", label: "Description", width: "28%", align: "left" },
  { key: "status", label: "Status", width: "10%", align: "left", filterable: true, type: "status" },
  { key: "action", label: "Action", width: "10%", align: "center" },
];

export default function PoTypeMasterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const { setFooterContent } = useFooter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMasterDataRequest(PO_TYPE_CATEGORY);
      setRows(sortMasterDataRows(Array.isArray(res?.data) ? res.data : []));
    } catch (err) {
      toast.error(err?.message || "Failed to load PO types");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete PO type "${row.label}"?`)) return;
    try {
      await deleteMasterDataRequest(row._id || row.id);
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== (row._id || row.id)));
      toast.success("PO type deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete PO type");
    }
  };

  const handleSave = async (form) => {
    const payload = { ...form, category: PO_TYPE_CATEGORY };
    if (editRow) {
      const res = await updateMasterDataRequest(editRow._id || editRow.id, payload);
      const updated = res?.data || { ...editRow, ...payload };
      setRows((prev) =>
        sortMasterDataRows(
          prev.map((r) => ((r._id || r.id) === (editRow._id || editRow.id) ? { ...r, ...updated } : r))
        )
      );
    } else {
      const res = await createMasterDataRequest(payload);
      const newDoc = res?.data || { ...payload, id: String(Date.now()) };
      setRows((prev) => sortMasterDataRows([...prev, newDoc]));
    }
    setModalOpen(false);
    setEditRow(null);
  };

  const ACTION_OPTIONS = [
    editMenuItem((row) => {
      setEditRow(row);
      setModalOpen(true);
    }),
    deleteMenuItem(handleDelete),
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration/data-management"))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/data-management"))}
          >
            Data Management
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">PO Type</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        stableSortKeys={["sequence", "label"]}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search PO type..."
        onNew={() => {
          setEditRow(null);
          setModalOpen(true);
        }}
      />

      {modalOpen ? (
        <MasterDataModal
          initialData={editRow}
          activeCategory={PO_TYPE_CATEGORY}
          categories={[PO_TYPE_CATEGORY]}
          lockCategory
          onClose={() => {
            setModalOpen(false);
            setEditRow(null);
          }}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
