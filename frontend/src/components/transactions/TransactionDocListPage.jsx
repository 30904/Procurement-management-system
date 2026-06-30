import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import ErpBackButton from "../common/ErpBackButton.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DataTable from "../common/DataTable.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

export default function TransactionDocListPage({
  title,
  backSegment,
  listRequest,
  deleteRequest,
  postRequest,
  columns,
  docNoKey = "docNo",
  statusKey = "status",
  dateKey = "docDate",
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocation } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRow, setConfirmRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.map((doc) => ({
          ...doc,
          id: String(doc._id || doc.id),
          docNo: doc[docNoKey] || doc.poNo || doc.grnNo || doc.invoiceNo || doc.soNo || doc.deliveryNo || doc.transferNo || "",
          docDate: doc[dateKey] || doc.poDate || doc.grnDate || doc.invoiceDate || doc.soDate || doc.deliveryDate || doc.transferDate,
          status: doc[statusKey] || doc.status || "",
        }))
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [listRequest, docNoKey, dateKey, statusKey, toast]);

  useEffect(() => {
    load();
  }, [load, activeLocation?._id]);

  useEffect(() => {
    setFooterContent(null);
    return () => setFooterContent(null);
  }, [setFooterContent]);

  async function handleDelete(row) {
    if (!deleteRequest) return;
    try {
      await deleteRequest(row.id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setConfirmRow(null);
    }
  }

  async function handlePost(row) {
    if (!postRequest) return;
    try {
      await postRequest(row.id);
      toast.success("Posted successfully");
      load();
    } catch (err) {
      toast.error(err?.message || "Post failed");
    }
  }

  const tableColumns = columns || [
    { key: "docNo", label: "Document No", width: "14%", align: "center", sortable: true },
    { key: "docDate", label: "Date", width: "12%", align: "center", type: "date", sortable: true },
    { key: "status", label: "Status", width: "10%", align: "center", sortable: true },
    { key: "totalAmount", label: "Amount", width: "10%", align: "right", sortable: true },
    { key: "action", label: "Action", width: "8%", align: "center" },
  ];

  return (
    <div className="page">
      <div className={styles.toolbar}>
        <ErpBackButton
          onClick={() => navigate(appPath(backSegment))}
          ariaLabel="Back"
        />
        <img src={SeparatorIcon} alt="" className={styles.sep} />
        <h1 className={styles.title}>
          {title}
          {activeLocation ? ` · ${activeLocation.name || activeLocation.locationId}` : ""}
        </h1>
      </div>

      <div className="page-content">
        <DataTable
          columns={tableColumns}
          rows={rows}
          loading={loading}
          showNewBtn={false}
          actions={[
            ...(postRequest
              ? [{ label: "Post", onClick: (row) => row.status === "Draft" && handlePost(row) }]
              : []),
            ...(deleteRequest
              ? [{ label: "Delete", onClick: (row) => row.status === "Draft" && setConfirmRow(row) }]
              : []),
          ]}
        />
      </div>

      {confirmRow ? (
        <ConfirmDialog
          title="Delete document?"
          message={`Delete ${confirmRow.docNo}?`}
          onConfirm={() => handleDelete(confirmRow)}
          onCancel={() => setConfirmRow(null)}
        />
      ) : null}
    </div>
  );
}
