import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, History, Pencil, Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import PoDocumentPreview from "../../components/purchase/PoDocumentPreview.jsx";
import PoAmendmentHistoryModal from "../../components/purchase/PoAmendmentHistoryModal.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  approvePurchaseOrderAmendmentRequest,
  getPurchaseOrderRequest,
} from "../../services/api.js";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "purchase/purchase-order/amend-po";

export default function AmendPoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        toast.error("This PO is no longer amendable (GRN started).");
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

  async function handleApprove() {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
      await approvePurchaseOrderAmendmentRequest(id);
      toast.success(`Amendment approved for ${po?.poNo}.`);
      navigate(appPath(LIST_PATH), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Failed to approve amendment");
    } finally {
      setSubmitting(false);
      setApproveOpen(false);
    }
  }

  const pending = po?.amendStatus === "Pending";

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
            Amend PO
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
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              margin: "0 0 1rem",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#64748b", marginRight: "0.5rem" }}>
              Revision: <strong>{Number(po.amendRevNo) || 0}</strong>
              {pending ? (
                <span style={{ marginLeft: "0.5rem", color: "#ea580c", fontWeight: 600 }}>
                  · Amendment pending
                </span>
              ) : null}
            </span>
            <button
              type="button"
              className="erp-btn erp-btn--secondary"
              onClick={() => setHistoryOpen(true)}
            >
              <History size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Amnd. History
            </button>
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
              className="erp-btn erp-btn--secondary"
              onClick={() => navigate(appPath(`${LIST_PATH}/${id}/edit`))}
            >
              <Pencil size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
              {pending ? "Edit Amendment" : "Amend PO"}
            </button>
            {pending ? (
              <button
                type="button"
                className="erp-btn erp-btn--primary"
                onClick={() => setApproveOpen(true)}
              >
                <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Approve Amendment
              </button>
            ) : null}
          </div>
          <PoDocumentPreview po={po} />
        </>
      )}

      <PoAmendmentHistoryModal
        open={historyOpen}
        poId={id}
        poNo={po?.poNo}
        onClose={() => setHistoryOpen(false)}
      />

      <ConfirmDialog
        open={approveOpen}
        title="Approve amended PO"
        message={`Approve amendment for ${po?.poNo}?`}
        confirmLabel={submitting ? "Approving…" : "Approve"}
        onConfirm={handleApprove}
        onCancel={() => !submitting && setApproveOpen(false)}
      />
    </div>
  );
}
