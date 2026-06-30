import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, History, Pencil } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import SpoDocumentPreview from "../../components/purchase/SpoDocumentPreview.jsx";
import SpoAmendmentHistoryModal from "../../components/purchase/SpoAmendmentHistoryModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  approveServicePurchaseOrderAmendmentRequest,
  getServicePurchaseOrderRequest,
} from "../../services/api.js";
import { AMEND_SPO_LIST_PATH } from "../../utils/servicePurchaseOrderFormState.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

export default function AmendSpoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [spo, setSpo] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadSpo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getServicePurchaseOrderRequest(id);
      const doc = res?.data;
      if (!doc || doc.status !== "Approved") {
        toast.error("Only approved service purchase orders are shown here.");
        navigate(appPath(AMEND_SPO_LIST_PATH), { replace: true });
        return;
      }
      if (String(doc.receiptStatus || "") !== "Not Started") {
        toast.error("This SPO is no longer amendable (service receipt started).");
        navigate(appPath(AMEND_SPO_LIST_PATH), { replace: true });
        return;
      }
      setSpo(doc);
    } catch (err) {
      toast.error(err?.message || "Failed to load SPO");
      navigate(appPath(AMEND_SPO_LIST_PATH), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadSpo();
  }, [loadSpo]);

  async function handleApprove() {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await approveServicePurchaseOrderAmendmentRequest(id);
      toast.success(`Amendment approved for ${spo?.spoNo}.`);
      navigate(appPath(AMEND_SPO_LIST_PATH), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to approve amendment");
    } finally {
      setSubmitting(false);
      setApproveOpen(false);
    }
  }

  const pending = spo?.amendStatus === "Pending";
  const displaySpo =
    pending && spo?.pendingAmendment
      ? { ...spo, ...spo.pendingAmendment, spoNo: spo.spoNo, status: spo.status, serviceProviderName: spo.serviceProviderName }
      : spo;

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(AMEND_SPO_LIST_PATH))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(AMEND_SPO_LIST_PATH))}>
            Amend SPO
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
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              margin: "0 0 1rem",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#64748b", marginRight: "0.5rem" }}>
              Revision: <strong>{Number(spo.amendRevNo) || 0}</strong>
              {pending ? (
                <span style={{ marginLeft: "0.5rem", color: "#ea580c", fontWeight: 600 }}>
                  · Amendment pending
                </span>
              ) : null}
            </span>
            <button type="button" className="erp-btn erp-btn--secondary" onClick={() => setHistoryOpen(true)}>
              <History size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Amnd. History
            </button>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => navigate(appPath(`${AMEND_SPO_LIST_PATH}/${id}/edit`))}
            >
              <Pencil size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {pending ? "Edit Amendment" : "Amend SPO"}
            </button>
            {pending ? (
              <button type="button" className="erp-btn erp-btn--primary" onClick={() => setApproveOpen(true)}>
                <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Approve Amendment
              </button>
            ) : null}
          </div>
          <SpoDocumentPreview spo={displaySpo} />
        </>
      )}

      <SpoAmendmentHistoryModal
        open={historyOpen}
        spoId={id}
        spoNo={spo?.spoNo}
        onClose={() => setHistoryOpen(false)}
      />

      <ConfirmDialog
        open={approveOpen}
        title="Approve amended SPO"
        message={`Approve amendment for ${spo?.spoNo}?`}
        confirmLabel={submitting ? "Approving…" : "Approve"}
        onConfirm={handleApprove}
        onCancel={() => !submitting && setApproveOpen(false)}
      />
    </div>
  );
}
