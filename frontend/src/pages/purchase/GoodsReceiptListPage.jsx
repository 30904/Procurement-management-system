import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import { appPath } from "../../config/navigation.js";
import { resolveGoodsReceiptPaths } from "../../config/goodsReceiptPaths.js";
import { useFooter } from "../../context/FooterContext.jsx";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import { useToast } from "../../hooks/useToast.js";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import {
  deleteGoodsReceiptRequest,
  listGoodsReceiptsRequest,
  postGoodsReceiptRequest,
} from "../../services/api.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function normalizeRow(doc) {
  const id = doc._id != null ? String(doc._id) : String(doc.id);
  const receipt = doc.receiptInformation || {};
  const proc = doc.procurementReference || {};
  const gov = doc.governmentProcurement || {};
  return {
    ...doc,
    id,
    grnNo: doc.grnNo ?? "",
    grnDate: doc.grnDate ?? "",
    supplierName: doc.supplierName ?? "",
    status: doc.status ?? "",
    totalAmount: Number(doc.totalAmount) || 0,
    receiptType: receipt.receiptType || "",
    receiptStatus: receipt.receiptStatus || "",
    inspectionStatus: receipt.qcStatus || "",
    acceptedQty: receipt.acceptedQuantity ?? "",
    rejectedQty: receipt.rejectedQuantity ?? "",
    gemProcurement: gov.gemProcurement || "",
    tenderProcurement: gov.tenderProcurement || "",
    purchaseType: proc.purchaseType || "",
  };
}

const BASE_COLUMNS = [
  { key: "grnNo", label: "GRN No", width: "10%", align: "center", sortable: true, filterable: true },
  { key: "supplierName", label: "Vendor", width: "14%", align: "left", sortable: true, filterable: true },
  { key: "grnDate", label: "Date", width: "8%", align: "center", type: "date", sortable: true },
  { key: "status", label: "Status", width: "8%", align: "center", sortable: true, render: (_, row) => <DocumentStatusBadge status={row.status} /> },
  { key: "totalAmount", label: "Amount", width: "8%", align: "right", sortable: true },
];

const MPBCDC_COLUMNS = [
  { key: "receiptType", label: "Receipt Type", width: "9%", align: "left", sortable: true },
  { key: "receiptStatus", label: "Receipt Status", width: "9%", align: "left", sortable: true },
  { key: "inspectionStatus", label: "Inspection Status", width: "8%", align: "center", sortable: true },
  { key: "acceptedQty", label: "Accepted Qty", width: "7%", align: "right", sortable: true },
  { key: "rejectedQty", label: "Rejected Qty", width: "7%", align: "right", sortable: true },
  { key: "gemProcurement", label: "GeM", width: "5%", align: "center", sortable: true },
  { key: "tenderProcurement", label: "Tender", width: "5%", align: "center", sortable: true },
  { key: "action", label: "Action", width: "8%", align: "center" },
];

export default function GoodsReceiptListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useMemo(() => resolveGoodsReceiptPaths(location.pathname), [location.pathname]);
  const toast = useToast();
  const { setFooterContent } = useFooter();
  const { activeLocation } = useLocationScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = useMemo(() => [...BASE_COLUMNS, ...MPBCDC_COLUMNS], []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGoodsReceiptsRequest();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data.map(normalizeRow));
    } catch (err) {
      toast.error(err?.message || "Failed to load goods receipts");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load, activeLocation?._id]);

  useEffect(() => {
    setFooterContent(null);
    return () => setFooterContent(null);
  }, [setFooterContent]);

  async function handlePost(row) {
    try {
      await postGoodsReceiptRequest(row.id);
      toast.success("Posted successfully");
      load();
    } catch (err) {
      toast.error(err?.message || "Post failed");
    }
  }

  async function handleDelete(row) {
    try {
      await deleteGoodsReceiptRequest(row.id);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  }

  return (
    <div className="page">
      <div className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(paths.hubSegment))} ariaLabel="Back" />
        <img src={SeparatorIcon} alt="" className={toolbarStyles.sep} />
        <h1 className={toolbarStyles.title}>
          {paths.title}
          {activeLocation ? ` · ${activeLocation.name || activeLocation.locationId}` : ""}
        </h1>
      </div>

      <div className="page-content">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          showNewBtn
          onNew={() => navigate(appPath(paths.newPath))}
          actions={[
            {
              label: "View",
              onClick: (row) => navigate(appPath(paths.detailPath(row.id))),
            },
            {
              label: "Edit",
              onClick: (row) => row.status === "Draft" && navigate(appPath(paths.editPath(row.id))),
            },
            {
              label: "Post",
              onClick: (row) => row.status === "Draft" && handlePost(row),
            },
            {
              label: "Delete",
              onClick: (row) => row.status === "Draft" && handleDelete(row),
            },
          ]}
        />
      </div>
    </div>
  );
}
