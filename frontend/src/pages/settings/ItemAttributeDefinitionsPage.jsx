import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, editMenuItem } from "../../config/tableActionMenuItems.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import ItemAttributeDefinitionModal from "../../components/modals/ItemAttributeDefinitionModal.jsx";
import {
  listItemAttributeDefinitionsRequest,
  createItemAttributeDefinitionRequest,
  updateItemAttributeDefinitionRequest,
  deleteItemAttributeDefinitionRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  { key: "code", label: "Code", width: "12%", align: "left", sortable: true },
  { key: "label", label: "Label", width: "16%", align: "left", sortable: true },
  { key: "dataType", label: "Type", width: "10%", align: "left" },
  { key: "mandatoryRule", label: "Mandatory", width: "12%", align: "left" },
  { key: "categoriesDisplay", label: "Categories", width: "20%", align: "left" },
  { key: "status", label: "Status", width: "10%", align: "left", type: "status" },
  { key: "action", label: "Action", width: "10%", align: "center" },
];

function formatRow(doc) {
  const cats = doc.applicableCategories || [];
  return {
    ...doc,
    id: String(doc._id || doc.id),
    categoriesDisplay: cats.length ? cats.join(", ") : "All",
  };
}

export default function ItemAttributeDefinitionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const { setFooterContent } = useFooter();
  const { options: categoryOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.ITEM_CATEGORY);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listItemAttributeDefinitionsRequest();
      setRows((Array.isArray(res?.data) ? res.data : []).map(formatRow));
    } catch {
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
    if (!window.confirm(`Delete attribute "${row.label}"?`)) return;
    try {
      await deleteItemAttributeDefinitionRequest(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Attribute definition deleted");
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const handleSave = async (form) => {
    if (editRow) {
      const res = await updateItemAttributeDefinitionRequest(editRow.id, form);
      setRows((prev) => prev.map((r) => (r.id === editRow.id ? formatRow(res?.data || { ...editRow, ...form }) : r)));
    } else {
      const res = await createItemAttributeDefinitionRequest(form);
      setRows((prev) => [...prev, formatRow(res?.data || form)]);
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
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration"))}>Settings</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("configuration/data-management"))}>Data Management</span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Material Attributes</span>
        </h1>
      </header>
      <p style={{ fontSize: "0.78vw", color: "#64748b", margin: "0 0 1vh 0" }}>
        Define industry-specific attribute fields. Values are entered per item on the Material Master Attributes tab.
      </p>
      <DataTable columns={COLUMNS} rows={rows} loading={loading} actions={ACTION_OPTIONS} onNew={() => { setEditRow(null); setModalOpen(true); }} />
      {modalOpen ? (
        <ItemAttributeDefinitionModal
          initialData={editRow}
          categoryOptions={categoryOptions}
          onClose={() => { setModalOpen(false); setEditRow(null); }}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
