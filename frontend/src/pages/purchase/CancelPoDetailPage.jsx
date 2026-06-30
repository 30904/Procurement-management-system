import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Printer, XCircle } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import PoDocumentPreview from "../../components/purchase/PoDocumentPreview.jsx";
import PoCancelRemarksModal from "../../components/purchase/PoCancelRemarksModal.jsx";
import {
  cancelApprovedPurchaseOrderRequest,
  getPurchaseOrderRequest,
} from "../../services/api.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "purchase/purchase-order/cancel-po";

export default function CancelPoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadPo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getPurchaseOrderRequest(id);
      const doc = res?.data;
      if (!doc || doc.status !== "Approved") {
        toast.error("Only approved purchase orders are shown here.");
        navigate(appPath(LIST_PATH), { replace: true });
        return;
      }
      if (String(doc.grnStatus || "") !== "Not Started") {
        toast.error("This PO cannot be cancelled (GRN has started).");
        navigate(appPath(LIST_PATH), { replace: true });
        return;
      }
      if (doc.amendStatus === "Pending") {
        toast.error("Resolve the pending amendment before cancelling this PO.");
        navigate(appPath(LIST_PATH), { replace: true });
        return;
      }
      setPo(doc);
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase order");
      navigate(appPath(LIST_PATH), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadPo();
  }, [loadPo]);

  async function handleCancelConfirm(cancelRemarks) {
    if (!id || cancelling) return;
    setCancelling(true);
    try {
      await cancelApprovedPurchaseOrderRequest(id, { cancelRemarks });
      toast.success(`Purchase order ${po?.poNo} cancelled.`);
      navigate(appPath(LIST_PATH), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to cancel purchase order");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(LIST_PATH))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(LIST_PATH))}>
            Cancel PO
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{po?.poNo || "View"}</span>
        </h1>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading purchase order…</p>
      ) : !po ? null : (
        <>
          <div
            className={styles.noPrint}
            style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0 0 1rem" }}
          >
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() =>
                openAuthenticatedAppTab(
                  appPath(`purchase/purchase-order/generate-po/${id}/print`)
                )
              }
            >
              <Printer size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              PO Preview
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--primary"
              style={{ background: "#dc2626", borderColor: "#dc2626" }}
              onClick={() => setCancelOpen(true)}
            >
              <XCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Cancel PO
            </button>
          </div>
          <PoDocumentPreview po={po} />
        </>
      )}

      <PoCancelRemarksModal
        open={cancelOpen}
        poNo={po?.poNo}
        submitting={cancelling}
        onClose={() => !cancelling && setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
