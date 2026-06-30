import { useCallback, useEffect, useState } from "react";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import { useToast } from "../../hooks/useToast.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./StandardSpecificationPage.module.css";
import revStyles from "../masters/HsnPMasterPage.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import InspectionChecklistModal from "../../components/modals/InspectionChecklistModal.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import InspectionChecklistRevisionHistoryModal from "../../components/modals/InspectionChecklistRevisionHistoryModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  listInspectionChecklistsRequest,
  createInspectionChecklistRequest,
  updateInspectionChecklistRequest,
  deleteInspectionChecklistRequest,
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
    checklistId: doc.checklistId ?? "",
    checklistItem: doc.checklistItem ?? "",
    displayOrder: doc.displayOrder ?? 0,
    revNumber: doc.revNumber ?? 0,
    status: doc.status || "Active",
    revisionHistory: Array.isArray(doc.revisionHistory) ? doc.revisionHistory : [],
  };
}

const COLUMNS = [
  {
    key: "checklistId",
    label: "Checklist ID",
    width: "12%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "displayOrder",
    label: "Order",
    width: "8%",
    align: "center",
    sortable: true,
  },
  {
    key: "checklistItem",
    label: "Inspection Checklist Item",
    width: "46%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "revNumber",
    label: "Rev #",
    width: "8%",
    align: "center",
    sortable: true,
    render: (v) => <span className={revStyles.revLink}>Rev {v ?? 0}</span>,
  },
  {
    key: "status",
    label: "Status",
    width: "10%",
    align: "center",
    filterable: true,
    type: "status",
  },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function InspectionChecklistPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [pendingEditPayload, setPendingEditPayload] = useState(null);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionLogRow, setRevisionLogRow] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listInspectionChecklistsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load inspection checklists");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async (row) => {
    if (!row) return;
    setDeleting(true);
    try {
      await deleteInspectionChecklistRequest(row._id || row.id);
      toast.success("Inspection checklist deleted.");
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
        await updateInspectionChecklistRequest(editRow._id || editRow.id, payload);
      } else {
        await createInspectionChecklistRequest(payload);
      }
      await fetchRows();
    } catch (err) {
      const message = err?.data?.message || err?.message || "Failed to save checklist";
      throw Object.assign(new Error(message), { data: err?.data });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditRow(null);
    setViewOnly(false);
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
      toast.success("Checklist updated with revision details.");
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
        setViewOnly(true);
        setModalOpen(true);
      },
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: (row) => {
        setEditRow(row);
        setViewOnly(false);
        setModalOpen(true);
      },
    },
    {
      label: "Revision Info",
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
      <MasterBreadcrumbToolbar
        defaultHubReturn="masters/quality"
        summaryTitle="Inspection Checklist"
      />

      <div className={pageStyles.summaryBar}>
        <h2 className={pageStyles.summaryTitle}>Inspection Checklist Summary</h2>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search checklist ID or item..."
        pageSize={10}
        stableSortKeys={["displayOrder", "checklistId"]}
        onNew={() => {
          setEditRow(null);
          setViewOnly(false);
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Inspection Checklist"
        message={
          confirmTarget
            ? `Are you sure you want to delete ${confirmTarget.checklistId}? This action cannot be undone.`
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
        <InspectionChecklistModal
          initialData={editRow}
          readOnly={viewOnly}
          onClose={handleModalClose}
          onSave={viewOnly ? null : handleSave}
        />
      )}

      <HsnPRevisionModal
        open={revisionModalOpen}
        revisionNo={Number(editRow?.revNumber || 0) + 1}
        defaultProposedBy={getUserDisplayName()}
        onClose={() => {
          setRevisionModalOpen(false);
          setPendingEditPayload(null);
        }}
        onSave={handleRevisionSave}
      />

      <InspectionChecklistRevisionHistoryModal
        open={!!revisionLogRow}
        sourceRow={revisionLogRow}
        onClose={() => setRevisionLogRow(null)}
      />
    </div>
  );
}
