import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useFooter } from "../../context/FooterContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useHubReturn } from "../../utils/hubNavigation.js";
import MasterBreadcrumbToolbar from "../../components/masters/MasterBreadcrumbToolbar.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import RmSpecificationStatusSummaryModal from "../../components/modals/RmSpecificationStatusSummaryModal.jsx";
import ApplyCopiedRmSpecificationModal from "../../components/modals/ApplyCopiedRmSpecificationModal.jsx";
import {
  applyRmSpecificationCopyRequest,
  deleteRmSpecificationRequest,
  getRmSpecificationStatusSummaryRequest,
  listRmSpecificationsRequest,
} from "../../services/api.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import pageStyles from "./RmSpecificationListPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

const RM_FILTER_OPTIONS = [
  { value: "all", label: "All items" },
  { value: "with", label: "With RM specification" },
  { value: "without", label: "Without RM specification" },
];

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
    idcConfigured: Boolean(doc?.idcConfigured),
    rmSpecConfigured: Boolean(doc?.rmSpecConfigured),
    revNumber: Number(doc?.revNumber || 0),
    status: doc?.status || "Active",
  };
}

export default function RmSpecificationListPage() {
  const { navigateWithHubReturn } = useHubReturn("masters/quality");
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rmFilter, setRmFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySource, setCopySource] = useState(null);
  const [copyListRows, setCopyListRows] = useState([]);
  const [copyListLoading, setCopyListLoading] = useState(false);
  const [applyingCopy, setApplyingCopy] = useState(false);
  const [overrideConfirm, setOverrideConfirm] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (rmFilter !== "all") qs.set("rmFilter", rmFilter);
      if (categoryFilter) qs.set("category", categoryFilter);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await listRmSpecificationsRequest(suffix);
      setRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load RM specifications");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [rmFilter, categoryFilter, toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  DataTable.useRecordCount(rows, setFooterContent);

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.itemCategory).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const openView = (row) => navigateWithHubReturn(`masters/quality/rm-specifications/${row.id}/view`);
  const openEdit = (row) => navigateWithHubReturn(`masters/quality/rm-specifications/${row.id}/edit`);

  const loadSummary = async () => {
    try {
      const res = await getRmSpecificationStatusSummaryRequest();
      setSummary(res?.data ?? null);
      setSummaryOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to load status summary");
    }
  };

  const handleDeleteRmSpec = async (row) => {
    if (!row) return;
    setDeleting(true);
    try {
      const res = await deleteRmSpecificationRequest(row.id);
      const itemNo = res?.data?.itemNo ?? row.itemNo;
      toast.success(
        `RM specification deleted for ${itemNo}. Material master was kept — you can add a new specification anytime.`
      );
      if (rmFilter === "with") {
        setRmFilter("all");
      }
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        const listFilter = rmFilter === "with" ? "all" : rmFilter;
        if (listFilter !== "all") qs.set("rmFilter", listFilter);
        if (categoryFilter) qs.set("category", categoryFilter);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        const listRes = await listRmSpecificationsRequest(suffix);
        setRows((Array.isArray(listRes?.data) ? listRes.data : []).map(normalizeRow));
      } finally {
        setLoading(false);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete RM specification");
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  };

  const openCopyModal = async (row) => {
    if (!row?.rmSpecConfigured) {
      toast.error("This item has no RM specification to copy.");
      return;
    }
    setCopying(true);
    setCopyListLoading(true);
    try {
      const res = await listRmSpecificationsRequest();
      setCopyListRows((Array.isArray(res?.data) ? res.data : []).map(normalizeRow));
      setCopySource(row);
      setCopyModalOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to open copy dialog");
    } finally {
      setCopying(false);
      setCopyListLoading(false);
    }
  };

  const closeCopyModal = () => {
    setCopyModalOpen(false);
    setCopySource(null);
    setCopyListRows([]);
    if (!applyingCopy) setOverrideConfirm(null);
  };

  const executeApplyCopy = async (targetItemIds, overrideExisting) => {
    if (!copySource?.id || !targetItemIds.length) return;
    setApplyingCopy(true);
    try {
      const res = await applyRmSpecificationCopyRequest(copySource.id, {
        targetItemIds,
        overrideExisting,
      });
      const data = res?.data ?? {};
      const applied = Array.isArray(data.applied) ? data.applied.length : 0;
      const skipped = Array.isArray(data.skipped) ? data.skipped : [];
      const skippedExisting = skipped.filter((s) => s.reason === "HAS_EXISTING");

      if (applied > 0) {
        toast.success(
          `RM specification from ${data.sourceItemNo || copySource.itemNo} applied to ${applied} material(s).`
        );
      }
      if (skippedExisting.length > 0 && !overrideExisting) {
        toast.info(
          `${skippedExisting.length} item(s) skipped because they already have a specification.`
        );
      }
      if (applied === 0 && skippedExisting.length === 0) {
        toast.error("No specifications were applied.");
      }

      closeCopyModal();
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to apply copied specification");
    } finally {
      setApplyingCopy(false);
      setOverrideConfirm(null);
    }
  };

  const handleApplyCopiedSpec = (targetItemIds) => {
    if (!targetItemIds.length) {
      toast.error("Select at least one item to apply the specification.");
      return;
    }

    const conflicts = targetItemIds
      .map((id) => copyListRows.find((r) => r.id === id))
      .filter((r) => r?.rmSpecConfigured);

    if (conflicts.length > 0) {
      setOverrideConfirm({ targetItemIds, conflicts });
      return;
    }

    executeApplyCopy(targetItemIds, false);
  };

  const COLUMNS = useMemo(
    () => [
      { key: "itemNo", label: "Material Code", width: "9%", align: "center", sortable: true, filterable: true },
      { key: "itemName", label: "Material Name", width: "14%", align: "left", sortable: true, filterable: true },
      {
        key: "itemDescription",
        label: "Material Description",
        width: "16%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      {
        key: "idc",
        label: "IDC",
        width: "5%",
        align: "center",
        render: (_, row) => (
          <button
            type="button"
            className={`${pageStyles.idcBtn} ${row.idcConfigured ? pageStyles.idcBtnConfigured : ""}`}
            title={row.idcConfigured ? "RM specification configured" : "RM specification not configured"}
            aria-label="RM specification"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <FileText size={14} strokeWidth={2} />
          </button>
        ),
      },
      { key: "uom", label: "UoM", width: "6%", align: "center", sortable: true, filterable: true },
      { key: "itemCategory", label: "Material Category", width: "14%", align: "left", sortable: true, filterable: true },
      { key: "itemQcl", label: "QCL", width: "6%", align: "center", sortable: true, filterable: true },
      {
        key: "status",
        label: "Status",
        width: "6%",
        align: "center",
        render: (_, row) => (
          <span
            className={`${pageStyles.statusDot} ${
              row.rmSpecConfigured ? pageStyles.statusDotOk : pageStyles.statusDotMissing
            }`}
            style={{ display: "block", margin: "0 auto" }}
            title={row.rmSpecConfigured ? "RM specification configured" : "RM specification not configured"}
          />
        ),
      },
      { key: "action", label: "Action", width: "7%", align: "center" },
    ],
    []
  );

  const actionOptions = [
    {
      label: "+ Specification",
      icon: <Plus size={15} color="var(--brand-primary, #0f7c94)" strokeWidth={1.9} />,
      onClick: openEdit,
    },
    {
      label: "View",
      icon: <Eye size={15} color="var(--brand-primary, #0f7c94)" strokeWidth={1.9} />,
      variant: "muted",
      onClick: openView,
    },
    {
      label: "Edit",
      icon: <Pencil size={15} color="var(--brand-primary, #0f7c94)" strokeWidth={1.9} />,
      onClick: openEdit,
    },
    {
      label: "Copy",
      icon: <Copy size={15} color="var(--brand-primary, #0f7c94)" strokeWidth={1.9} />,
      disabled: (row) => !row.rmSpecConfigured || copying,
      onClick: openCopyModal,
    },
    {
      label: "Delete",
      icon: <Trash2 size={15} color="var(--brand-primary, #0f7c94)" strokeWidth={1.9} />,
      variant: "danger",
      disabled: (row) => !row.rmSpecConfigured,
      onClick: (row) => setConfirmTarget(row),
    },
  ];

  return (
    <div className={`erp-page ${toolbarStyles.page} ${pageStyles.pageFill}`}>
      <MasterBreadcrumbToolbar defaultHubReturn="masters/quality" summaryTitle="RM Specifications" />

      <section className={pageStyles.panel}>
        <div className={pageStyles.panelHeader}>
          <h2 className={pageStyles.panelTitle}>RM Specification Summary</h2>
          <div className={pageStyles.panelActions}>
            <select
              className={pageStyles.filterSelect}
              value={rmFilter}
              onChange={(e) => setRmFilter(e.target.value)}
              aria-label="RM specification filter"
            >
              {RM_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className={pageStyles.filterSelect}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Material category filter"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button type="button" className={pageStyles.btnSummary} onClick={loadSummary}>
              Status Summary
            </button>
          </div>
        </div>

        <div className={pageStyles.panelBody}>
          <DataTable
            className={pageStyles.tableWrap}
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            actions={actionOptions}
            showNewBtn={false}
            searchPlaceholder="Search material code, name, category..."
            pageSize={10}
            paginationAtTop
            hideBottomPagination
            hidePaginationTotalRecords
            disableInnerScroll
            alwaysShowPagination
          />
        </div>
      </section>

      <RmSpecificationStatusSummaryModal
        open={summaryOpen}
        summary={summary}
        onClose={() => setSummaryOpen(false)}
      />

      <ApplyCopiedRmSpecificationModal
        open={copyModalOpen}
        sourceRow={copySource}
        allRows={copyListRows}
        loading={copyListLoading}
        applying={applyingCopy}
        onClose={closeCopyModal}
        onApply={handleApplyCopiedSpec}
      />

      <ConfirmDialog
        open={!!overrideConfirm}
        title="Override existing specification?"
        message={
          overrideConfirm
            ? `${overrideConfirm.conflicts.length} selected item(s) already have an RM specification (${overrideConfirm.conflicts
                .slice(0, 5)
                .map((r) => r.itemNo)
                .join(", ")}${
                overrideConfirm.conflicts.length > 5 ? "…" : ""
              }). Replace with the copied specification from ${copySource?.itemNo || "source"}?`
            : ""
        }
        confirmLabel="Override and apply"
        cancelLabel="Cancel"
        variant="primary"
        loading={applyingCopy}
        onConfirm={() =>
          executeApplyCopy(overrideConfirm?.targetItemIds ?? [], true)
        }
        onCancel={() => (!applyingCopy ? setOverrideConfirm(null) : null)}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete RM Specification"
        message={
          confirmTarget
            ? `Delete the RM specification for material ${confirmTarget.itemNo} (${confirmTarget.itemName})? Only the specification data will be removed. The material will remain in Material Master and in this list.`
            : ""
        }
        confirmLabel="Delete specification"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={() => handleDeleteRmSpec(confirmTarget)}
        onCancel={() => (!deleting ? setConfirmTarget(null) : null)}
      />
    </div>
  );
}
