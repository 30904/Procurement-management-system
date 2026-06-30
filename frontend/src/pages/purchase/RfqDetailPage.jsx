import { useCallback, useEffect, useMemo, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { RFQ_PATHS } from "../../config/rfqPaths.js";
import SeparatorIcon from "../../assets/seperator.svg?react";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import AuditInformationSection from "../../components/common/AuditInformationSection.jsx";
import DetailTimelinePlaceholder from "../../components/common/DetailTimelinePlaceholder.jsx";
import RfqDocumentsSection from "../../components/purchase/RfqDocumentsSection.jsx";
import {
  awardRfqRequest,
  cancelRfqRequest,
  closeRfqRequest,
  getRfqRequest,
  openRfqRequest,
  submitRfqRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { computeRfqTotalQty } from "../../utils/rfqFormState.js";
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

const INTENT_CONFIG = {
  submit: { title: "Submit RFQ", action: submitRfqRequest, success: "RFQ submitted.", label: "Submit RFQ" },
  open: { title: "Open RFQ", action: openRfqRequest, success: "RFQ opened for vendor quotations.", label: "Open RFQ" },
  close: { title: "Close RFQ", action: closeRfqRequest, success: "RFQ closed.", label: "Close RFQ" },
  award: { title: "Award RFQ", action: awardRfqRequest, success: "RFQ marked as awarded.", label: "Award RFQ" },
  cancel: {
    title: "Cancel RFQ",
    action: cancelRfqRequest,
    success: "RFQ cancelled.",
    label: "Cancel RFQ",
    variant: "danger",
  },
};

export default function RfqDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const intent = searchParams.get("intent") || "view";
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const intentCfg = INTENT_CONFIG[intent];
  const isAction = Boolean(intentCfg);

  const loadRfq = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getRfqRequest(id);
      setRfq(res?.data || null);
    } catch (err) {
      toast.error(err?.message || "Failed to load RFQ");
      setRfq(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadRfq();
  }, [loadRfq]);

  const lines = useMemo(
    () => (Array.isArray(rfq?.lines) ? rfq.lines.filter((l) => Number(l.qty) > 0) : []),
    [rfq?.lines]
  );
  const vendors = useMemo(() => (Array.isArray(rfq?.vendors) ? rfq.vendors : []), [rfq?.vendors]);
  const totalQty = rfq ? computeRfqTotalQty(lines) : 0;
  const displayStatus = rfq?.displayStatus || rfq?.status || "Draft";

  async function handleConfirmAction() {
    if (!rfq || submitting || !intentCfg) return;
    setSubmitting(true);
    try {
      await intentCfg.action(id);
      toast.success(intentCfg.success);
      navigate(appPath(RFQ_PATHS.listPath), { state: { refresh: true } });
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  const confirmMessage = useMemo(() => {
    if (!rfq || !intentCfg) return "";
    return `${intentCfg.label} ${rfq.rfqNo}? This RFQ has ${vendors.length} vendor(s) and ${lines.length} line(s).`;
  }, [rfq, intentCfg, vendors.length, lines.length]);

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={`${toolbarStyles.toolbar} ${styles.noPrint}`}>
        <ErpBackButton onClick={() => navigate(appPath(RFQ_PATHS.listPath))} ariaLabel="Back" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(RFQ_PATHS.hubPath))}>
            Purchase
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(RFQ_PATHS.listPath))}>
            {RFQ_PATHS.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{rfq?.rfqNo || "RFQ Detail"}</span>
        </h1>
      </header>

      {loading ? (
        <p className={styles.loading}>Loading RFQ…</p>
      ) : !rfq ? (
        <p className={styles.loading}>RFQ not found.</p>
      ) : (
        <>
          <div className={styles.content}>
            <section className={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <h2 className={styles.sectionTitle}>Header</h2>
                <DocumentStatusBadge status={displayStatus} />
              </div>
              <div className={styles.fieldGrid}>
                <Field label="RFQ No." value={rfq.rfqNo} />
                <Field label="RFQ Date" value={formatDate(rfq.rfqDate)} />
                <Field label="RFQ Type" value={rfq.rfqType} />
                <Field label="Department" value={rfq.department} />
                <Field label="Procurement Category" value={rfq.procurementCategory} />
                <Field label="Purchase Type" value={rfq.purchaseType} />
                <Field label="Currency" value={rfq.currency} />
                <Field label="Reference PR" value={rfq.referencePrNo} />
                <Field label="Reference Planning" value={rfq.referencePlanningRef} />
                <Field label="Required Delivery" value={formatDate(rfq.requiredDeliveryDate)} />
                <Field label="Closing Date" value={formatDate(rfq.closingDate)} />
                <Field label="Buyer" value={rfq.buyer} />
                <Field label="Total Qty" value={formatQty(totalQty)} />
                <Field label="Vendor Count" value={String(vendors.length)} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>
              <div className={styles.fieldGrid}>
                <Field label="Created By" value={rfq.createdByName || rfq.buyer} />
                <Field label="Status" value={displayStatus} />
                <Field label="Remarks" value={rfq.remarks || "—"} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Vendor Summary</h2>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Vendor</th>
                      <th>Preferred</th>
                      <th>MSME</th>
                      <th>GeM</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyCell}>
                          No vendors on this RFQ.
                        </td>
                      </tr>
                    ) : (
                      vendors.map((v, i) => (
                        <tr key={`${v.supplierCode}-${i}`}>
                          <td>{i + 1}</td>
                          <td>{v.supplierName || v.supplierCode}</td>
                          <td>{v.preferred ? "Yes" : "No"}</td>
                          <td>{v.msme || "—"}</td>
                          <td>{v.gemRegistered || "—"}</td>
                          <td>{v.contactPerson || "—"}</td>
                          <td>{v.email || "—"}</td>
                          <td>{v.mobile || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Items</h2>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>UoM</th>
                      <th className={styles.num}>Qty</th>
                      <th>Expected Delivery</th>
                      <th>Technical Spec</th>
                      <th>Drawing Ref</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={10} className={styles.emptyCell}>
                          No lines on this RFQ.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => (
                        <tr key={line.lineNo}>
                          <td>{line.lineNo}</td>
                          <td>{line.lineType || "Material"}</td>
                          <td>
                            {line.lineType === "Service" ? line.serviceCode : line.itemNo}
                          </td>
                          <td>
                            {line.lineType === "Service"
                              ? line.serviceName || line.description
                              : line.itemName || line.description}
                          </td>
                          <td>{line.uom}</td>
                          <td className={styles.num}>{formatQty(line.qty)}</td>
                          <td>{formatDate(line.expectedDelivery)}</td>
                          <td>{line.technicalSpecification || "—"}</td>
                          <td>{line.drawingReference || "—"}</td>
                          <td>{line.lineRemarks || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <RfqDocumentsSection rfqId={id} disabled={false} readOnly />

            {rfq.terms ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Terms</h2>
                <p className={styles.remarks}>{rfq.terms}</p>
              </section>
            ) : null}

            {rfq.remarks ? (
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Remarks</h2>
                <p className={styles.remarks}>{rfq.remarks}</p>
              </section>
            ) : null}

            <AuditInformationSection document={rfq} documentType="rfq" />
            <DetailTimelinePlaceholder />
          </div>

          <footer className={styles.footer}>
            {isAction ? (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(RFQ_PATHS.listPath))}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={intentCfg.variant === "danger" ? styles.btnCancel : styles.btnPrimary}
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                >
                  {intentCfg.label}
                </button>
              </>
            ) : (
              <>
                {rfq.status === "Draft" ? (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => navigate(appPath(RFQ_PATHS.editPath(id)))}
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(RFQ_PATHS.printPath(id)))}
                >
                  Print
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => navigate(appPath(RFQ_PATHS.listPath))}
                >
                  Back to List
                </button>
              </>
            )}
          </footer>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={intentCfg?.title || "Confirm"}
        message={confirmMessage}
        confirmLabel={intentCfg?.label || "Confirm"}
        cancelLabel="Back"
        variant={intentCfg?.variant === "danger" ? "danger" : "primary"}
        loading={submitting}
        onConfirm={handleConfirmAction}
        onCancel={() => (!submitting ? setConfirmOpen(false) : null)}
      />
    </div>
  );
}
