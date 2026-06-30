import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useLocation, useNavigate } from "react-router-dom";
import { Eye, XCircle } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import DataTable from "../../components/common/DataTable.jsx";
import PoCancelRemarksModal from "../../components/purchase/PoCancelRemarksModal.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import {
  cancelApprovedServicePurchaseOrderRequest,
  listCancellableServicePurchaseOrdersRequest,
} from "../../services/api.js";
import { CANCEL_SPO_LIST_PATH } from "../../utils/servicePurchaseOrderFormState.js";
import pageStyles from "../planning/ItemInventoryLevelListPage.module.css";
import styles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  return {
    ...doc,
    _id: id,
    id,
    spoNo: doc.spoNo ?? "",
    spoDate: doc.spoDate ?? "",
    serviceProviderName: doc.serviceProviderName ?? "",
    serviceCategory: doc.serviceCategory || "Domestic",
    currency: doc.currency || "INR",
    totalSpoValue: Number(doc.totalSpoValue ?? 0),
    amd: Number(doc.amd ?? doc.amendRevNo ?? 0),
    status: doc.status || "Approved",
    receiptStatus: doc.receiptStatus || "Not Started",
  };
}

function AmdCell({ value }) {
  const n = Number(value) || 0;
  if (n <= 0) return <span style={{ color: "#94a3b8" }}>—</span>;
  return <span style={{ fontWeight: 600 }}>{n}</span>;
}

export default function CancelSpoListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocationId } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelRow, setCancelRow] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCancellableServicePurchaseOrdersRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load service purchase orders");
      setRows([]);
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

  DataTable.useRecordCount(rows, setFooterContent);

  const openView = (row) => navigate(appPath(`${CANCEL_SPO_LIST_PATH}/${row.id}`));

  const handleCancelConfirm = async (cancelRemarks) => {
    if (!cancelRow?.id || cancelling) return;
    setCancelling(true);
    try {
      await cancelApprovedServicePurchaseOrderRequest(cancelRow.id, { cancelRemarks });
      toast.success(`Service purchase order ${cancelRow.spoNo} cancelled.`);
      setCancelRow(null);
      await fetchRows();
    } catch (err) {
      toast.error(err?.message || "Failed to cancel SPO");
    } finally {
      setCancelling(false);
    }
  };

  const COLUMNS = useMemo(
    () => [
      { key: "spoNo", label: "SPO #", width: "10%", align: "center", sortable: true, filterable: true },
      {
        key: "spoDate",
        label: "SPO Date",
        width: "9%",
        align: "center",
        sortable: true,
        render: (val) => formatDisplayDate(val),
      },
      {
        key: "serviceProviderName",
        label: "Vendor Name",
        width: "18%",
        align: "left",
        sortable: true,
        filterable: true,
      },
      {
        key: "serviceCategory",
        label: "Purchase Category",
        width: "10%",
        align: "center",
        sortable: true,
        filterable: true,
      },
      { key: "currency", label: "Ccy", width: "6%", align: "center", sortable: true },
      {
        key: "totalSpoValue",
        label: "SPO Value",
        width: "11%",
        align: "right",
        sortable: true,
        render: (val) => formatMoney(val),
      },
      {
        key: "amd",
        label: "AMD",
        width: "5%",
        align: "center",
        sortable: true,
        render: (val) => <AmdCell value={val} />,
      },
      { key: "action", label: "Action", width: "8%", align: "center" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: "Cancel SPO",
        icon: <XCircle size={15} color="#dc2626" strokeWidth={1.9} />,
        variant: "danger",
        onClick: (row) => setCancelRow(row),
      },
      {
        label: "View",
        icon: <Eye size={15} color="#0f3d91" strokeWidth={1.9} />,
        onClick: (row) => openView(row),
      },
    ],
    []
  );

  return (
    <div className={`erp-page ${styles.page} ${pageStyles.pageFill}`}>
      <header className={styles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("purchase/service-po"))} ariaLabel="Back to Service PO" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase/service-po"))}>
            Service PO
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Cancel SPO</span>
        </h1>
      </header>

      <section className={`${pageStyles.panel} ${pageStyles.panelFill}`}>
        <div className={pageStyles.panelHeader}>
          <h2 className={pageStyles.panelTitle}>Service Purchase Order Summary</h2>
        </div>
        <div className={pageStyles.panelBody}>
          <DataTable
            className={pageStyles.tableWrap}
            tableClassName="im-table--inl-compact"
            columns={COLUMNS}
            rows={rows}
            loading={loading}
            actions={actions}
            showNewBtn={false}
            searchPlaceholder="Search SPO no. or supplier…"
            pageSize={10}
            paginationAtTop
            hideBottomPagination
            hidePaginationTotalRecords
            disableInnerScroll
            alwaysShowPagination
          />
        </div>
      </section>

      <PoCancelRemarksModal
        open={Boolean(cancelRow)}
        poNo={cancelRow?.spoNo}
        submitting={cancelling}
        title="Cancel Service Purchase Order"
        confirmLabel="Cancel SPO"
        notStartedNote="Service receipt has not started on this SPO."
        onClose={() => !cancelling && setCancelRow(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
