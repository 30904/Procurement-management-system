import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SpoDocumentPreview from "../../components/purchase/SpoDocumentPreview.jsx";
import PoCancelRemarksModal from "../../components/purchase/PoCancelRemarksModal.jsx";
import {
  cancelApprovedServicePurchaseOrderRequest,
  getServicePurchaseOrderRequest,
} from "../../services/api.js";
import { CANCEL_SPO_LIST_PATH } from "../../utils/servicePurchaseOrderFormState.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

export default function CancelSpoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [spo, setSpo] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadSpo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getServicePurchaseOrderRequest(id);
      const doc = res?.data;
      if (!doc || doc.status !== "Approved") {
        toast.error("Only approved service purchase orders are shown here.");
        navigate(appPath(CANCEL_SPO_LIST_PATH), { replace: true });
        return;
      }
      if (String(doc.receiptStatus || "") !== "Not Started") {
        toast.error("This SPO cannot be cancelled (service receipt has started).");
        navigate(appPath(CANCEL_SPO_LIST_PATH), { replace: true });
        return;
      }
      if (doc.amendStatus === "Pending") {
        toast.error("Resolve the pending amendment before cancelling this SPO.");
        navigate(appPath(CANCEL_SPO_LIST_PATH), { replace: true });
        return;
      }
      setSpo(doc);
    } catch (err) {
      toast.error(err?.message || "Failed to load SPO");
      navigate(appPath(CANCEL_SPO_LIST_PATH), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadSpo();
  }, [loadSpo]);

  async function handleCancelConfirm(cancelRemarks) {
    if (!id || cancelling) return;
    setCancelling(true);
    try {
      await cancelApprovedServicePurchaseOrderRequest(id, { cancelRemarks });
      toast.success(`Service purchase order ${spo?.spoNo} cancelled.`);
      navigate(appPath(CANCEL_SPO_LIST_PATH), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to cancel SPO");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(CANCEL_SPO_LIST_PATH))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(CANCEL_SPO_LIST_PATH))}>
            Cancel SPO
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{spo?.spoNo || "View"}</span>
        </h1>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading service purchase order…</p>
      ) : !spo ? null : (
        <>
          <div
            className={styles.noPrint}
            style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0 0 1rem" }}
          >
            <button type="button" className="erp-btn erp-btn--danger" onClick={() => setCancelOpen(true)}>
              <XCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Cancel SPO
            </button>
          </div>
          <SpoDocumentPreview spo={spo} />
        </>
      )}

      <PoCancelRemarksModal
        open={cancelOpen}
        poNo={spo?.spoNo}
        submitting={cancelling}
        title="Cancel Service Purchase Order"
        confirmLabel="Cancel SPO"
        notStartedNote="Service receipt has not started on this SPO."
        onClose={() => !cancelling && setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
