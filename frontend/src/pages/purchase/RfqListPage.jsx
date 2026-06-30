import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Eye,
  FileSpreadsheet,
  Pencil,
  Printer,
  SlidersHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { RFQ_PATHS } from "../../config/rfqPaths.js";
import { RFQ_STATUS_OPTIONS } from "../../config/rfqOptions.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  deleteRfqRequest,
  listRfqsRequest,
  listSupplierMasterRequest,
} from "../../services/api.js";
import { downloadMasterWorkbook } from "../../utils/masterExcelExport.js";
import { currentMonthRange } from "../../utils/reportPageUtils.js";
import styles from "../../styles/page-toolbar.module.css";
import listStyles from "./RfqListPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatDisplayDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseDay(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inDateRange(value, from, to) {
  const d = parseDay(value);
  if (!d) return false;
  const fromD = from ? parseDay(from) : null;
  const toD = to ? parseDay(`${to}T23:59:59`) : null;
  if (fromD && d < fromD) return false;
  if (toD && d > toD) return false;
  return true;
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const status = doc.displayStatus || doc.status || "Draft";
  return {
    ...doc,
    _id: id,
    id,
    rfqNo: doc.rfqNo ?? "",
    rfqDate: doc.rfqDate ?? "",
    rfqType: doc.rfqType ?? "",
    department: doc.department ?? "",
    procurementCategory: doc.procurementCategory ?? "",
    referencePrNo: doc.referencePrNo ?? "",
    vendorCount: doc.vendorCount ?? (Array.isArray(doc.vendors) ? doc.vendors.length : 0),
    closingDate: doc.closingDate ?? "",
    status,
    createdByName: doc.createdByName ?? doc.buyer ?? "",
    vendorNames: (doc.vendors || []).map((v) => v.supplierName).join(", "),
  };
}

function isDraft(row) {
  return String(row?.status || "") === "Draft";
}

const ALL_COLUMNS = [
  { key: "rfqNo", label: "RFQ No", width: "10%", minWidth: "5rem", align: "center", sortable: true, filterable: true },
  {
    key: "rfqDate",
    label: "RFQ Date",
    width: "8%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    render: (val) => formatDisplayDate(val),
  },
  { key: "rfqType", label: "RFQ Type", width: "8%", align: "center", sortable: true, filterable: true },
  { key: "department", label: "Department", width: "10%", align: "left", sortable: true, filterable: true },
  {
    key: "procurementCategory",
    label: "Procurement Category",
    width: "10%",
    align: "left",
    sortable: true,
    filterable: true,
  },
  { key: "referencePrNo", label: "Reference PR", width: "9%", align: "center", sortable: true, filterable: true },
  {
    key: "vendorCount",
    label: "Vendor Count",
    width: "7%",
    align: "center",
    sortable: true,
    render: (val) => String(val ?? 0),
  },
  {
    key: "closingDate",
    label: "Closing Date",
    width: "8%",
    align: "center",
    sortable: true,
    render: (val) => formatDisplayDate(val),
  },
  {
    key: "status",
    label: "Status",
    width: "8%",
    align: "center",
    filterable: true,
    render: (_, row) => <DocumentStatusBadge status={row.status} />,
  },
  { key: "createdByName", label: "Created By", width: "10%", align: "left", sortable: true, filterable: true },
  { key: "action", label: "Actions", width: "6%", align: "center" },
];

const EXPORT_COLUMNS = ALL_COLUMNS.filter((c) => c.key !== "action").map((c) => ({
  key: c.key,
  label: c.label,
  align: c.align === "right" ? "right" : c.align === "center" ? "center" : "left",
}));

const defaultRange = currentMonthRange();

export default function RfqListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [fromDate, setFromDate] = useState(defaultRange.from);
  const [toDate, setToDate] = useState(defaultRange.to);
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendorOptions, setVendorOptions] = useState([]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRfqsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setAllRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load RFQs");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, activeLocationId]);

  useEffect(() => {
    if (!location.state?.refresh) return;
    fetchRows();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.refresh, fetchRows, navigate, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listSupplierMasterRequest();
        if (!cancelled) {
          const rows = Array.isArray(res?.data) ? res.data : [];
          setVendorOptions(
            rows.map((s) => ({
              value: String(s._id || s.id),
              label: `${s.supplierCode || ""} · ${s.supplierName || ""}`.trim(),
            }))
          );
        }
      } catch {
        if (!cancelled) setVendorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentOptions = useMemo(() => {
    const set = new Set(allRows.map((r) => r.department).filter(Boolean));
    return [{ value: "", label: "All departments" }, ...Array.from(set).map((d) => ({ value: d, label: d }))];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (!inDateRange(row.rfqDate, fromDate, toDate)) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (departmentFilter && row.department !== departmentFilter) return false;
      if (vendorFilter) {
        const vendors = row.vendors || [];
        const match = vendors.some((v) => String(v.supplierId) === vendorFilter);
        if (!match) return false;
      }
      return true;
    });
  }, [allRows, fromDate, toDate, statusFilter, departmentFilter, vendorFilter]);

  DataTable.useRecordCount(filteredRows, setFooterContent);

  const columns = useMemo(
    () => ALL_COLUMNS.filter((c) => !hiddenColumns.includes(c.key)),
    [hiddenColumns]
  );

  const openDetail = useCallback(
    (row, intent = "view") => {
      const id = row._id || row.id;
      if (!id) return;
      const q = intent === "view" ? "" : `?intent=${intent}`;
      navigate(appPath(`${RFQ_PATHS.detailPath(id)}${q}`));
    },
    [navigate]
  );

  const openEdit = useCallback(
    (row) => {
      const id = row._id || row.id;
      if (!id) return;
      navigate(appPath(RFQ_PATHS.editPath(id)));
    },
    [navigate]
  );

  const openPrint = useCallback(
    (row) => {
      const id = row._id || row.id;
      if (!id) return;
      navigate(appPath(RFQ_PATHS.printPath(id)));
    },
    [navigate]
  );

  const handleExport = async () => {
    try {
      await downloadMasterWorkbook({
        sheetName: "RFQ Register",
        fileName: "rfq-list.xlsx",
        columns: EXPORT_COLUMNS,
        rows: filteredRows,
        getCellValue: (row, col) => {
          if (col.key === "rfqDate" || col.key === "closingDate") return formatDisplayDate(row[col.key]);
          return row[col.key] ?? "";
        },
      });
    } catch (err) {
      toast.error(err?.message || "Export failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?.id || deleting) return;
    setDeleting(true);
    try {
      await deleteRfqRequest(deleteRow.id);
      toast.success(`Deleted ${deleteRow.rfqNo}`);
      setDeleteRow(null);
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to delete RFQ");
    } finally {
      setDeleting(false);
    }
  };

  const toggleColumn = (key) => {
    setHiddenColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const ACTION_OPTIONS = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
        variant: "muted",
        onClick: (row) => openDetail(row, "view"),
      },
      {
        label: "Edit",
        icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openEdit(row),
      },
      {
        label: "Print",
        icon: <Printer size={15} color="#e11d8f" strokeWidth={1.9} />,
        onClick: (row) => openPrint(row),
      },
      {
        label: "Submit",
        icon: <CheckCircle size={15} color="#16a34a" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "submit"),
      },
      {
        label: "Cancel",
        icon: <XCircle size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        disabled: (row) => !["Draft", "Submitted", "Open"].includes(row.status),
        onClick: (row) => openDetail(row, "cancel"),
      },
      {
        label: "Delete",
        icon: <Trash2 size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        disabled: (row) => !isDraft(row),
        onClick: (row) => setDeleteRow(row),
      },
    ],
    [openDetail, openEdit, openPrint]
  );

  const toolbarRight = (
    <div className={listStyles.toolbarActions}>
      <button
        type="button"
        className={listStyles.iconBtn}
        onClick={() => setShowAdvanced((v) => !v)}
        title="Advanced filters"
        aria-label="Advanced filters"
      >
        <SlidersHorizontal size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={listStyles.iconBtn}
        onClick={() => setShowColumnPicker((v) => !v)}
        title="Column chooser"
        aria-label="Column chooser"
      >
        Columns
      </button>
      <button type="button" className={listStyles.iconBtn} onClick={handleExport} title="Export Excel">
        <FileSpreadsheet size={18} color="#16a34a" strokeWidth={2} />
      </button>
      <button type="button" className={listStyles.iconBtn} onClick={() => window.print()} title="Print">
        <Printer size={18} strokeWidth={2} />
      </button>
    </div>
  );

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(RFQ_PATHS.hubPath))} ariaLabel="Back to Purchase" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(RFQ_PATHS.hubPath))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{RFQ_PATHS.title}</span>
        </h1>
      </header>

      {showAdvanced ? (
        <section className={listStyles.filterBar}>
          <DateField label="From date" value={fromDate} onChange={setFromDate} />
          <DateField label="To date" value={toDate} onChange={setToDate} />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "", label: "All statuses" }, ...RFQ_STATUS_OPTIONS]}
          />
          <SelectField
            label="Department"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={departmentOptions}
          />
          <SelectField
            label="Vendor"
            value={vendorFilter}
            onChange={setVendorFilter}
            options={[{ value: "", label: "All vendors" }, ...vendorOptions]}
          />
        </section>
      ) : null}

      {showColumnPicker ? (
        <section className={listStyles.columnPicker}>
          {ALL_COLUMNS.filter((c) => c.key !== "action").map((col) => (
            <label key={col.key} className={listStyles.columnPickerItem}>
              <input
                type="checkbox"
                checked={!hiddenColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
              />
              {col.label}
            </label>
          ))}
        </section>
      ) : null}

      <DataTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search RFQ no., department, PR reference…"
        pageSize={10}
        onNew={() => navigate(appPath(RFQ_PATHS.newPath))}
        onRowClick={(row) => openDetail(row, "view")}
        toolbarRight={toolbarRight}
      />

      <ConfirmDialog
        open={Boolean(deleteRow)}
        title="Delete RFQ"
        message={`Delete draft RFQ ${deleteRow?.rfqNo}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />
    </div>
  );
}
