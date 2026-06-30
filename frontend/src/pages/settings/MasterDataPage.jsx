import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { deleteMenuItem, editMenuItem } from "../../config/tableActionMenuItems.jsx";
import { useFooter } from "../../context/FooterContext.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import MasterDataModal from "../../components/modals/MasterDataModal.jsx";
import {
  listMasterDataRequest,
  listMasterDataCategoriesRequest,
  createMasterDataRequest,
  updateMasterDataRequest,
  deleteMasterDataRequest,
} from "../../services/api.js";
import { sortMasterDataRows } from "../../utils/masterDataOptions.js";
import { masterDataCategoryLabel } from "../../config/masterDataCategories.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const COLUMNS = [
  {
    key: "category",
    label: "Category",
    width: "16%",
    align: "left",
    sortable: true,
    filterable: true,
    render: (val) => masterDataCategoryLabel(val),
  },
  { key: "sequence",    label: "Order",       width: "8%",  align: "center", sortable: true },
  { key: "label",       label: "Label",       width: "20%", align: "left",   sortable: true },
  { key: "value",       label: "Value",       width: "16%", align: "left",   sortable: true },
  { key: "description", label: "Description", width: "20%", align: "left" },
  { key: "status",      label: "Status",      width: "10%", align: "left",   filterable: true, type: "status" },
  { key: "action",      label: "Action",      width: "10%", align: "center" },
];

export default function MasterDataPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const { setFooterContent } = useFooter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dataRes, catRes] = await Promise.all([
        listMasterDataRequest(activeCategory || undefined),
        listMasterDataCategoriesRequest(),
      ]);
      setRows(
        sortMasterDataRows(Array.isArray(dataRes?.data) ? dataRes.data : [])
      );
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
    } catch (err) {
      console.error("Failed to fetch master data:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  DataTable.useRecordCount(rows, setFooterContent);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.label}" from ${row.category}?`)) return;
    try {
      await deleteMasterDataRequest(row._id || row.id);
      setRows((prev) =>
        prev.filter((r) => (r._id || r.id) !== (row._id || row.id))
      );
      toast.success("Entry deleted successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to delete entry");
    }
  };

  const ACTION_OPTIONS = [
    editMenuItem((row) => {
      setEditRow(row);
      setModalOpen(true);
    }),
    deleteMenuItem((row) => handleDelete(row)),
  ];

  const handleSave = async (form) => {
    if (editRow) {
      const res = await updateMasterDataRequest(editRow._id || editRow.id, form);
      const updated = res?.data || { ...editRow, ...form };
      setRows((prev) =>
        sortMasterDataRows(
          prev.map((r) =>
            (r._id || r.id) === (editRow._id || editRow.id) ? { ...r, ...updated } : r
          )
        )
      );
    } else {
      const res = await createMasterDataRequest(form);
      const newDoc = res?.data || { ...form, id: String(Date.now()) };
      setRows((prev) => sortMasterDataRows([...prev, newDoc]));
      if (form.category && !categories.includes(form.category)) {
        setCategories((prev) => [...prev, form.category].sort());
      }
    }
    setModalOpen(false);
    setEditRow(null);
  };

  const categoryOptions = ["", ...categories];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration"))}
          >
            Settings
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Master Data</span>
        </h1>
      </header>

      <div className="dropdown-settings-filter">
        <label className="dropdown-settings-filter-label" htmlFor="master-data-category-filter">
          Category Filter
        </label>
        <select
          id="master-data-category-filter"
          className="sc-select dropdown-settings-filter-select"
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
        >
          {categoryOptions.map((category) => (
            <option key={category || "all"} value={category}>
              {category ? masterDataCategoryLabel(category) : "All"}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        stableSortKeys={["category", "sequence", "label"]}
        actions={ACTION_OPTIONS}
        onNew={() => {
          setEditRow(null);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <MasterDataModal
          initialData={editRow}
          activeCategory={activeCategory}
          categories={categories}
          onClose={() => {
            setModalOpen(false);
            setEditRow(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
