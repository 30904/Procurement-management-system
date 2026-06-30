import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { PURCHASE_INDENT_PATHS } from "../../config/purchaseIndentPaths.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import {
  approvePurchaseIndentRequest,
  cancelPurchaseIndentRequest,
  getPurchaseIndentRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { computeIndentTotalQty } from "../../utils/purchaseIndentFormState.js";
import PurchaseIndentMpbcdcDetailView from "../../components/purchase/PurchaseIndentMpbcdcDetailView.jsx";
import PurchaseIndentDocumentsSection from "../../components/purchase/PurchaseIndentDocumentsSection.jsx";
import AuditInformationSection from "../../components/common/AuditInformationSection.jsx";
import DetailTimelinePlaceholder from "../../components/common/DetailTimelinePlaceholder.jsx";
import styles from "./PurchaseOrderDetailPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
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
  view: "View Purchase Requisition",
  approve: "Approve Purchase Requisition",
  cancel: "Cancel Purchase Requisition",
};

export default function PurchaseIndentDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent") || "view";
  const fromApproved = searchParams.get("from") === "approved";
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [indent, setIndent] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isApprove = intent === "approve";
  const isCancel = intent === "cancel";
  const pageTitle = INTENT_TITLES[intent] || INTENT_TITLES.view;

  const loadIndent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getPurchaseIndentRequest(id);
      const doc = res?.data;
      if (!doc) {
        setIndent(null);
        return;
      }
      if (doc.status !== "Draft" && intent !== "view") {
        toast.error("Only draft purchase indents can be approved or cancelled from summary.");
        navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { replace: true });
        return;
      }
      setIndent(doc);
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase indent");
      setIndent(null);
    } finally {
      setLoading(false);
    }
  }, [id, intent, navigate, toast]);

  useEffect(() => {
    loadIndent();
  }, [loadIndent]);

  const lines = useMemo(
    () => (Array.isArray(indent?.lines) ? indent.lines.filter((l) => Number(l.qty) > 0) : []),
    [indent?.lines]
  );

  const totalQty = indent ? computeIndentTotalQty(lines) : 0;

  async function handleConfirmAction() {
    if (!indent || submitting) return;
    setSubmitting(true);
    try {
      if (isApprove) {
        await approvePurchaseIndentRequest(id);
        toast.success(
          `${indent.indentNo} approved. It moves to Procurement Planning and Approved Requisitions.`
        );
        navigate(appPath(PURCHASE_INDENT_PATHS.approvedListPath), { state: { refresh: true } });
        return;
      } else if (isCancel) {
        await cancelPurchaseIndentRequest(id);
        toast.success(`Purchase indent ${indent.indentNo} cancelled.`);
      }
      navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  const confirmDialogMessage = useMemo(() => {
    if (!indent) return "";
    if (isApprove) {
      return `Approve ${indent.indentNo} for ${indent.department}? Total quantity: ${formatQty(totalQty)}. After approval it appears under Approved Requisitions and feeds Procurement Planning until a PO is raised.`;
    }
    if (isCancel) {
      return `Cancel purchase indent ${indent.indentNo}? It will be removed from the summary list.`;
    }
    return "";
  }, [indent, isApprove, isCancel, totalQty]);

  const listPath = fromApproved
    ? PURCHASE_INDENT_PATHS.approvedListPath
    : PURCHASE_INDENT_PATHS.listPath;
  const listLabel = fromApproved ? PURCHASE_INDENT_PATHS.approvedTitle : PURCHASE_INDENT_PATHS.title;
  const linkedPos = Array.isArray(indent?.linkedPurchaseOrders) ? indent.linkedPurchaseOrders : [];
  const isApprovedView = indent?.status === "Approved";

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={`${toolbarStyles.toolbar} ${styles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(appPath(listPath))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.hubPath))}
          >
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(listPath))}>
            {listLabel}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{indent?.indentNo || pageTitle}</span>
        </h1>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading purchase indent…</p>
      ) : !indent ? (
        <p className={styles.loading}>Purchase indent not found.</p>
      ) : (
        <>
          <div className={styles.content}>
            {isApprove ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Approval review</h2>
                <p className={styles.remarks} style={{ marginBottom: "1vh" }}>
                  Confirm header details and line quantities before approving this indent.
                </p>
                <ul className={styles.remarks} style={{ margin: "0 0 1.2vh 1rem" }}>
                  <li>{lines.length} line(s) with quantity</li>
                  <li>Total quantity: {formatQty(totalQty)}</li>
                  <li>Priority: {indent.priority}</li>
                  <li>Requested by: {indent.requestedBy}</li>
                </ul>
              </section>
            ) : null}

            {isApprovedView && !isApprove ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>What happens next</h2>
                <p className={styles.remarks} style={{ marginBottom: "0.8vh" }}>
                  <strong>Procurement status:</strong> {indent.procurementStatus || "Awaiting PO"}
                </p>
                <p className={styles.remarks} style={{ margin: 0 }}>
                  {indent.procurementHint ||
                    "Line quantities are included in Procurement Planning. Raise a purchase order from planning or link a PO to this requisition when created."}
                </p>
              </section>
            ) : null}

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Header</h2>
              <div className={styles.fieldGrid}>
                <Field label="Indent No." value={indent.indentNo} />
                <Field label="Indent Date" value={formatDate(indent.indentDate)} />
                <Field label="Department" value={indent.department} />
                <Field label="Requested By" value={indent.requestedBy} />
                <Field label="Priority" value={indent.priority} />
                <Field label="Required By" value={formatDate(indent.requiredByDate)} />
                <Field label="Status" value={indent.status} />
                <Field label="Total Qty" value={formatQty(totalQty)} />
              </div>
            </section>

            <PurchaseIndentMpbcdcDetailView indent={indent} />

            <PurchaseIndentDocumentsSection
              indentId={id}
              disabled={false}
              readOnly={indent.status !== "Draft"}
            />

            <AuditInformationSection document={indent} documentType="indent" />
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
                      <th>Description</th>
                      <th>UoM</th>
                      <th className={styles.num}>Qty</th>
                      <th>Required Date</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyCell}>
                          No lines on this indent.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => (
                        <tr key={line.lineNo}>
                          <td>{line.lineNo}</td>
                          <td>{line.itemNo}</td>
                          <td>{line.itemName}</td>
                          <td>{line.description || "—"}</td>
                          <td>{line.uom}</td>
                          <td className={styles.num}>{formatQty(line.qty)}</td>
                          <td>{formatDate(line.requiredDate)}</td>
                          <td>{line.lineRemarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {isApprovedView && linkedPos.length > 0 ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Linked purchase orders</h2>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>PO No.</th>
                        <th>PO Date</th>
                        <th>Status</th>
                        <th>Linked on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedPos.map((po) => (
                        <tr key={String(po.poId)}>
                          <td>
                            <button
                              type="button"
                              className="erp-link-btn"
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "var(--brand-primary)",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={() =>
                                navigate(appPath(`purchase/purchase-order/generate-po/${po.poId}`))
                              }
                            >
                              {po.poNo || "—"}
                            </button>
                          </td>
                          <td>{formatDate(po.poDate)}</td>
                          <td>{po.poStatus || "—"}</td>
                          <td>{formatDate(po.linkedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {indent.remarks ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Remarks</h2>
                <p className={styles.remarks}>{indent.remarks}</p>
              </section>
            ) : null}
          </div>

          <footer className={styles.footer}>
            {isCancel ? (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(listPath))}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting || indent.status !== "Draft"}
                >
                  Cancel Indent
                </button>
              </>
            ) : isApprove ? (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(listPath))}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting || indent.status !== "Draft"}
                >
                  Approve Indent
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.printPath(id)))}
                >
                  Print
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(listPath))}
                >
                  Back to {fromApproved ? "Approved Requisitions" : "Summary"}
                </button>
              </>
            )}
          </footer>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={isApprove ? "Approve Purchase Requisition" : "Cancel Purchase Requisition"}
        message={confirmDialogMessage}
        confirmLabel={isApprove ? "Approve" : "Cancel Indent"}
        cancelLabel="Back"
        variant={isCancel ? "danger" : "primary"}
        loading={submitting}
        onConfirm={handleConfirmAction}
        onCancel={() => (!submitting ? setConfirmOpen(false) : null)}
      />
    </div>
  );
}
