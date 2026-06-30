import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./HsnPMasterPage.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import PaymentTermsMasterModal from "../../components/modals/PaymentTermsMasterModal.jsx";
import PaymentTermsRevisionModal from "../../components/modals/PaymentTermsRevisionModal.jsx";
import PaymentTermsRevisionHistoryModal from "../../components/modals/PaymentTermsRevisionHistoryModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  listPaymentTermsMasterRequest,
  createPaymentTermsMasterRequest,
  updatePaymentTermsMasterRequest,
  deletePaymentTermsMasterRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  return {
    ...doc,
    _id: id,
    id,
    paymentTermsCode: doc.paymentTermsCode ?? "",
    order: doc.displayOrder ?? doc.order ?? 0,
    description: doc.description ?? "",
    revNumber: doc.revNumber ?? 0,
    status: doc.status || "Active",
    governmentApproved: doc.mpbcdcPaymentTerms?.governmentApproved ?? "",
  };
}

const COLUMNS = [
  {
    key: "paymentTermsCode",
    label: "Payment Terms Code",
    width: "16%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "order",
    label: "Order",
    width: "10%",
    align: "center",
    sortable: true,
  },
  {
    key: "description",
    label: "Payment Terms Description",
    width: "38%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "governmentApproved",
    label: "Gov. Approved",
    width: "10%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "status",
    label: "Status",
    width: "12%",
    align: "center",
    filterable: true,
    type: "status",
  },
  {
    key: "revNumber",
    label: "Rev #",
    width: "8%",
    align: "center",
    sortable: true,
    render: (v) => <span className={pageStyles.revLink}>Rev {v ?? 0}</span>,
  },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function PaymentTermsMasterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionLogRow, setRevisionLogRow] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const suggestedOrder = useMemo(() => {
    if (!rows.length) return 1;
    return Math.max(...rows.map((r) => Number(r.order) || 0)) + 1;
  }, [rows]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPaymentTermsMasterRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load Payment Terms records");
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
      await deletePaymentTermsMasterRequest(row._id || row.id);
      toast.success("Payment Terms record deleted.");
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editRow) {
        if (!payload?.revisionInfo) {
          setPendingEditPayload(payload);
          setRevisionModalOpen(true);
          return { deferred: true };
        }
        await updatePaymentTermsMasterRequest(editRow._id || editRow.id, payload);
      } else {
        await createPaymentTermsMasterRequest(payload);
      }
      await fetchRows();
    } catch (err) {
      const message =
        err?.data?.message || err?.message || "Failed to save Payment Terms record";
      throw Object.assign(new Error(message), { data: err?.data });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditRow(null);
    setPendingEditPayload(null);
    setRevisionModalOpen(false);
  };

  const handleRevisionSave = async (revisionInfo) => {
    if (!editRow || !pendingEditPayload) {
      setRevisionModalOpen(false);
      return;
    }
    try {
      await handleSave({ ...pendingEditPayload, revisionInfo });
      toast.success("Payment Terms record updated with revision details.");
      setRevisionModalOpen(false);
      setPendingEditPayload(null);
      setModalOpen(false);
      setEditRow(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save revision");
    }
  };

  const ACTION_OPTIONS = [
    {
      label: "View",
      icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
      variant: "muted",
      onClick: (row) => {
        setEditRow(row);
        setModalOpen(true);
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => {
        setEditRow(row);
        setModalOpen(true);
      },
    },
    {
      label: "Revision Log",
      icon: <FileClock size={15} color="#22c55e" strokeWidth={1.9} />,
      disabled: (row) => Number(row?.revNumber || 0) === 0,
      onClick: (row) => setRevisionLogRow(row),
    },
    {
      label: "Delete",
      icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />,
      variant: "danger",
      onClick: (row) => setConfirmTarget(row),
    },
  ];

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("masters/purchase"))} ariaLabel="Back to Purchase Masters" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("masters"))}>
            Masters
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("masters/purchase"))}
          >
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Payment Terms Summary</span>
        </h1>
      </header>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search code or description..."
        pageSize={10}
        onNew={() => {
          setEditRow(null);
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Payment Terms Record"
        message={
          confirmTarget
            ? `Are you sure you want to delete ${confirmTarget.paymentTermsCode}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />

      {modalOpen && (
        <PaymentTermsMasterModal
          initialData={editRow}
          suggestedOrder={editRow ? "" : suggestedOrder}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

      <PaymentTermsRevisionModal
        open={revisionModalOpen}
        revisionNo={Number(editRow?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          setRevisionModalOpen(false);
          setPendingEditPayload(null);
        }}
        onSave={handleRevisionSave}
      />

      <PaymentTermsRevisionHistoryModal
        open={!!revisionLogRow}
        sourceRow={revisionLogRow}
        onClose={() => setRevisionLogRow(null)}
      />
    </div>
  );
}
