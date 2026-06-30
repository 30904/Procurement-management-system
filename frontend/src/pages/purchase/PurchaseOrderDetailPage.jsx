import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import PoDocumentPreview from "../../components/purchase/PoDocumentPreview.jsx";
import PoApprovalReview from "../../components/purchase/PoApprovalReview.jsx";
import PurchaseOrderMpbcdcDetailView from "../../components/purchase/PurchaseOrderMpbcdcDetailView.jsx";
import PurchaseOrderDocumentsSection from "../../components/purchase/PurchaseOrderDocumentsSection.jsx";
import AuditInformationSection from "../../components/common/AuditInformationSection.jsx";
import DetailTimelinePlaceholder from "../../components/common/DetailTimelinePlaceholder.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import { openAuthenticatedAppTab } from "../../utils/authStorage.js";
import { PO_CHANNEL } from "../../config/purchaseOrderWorkspace.js";
import { computeImportLandedCost, landedCostFromPoTerms } from "../../utils/importLandedCost.js";
import {
  approvePurchaseOrderRequest,
  cancelPurchaseOrderRequest,
  getPurchaseOrderRequest,
} from "../../services/api.js";
import { getPurchaseOrderWorkspace } from "../../config/purchaseOrderWorkspace.js";
import { useToast } from "../../hooks/useToast.js";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value ?? "—"}</span>
    </div>
  );
}

const INTENT_TITLES = {
  view: "View Purchase Order",
  approve: "Approve Purchase Order",
  cancel: "Cancel Purchase Order",
  preview: "Preview Purchase Order",
};

function buildApproveConfirmMessage(po, poChannel) {
  if (!po) return "";
  const cur = po.currency || "INR";
  const activeLines = (po.lines || []).filter((l) => Number(l.qty) > 0);
  const isImp = poChannel === PO_CHANNEL.IMPORT;
  const total = isImp
    ? computeImportLandedCost({
        lines: activeLines,
        landedCost: landedCostFromPoTerms(po.poTerms),
        currency: cur,
        incidentalTotal: (po.incidentalExpenses || []).reduce((s, r) => s + (Number(r.amount) || 0), 0),
      }).totalLandedCostInr
    : Number(po.poValue?.totalPoValue ?? po.totalAmount ?? 0);
  const totalLabel = isImp
    ? `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })} landed`
    : `${cur} ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  return `Approve ${po.poNo} for ${po.supplierName}? Total: ${totalLabel}. This PO will move to the approved register.`;
}

export default function PurchaseOrderDetailPage({ workspace = "generate-po" }) {
  const ws = getPurchaseOrderWorkspace(workspace);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent") || "view";
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPreview = intent === "preview";
  const isApprove = intent === "approve";
  const isCancel = intent === "cancel";

  const pageTitle = INTENT_TITLES[intent] || INTENT_TITLES.view;

  const loadPo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getPurchaseOrderRequest(id);
      const doc = res?.data;
      if (!doc) {
        setPo(null);
        return;
      }
      if (doc.status !== "Draft" && intent !== "view") {
        toast.error("Only draft purchase orders can be approved, cancelled, or previewed from summary.");
        navigate(appPath(ws.listPath), { replace: true });
        return;
      }
      setPo(doc);
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase order");
      setPo(null);
    } finally {
      setLoading(false);
    }
  }, [id, intent, navigate, toast, ws.listPath]);

  useEffect(() => {
    loadPo();
  }, [loadPo]);

  const poChannel = po?.poTerms?.poChannel || ws.poChannel || "";
  const printPath = id ? appPath(ws.printPath(id)) : "";

  const poValue = po?.poValue || {};
  const poTerms = po?.poTerms || {};
  const lines = useMemo(
    () => (Array.isArray(po?.lines) ? po.lines.filter((l) => Number(l.qty) > 0) : []),
    [po?.lines]
  );

  async function handleConfirmAction() {
    if (!po || submitting) return;
    setSubmitting(true);
    try {
      if (isApprove) {
        await approvePurchaseOrderRequest(id);
        toast.success(`Purchase order ${po.poNo} approved.`);
      } else if (isCancel) {
        await cancelPurchaseOrderRequest(id);
        toast.success(`Purchase order ${po.poNo} cancelled.`);
      }
      navigate(appPath(ws.listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const confirmDialogMessage = useMemo(() => {
    if (!po) return "";
    if (isApprove) return buildApproveConfirmMessage(po, poChannel);
    if (isCancel) return `Cancel purchase order ${po.poNo}? It will be removed from the summary list.`;
    return "";
  }, [po, isApprove, isCancel, poChannel]);

  return (
    <div className={`erp-page ${toolbarStyles.page} ${isPreview ? styles.printRoot : ""}`}>
      <header className={`${toolbarStyles.toolbar} ${styles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(appPath(ws.listPath))} ariaLabel="Back to summary" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath("purchase"))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath(ws.listPath))}
          >
            {ws.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{po?.poNo || pageTitle}</span>
        </h1>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading purchase order…</p>
      ) : !po ? (
        <p className={styles.loading}>Purchase order not found.</p>
      ) : (
        <>
          <div className={isApprove ? undefined : styles.content}>
            {isApprove ? (
              <PoApprovalReview
                po={po}
                channel={poChannel}
                printPath={printPath}
                submitting={submitting}
                onBack={() => navigate(appPath(ws.listPath))}
                onApprove={() => setConfirmOpen(true)}
                onOpenPrint={(path) => openAuthenticatedAppTab(path)}
              />
            ) : isPreview ? (
              <PoDocumentPreview po={po} />
            ) : (
              <>
                <section className={styles.card}>
                  <h2 className={styles.sectionTitle}>Header</h2>
                  <div className={styles.fieldGrid}>
                    <Field label="PO No." value={po.poNo} />
                    <Field label="PO Date" value={formatDate(po.poDate)} />
                    <Field label="Vendor" value={po.supplierName} />
                    <Field label="PO Type" value={po.poType} />
                    <Field label="Currency" value={po.currency || "INR"} />
                    <Field label="PO Status" value={po.status} />
                    <Field label="Goods Receipt Status" value={po.grnStatus} />
                    <Field label="Order Reference" value={po.orderReferenceNo || "—"} />
                    <Field label="Ship-To" value={poTerms.shipToLocation} />
                    <Field label="Payment Terms" value={poTerms.paymentTerms} />
                    <Field label="Mode of Transport" value={poTerms.modeOfTransport} />
                    <Field label="Freight Terms" value={poTerms.freightTerms} />
                  </div>
                </section>

                <PurchaseOrderMpbcdcDetailView po={po} />

                <PurchaseOrderDocumentsSection poId={id} readOnly />

                <AuditInformationSection document={po} documentType="po" />
                <DetailTimelinePlaceholder />

                <section className={styles.card}>
                  <h2 className={styles.sectionTitle}>Line Items</h2>
                  <div className={styles.tableScroll}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Material Code</th>
                          <th>Material Name</th>
                          <th>UoM</th>
                          <th className={styles.num}>Qty</th>
                          <th className={styles.num}>Rate</th>
                          <th className={styles.num}>Amount</th>
                          <th>HSN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.length === 0 ? (
                          <tr>
                            <td colSpan={8} className={styles.emptyCell}>
                              No lines on this purchase order.
                            </td>
                          </tr>
                        ) : (
                          lines.map((line) => (
                            <tr key={line.lineNo}>
                              <td>{line.lineNo}</td>
                              <td>{line.itemNo}</td>
                              <td>{line.itemName}</td>
                              <td>{line.uom}</td>
                              <td className={styles.num}>{line.qty}</td>
                              <td className={styles.num}>{formatMoney(line.rate)}</td>
                              <td className={styles.num}>{formatMoney(line.amount)}</td>
                              <td>{line.hsnCode || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {poTerms?.poRemarks ? (
                  <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Remarks</h2>
                    <p className={styles.remarks}>{poTerms.poRemarks}</p>
                  </section>
                ) : null}
              </>
            )}
          </div>

          {!isApprove ? (
          <footer className={`${styles.footer} ${styles.noPrint}`}>
            {isPreview ? (
              <>
                <button type="button" className={styles.btnSecondary} onClick={() => navigate(-1)}>
                  Back
                </button>
                <button type="button" className={styles.btnPrimary} onClick={handlePrint}>
                  Print
                </button>
              </>
            ) : isCancel ? (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(ws.listPath))}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting || po.status !== "Draft"}
                >
                  Cancel PO
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => navigate(appPath(ws.listPath))}
              >
                Back to Summary
              </button>
            )}
          </footer>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={isApprove ? "Approve Purchase Order" : "Cancel Purchase Order"}
        message={confirmDialogMessage}
        confirmLabel={isApprove ? "Approve" : "Cancel PO"}
        cancelLabel="Back"
        variant={isCancel ? "danger" : "primary"}
        loading={submitting}
        onConfirm={handleConfirmAction}
        onCancel={() => (!submitting ? setConfirmOpen(false) : null)}
      />
    </div>
  );
}
