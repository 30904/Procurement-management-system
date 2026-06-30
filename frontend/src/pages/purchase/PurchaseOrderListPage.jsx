import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Eye,
  FileSearch,
  Pencil,
  XCircle,
} from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import styles from "../../styles/page-toolbar.module.css";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import { getPurchaseOrderWorkspace, PO_CHANNEL } from "../../config/purchaseOrderWorkspace.js";
import { listPurchaseOrdersRequest } from "../../services/api.js";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const status = doc.status || "Draft";
  const poValue = doc.poValue && typeof doc.poValue === "object" ? doc.poValue : {};
  const totalPoValue = Number(poValue.totalPoValue ?? doc.totalAmount ?? 0);
  const proc = doc.procurementReference || {};
  const gov = doc.governmentProcurement || {};
  const tracking = doc.approvalTracking || {};
  return {
    ...doc,
    _id: id,
    id,
    poNo: doc.poNo ?? "",
    poDate: doc.poDate ?? "",
    supplierName: doc.supplierName ?? "",
    poType: doc.poType || "Standard PO",
    currency: doc.currency || doc.ccy || "INR",
    totalPoValue,
    ppv: Number(doc.ppv ?? poValue.ppv ?? 0),
    grnStatus: doc.grnStatus || "Not Started",
    status,
    statusInactive: status === "Cancelled" || status === "Closed",
    purchaseType: proc.purchaseType || "",
    procurementCategory: proc.procurementCategory || "",
    mpbcdcApprovalStatus: tracking.approvalStatus || "",
    gemPurchase: gov.gemPurchase || "",
    tenderPurchase: gov.tenderPurchase || "",
  };
}

function isDraft(row) {
  return String(row?.status || "") === "Draft";
}

function StatusCell({ row }) {
  return <DocumentStatusBadge status={row.status} />;
}

const COLUMNS = [
  {
    key: "poNo",
    label: "PO No.",
    width: "10%",
    minWidth: "5.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "poDate",
    label: "PO Date",
    width: "9%",
    minWidth: "5rem",
    align: "center",
    type: "date",
    sortable: true,
  },
  {
    key: "supplierName",
    label: "Vendor Name",
    width: "18%",
    minWidth: "8rem",
    align: "left",
    sortable: true,
    filterable: true,
  },
  {
    key: "poType",
    label: "PO Type",
    width: "9%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "purchaseType",
    label: "Purchase Type",
    width: "8%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "procurementCategory",
    label: "Procurement Category",
    width: "9%",
    minWidth: "5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "mpbcdcApprovalStatus",
    label: "Approval Status",
    width: "8%",
    minWidth: "4.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "gemPurchase",
    label: "GeM",
    width: "5%",
    minWidth: "2.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "tenderPurchase",
    label: "Tender",
    width: "5%",
    minWidth: "2.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "currency",
    label: "Ccy",
    width: "5%",
    minWidth: "2.5rem",
    align: "center",
    sortable: true,
    filterable: true,
  },
  {
    key: "totalPoValue",
    label: "Total PO Value",
    width: "11%",
    minWidth: "5.5rem",
    align: "right",
    sortable: true,
    render: (val) => formatMoney(val),
  },
  {
    key: "ppv",
    label: "PPV",
    width: "8%",
    minWidth: "4rem",
    align: "right",
    sortable: true,
    render: (val) => formatMoney(val),
  },
  {
    key: "grnStatus",
    label: "Goods Receipt Status",
    width: "9%",
    minWidth: "4.5rem",
    align: "center",
    filterable: true,
    sortable: true,
  },
  {
    key: "status",
    label: "PO Status",
    width: "9%",
    minWidth: "4.5rem",
    align: "center",
    filterable: true,
    render: (_, row) => <StatusCell row={row} />,
  },
  { key: "action", label: "Action", width: "7%", minWidth: "3.5rem", align: "center" },
];

export default function PurchaseOrderListPage({ workspace = "generate-po" }) {
  const ws = getPurchaseOrderWorkspace(workspace);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const channelParam =
        ws.poChannel === PO_CHANNEL.DOMESTIC || ws.poChannel === PO_CHANNEL.IMPORT
          ? { poChannel: ws.poChannel }
          : {};
      const res = await listPurchaseOrdersRequest(channelParam);
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase orders");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast, ws.poChannel]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows, activeLocationId]);

  useEffect(() => {
    if (!location.state?.refresh) return;
    fetchRows();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.refresh, fetchRows, navigate, location.pathname]);

  DataTable.useRecordCount(rows, setFooterContent);

  const openDetail = useCallback(
    (row, intent = "view") => {
      const id = row._id || row.id;
      if (!id) return;
      if (intent === "preview") {
        navigate(appPath(ws.printPath(id)));
        return;
      }
      const q = intent === "view" ? "" : `?intent=${intent}`;
      navigate(appPath(`${ws.detailPath(id)}${q}`));
    },
    [navigate, ws]
  );

  const openEdit = useCallback(
    (row) => {
      const id = row._id || row.id;
      if (!id) return;
      navigate(appPath(ws.editPath(id)));
    },
    [navigate, ws]
  );

  const ACTION_OPTIONS = useMemo(
    () => [
      {
        label: "View",
        icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
        variant: "muted",
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "view"),
      },
      {
        label: "Edit",
        icon: <Pencil size={15} color="#fb923c" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openEdit(row),
      },
      {
        label: "Approve",
        icon: <CheckCircle size={15} color="#16a34a" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "approve"),
      },
      {
        label: "Cancel",
        icon: <XCircle size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "cancel"),
      },
      {
        label: "Preview",
        icon: <FileSearch size={15} color="#7c3aed" strokeWidth={1.9} />,
        disabled: (row) => !isDraft(row),
        onClick: (row) => openDetail(row, "preview"),
      },
    ],
    [openDetail, openEdit]
  );

  return (
    <div className={`erp-page ${styles.page}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(ws.parentHubPath))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(ws.purchaseHubPath))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{ws.title}</span>
        </h1>
      </header>

      {ws.poChannel === PO_CHANNEL.DOMESTIC ? (
        <section
          style={{
            margin: "0 0 1rem",
            padding: "1rem 1.15rem",
            borderRadius: 0,
            background: "linear-gradient(120deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)",
            color: "#fff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Domestic purchase orders</h2>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", opacity: 0.9, maxWidth: 560 }}>
            Draft POs for INR / India suppliers only. Use <strong>New</strong> for the card-based create
            screen with supplier insight and readable line details.
          </p>
        </section>
      ) : null}
      {ws.poChannel === PO_CHANNEL.IMPORT ? (
        <section
          style={{
            margin: "0 0 1rem",
            padding: "1rem 1.15rem",
            borderRadius: 0,
            background: "linear-gradient(120deg, #134e4a 0%, #0d9488 55%, #14b8a6 100%)",
            color: "#fff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Import purchase orders</h2>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", opacity: 0.9, maxWidth: 620 }}>
            Draft POs for overseas / foreign-currency suppliers. Use <strong>New</strong> for landed cost,
            exchange rate, and card-based line entry.
          </p>
        </section>
      ) : null}

      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={ACTION_OPTIONS}
        searchPlaceholder="Search PO no. or supplier..."
        pageSize={10}
        onNew={() => navigate(appPath(ws.newPath))}
        onRowClick={(row) => isDraft(row) && openDetail(row, "view")}
      />
    </div>
  );
}
