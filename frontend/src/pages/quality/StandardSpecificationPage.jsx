import { useCallback, useEffect, useState } from "react";
import { Eye, FileClock, Pencil, Trash2 } from "lucide-react";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import { useToast } from "../../hooks/useToast.js";
import styles from "../../styles/page-toolbar.module.css";
import pageStyles from "./StandardSpecificationPage.module.css";
import revStyles from "../masters/HsnPMasterPage.module.css";
import DataTable from "../../components/common/DataTable.jsx";
import StandardSpecificationModal from "../../components/modals/StandardSpecificationModal.jsx";
import HsnPRevisionModal from "../../components/modals/HsnPRevisionModal.jsx";
import StandardSpecificationRevisionHistoryModal from "../../components/modals/StandardSpecificationRevisionHistoryModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  listStandardSpecificationsRequest,
  createStandardSpecificationRequest,
  updateStandardSpecificationRequest,
  deleteStandardSpecificationRequest,
} from "../../services/api.js";
import { getUserDisplayName } from "../../utils/authStorage.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function displayDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  return {
    ...doc,
    _id: id,
    id,
    specId: doc.specId ?? "",
    inspectionParameter: doc.inspectionParameter ?? "",
    uom: doc.uom ?? "",
    testStandard: doc.testStandard ?? "",
    testMethod: doc.testMethod ?? "",
    revNumber: doc.revNumber ?? 0,
    status: doc.status || "Active",
    revisionHistory: Array.isArray(doc.revisionHistory) ? doc.revisionHistory : [],
  };
}

const COLUMNS = [
  {
    key: "specId",
    label: "Spec ID",
    width: "10%",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "inspectionParameter",
    label: "Inspection/Test Parameter",
    width: "26%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  { key: "uom", label: "UoM", width: "8%", align: "center", sortable: true, filterable: true },
  {
    key: "testStandard",
    label: "Test Standard",
    width: "16%",
    align: "left",
    sortable: true,
    filterable: true,
    render: (v) => displayDash(v),
  },
  {
    key: "testMethod",
    label: "Test Method",
    width: "16%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "revNumber",
    label: "Rev #",
    width: "7%",
    align: "center",
    sortable: true,
    render: (v) => <span className={revStyles.revLink}>Rev {v ?? 0}</span>,
  },
  {
    key: "status",
    label: "Status",
    width: "9%",
    align: "center",
    filterable: true,
    type: "status",
  },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function StandardSpecificationPage() {
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
      const res = await listStandardSpecificationsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load standard specifications");
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
      await deleteStandardSpecificationRequest(row._id || row.id);
      toast.success("Standard specification deleted.");
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
        await updateStandardSpecificationRequest(editRow._id || editRow.id, payload);
      } else {
        await createStandardSpecificationRequest(payload);
      }
      await fetchRows();
    } catch (err) {
      const message = err?.data?.message || err?.message || "Failed to save specification";
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
      toast.success("Specification updated with revision details.");
      setRevisionModalOpen(false);
      setPendingEditPayload(null);
      setModalOpen(false);
      setEditRow(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save revision");
    }
  };

  const openCreate = () => {
    setEditRow(null);
    setViewOnly(false);
    setModalOpen(true);
  };

  const openView = (row) => {
    setEditRow(row);
    setViewOnly(true);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setViewOnly(false);
    setModalOpen(true);
  };

  const ACTION_OPTIONS = [
    {
      label: "View",
      icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
      variant: "muted",
      onClick: openView,
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
      onClick: openEdit,
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
        summaryTitle="Standard Specifications"
      />

      <div className={pageStyles.summaryBar}>
        <h2 className={pageStyles.summaryTitle}>Standard Specifications Summary</h2>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search spec ID, parameter, test standard, method..."
        pageSize={10}
        onNew={openCreate}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete Standard Specification"
        message={
          confirmTarget
            ? `Are you sure you want to delete Spec ID ${confirmTarget.specId}? This action cannot be undone.`
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
        <StandardSpecificationModal
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

      <StandardSpecificationRevisionHistoryModal
        open={!!revisionLogRow}
        sourceRow={revisionLogRow}
        onClose={() => setRevisionLogRow(null)}
      />
    </div>
  );
}
