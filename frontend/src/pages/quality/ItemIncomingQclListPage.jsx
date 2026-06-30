import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import DataTable from "../../components/common/DataTable.jsx";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import { listItemIncomingQclRequest } from "../../services/api.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./ItemIncomingQclListPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function isItemQclDefined(row) {
  return Boolean(row?.qclConfigured) || Boolean(String(row?.itemQcl ?? "").trim());
}

function normalizeRow(doc) {
  const id = doc?._id != null ? String(doc._id) : String(doc?.id ?? "");
  return {
    ...doc,
    _id: id,
    id,
    itemNo: doc?.itemNo ?? "",
    itemName: doc?.itemName ?? "",
    itemDescription: doc?.itemDescription ?? "",
    uom: doc?.uom ?? "",
    itemCategory: doc?.itemCategory ?? "",
    itemQcl: doc?.itemQcl ?? "",
    shelfLifeMonths:
      doc?.shelfLifeMonths != null && doc.shelfLifeMonths !== ""
        ? String(doc.shelfLifeMonths)
        : "",
    status: doc?.status || "Active",
    qclConfigured: Boolean(doc?.qclConfigured),
  };
}

const COLUMNS = [
  { key: "itemNo", label: "Material Code", width: "10%", align: "center", sortable: true, filterable: true },
  { key: "itemName", label: "Material Name", width: "14%", align: "left", sortable: true, filterable: true },
  {
    key: "itemDescription",
    label: "Material Description",
    width: "16%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  { key: "uom", label: "UoM", width: "7%", align: "center", sortable: true, filterable: true },
  { key: "itemCategory", label: "Material Category", width: "14%", align: "left", sortable: true, filterable: true },
  { key: "itemQcl", label: "Material QCL", width: "18%", align: "left", sortable: true, filterable: true },
  { key: "shelfLifeMonths", label: "S/Life", width: "7%", align: "center", sortable: true },
  {
    key: "status",
    label: "Status",
    width: "8%",
    align: "center",
    render: (_, row) => {
      const defined = isItemQclDefined(row);
      return (
        <span
          className={pageStyles.qclStatusWrap}
          title={defined ? "Material QCL configured" : "Material QCL not configured"}
        >
          <span
            className={`${pageStyles.qclStatusDot} ${
              defined ? pageStyles.qclStatusDotOk : pageStyles.qclStatusDotMissing
            }`}
            aria-label={defined ? "Material QCL configured" : "Material QCL not configured"}
          />
        </span>
      );
    },
  },
  { key: "action", label: "Action", width: "6%", align: "center" },
];

export default function ItemIncomingQclListPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/quality");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listItemIncomingQclRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load items");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const openEdit = (row) =>
    navigateWithHubReturn(`masters/quality/item-qcl/${row.id}/edit`);
  const openView = (row) =>
    navigateWithHubReturn(`masters/quality/item-qcl/${row.id}/view`);

  const actionOptions = [
    {
      label: "QC Details",
      icon: <Plus size={15} color="var(--brand-primary, #197dfa)" strokeWidth={1.9} />,
      onClick: openEdit,
    },
    {
      label: "View",
      icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
      onClick: openView,
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: openEdit,
    },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <MasterBreadcrumbToolbar
        defaultHubReturn="masters/quality"
        summaryTitle="Material Incoming QCL"
      />
      <div className={pageStyles.summaryBar}>
        <h2 className={pageStyles.summaryTitle}>Material Master Summary</h2>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actionOptions}
        showNewBtn={false}
        searchPlaceholder="Search material code, name, category, QCL..."
        pageSize={10}
      />
    </div>
  );
}
