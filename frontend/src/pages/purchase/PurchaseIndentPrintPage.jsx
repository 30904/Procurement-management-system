import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { PURCHASE_INDENT_PATHS } from "../../config/purchaseIndentPaths.js";
import { PURCHASE_INDENT_DOCUMENT_TYPES } from "../../config/purchaseIndentMpbcdcOptions.js";
import DocumentOrganizationLogo from "../../components/print/DocumentOrganizationLogo.jsx";
import ProcurementPrintFooter from "../../components/print/ProcurementPrintFooter.jsx";
import {
  getCurrentCompanyRequest,
  getPurchaseIndentRequest,
  listFilesRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import {
  buildIndentAttachmentPrintRows,
  buildIndentMpbcdcPrintRows,
} from "../../utils/indentPrintHelpers.js";
import { formatPrintDate } from "../../utils/poPrintHelpers.js";
import styles from "./PurchaseOrderPrintPage.module.css";

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function PurchaseIndentPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [indent, setIndent] = useState(null);
  const [company, setCompany] = useState(null);
  const [files, setFiles] = useState([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [indentRes, companyRes, filesRes] = await Promise.all([
        getPurchaseIndentRequest(id),
        getCurrentCompanyRequest().catch(() => null),
        listFilesRequest({ entityType: "purchase_indent", entityId: id, limit: 200 }).catch(
          () => ({ data: [] })
        ),
      ]);
      const doc = indentRes?.data;
      if (!doc) {
        toast.error("Purchase requisition not found");
        navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { replace: true });
        return;
      }
      setIndent(doc);
      setCompany(companyRes?.data || null);
      setFiles(Array.isArray(filesRes?.data) ? filesRes.data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase requisition");
      navigate(appPath(PURCHASE_INDENT_PATHS.listPath), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    document.body.classList.add("po-print-active");
    return () => document.body.classList.remove("po-print-active");
  }, []);

  const mpbcdcRows = useMemo(() => buildIndentMpbcdcPrintRows(indent), [indent]);
  const attachmentRows = useMemo(
    () => buildIndentAttachmentPrintRows(files, PURCHASE_INDENT_DOCUMENT_TYPES),
    [files]
  );
  const lines = useMemo(
    () => (Array.isArray(indent?.lines) ? indent.lines.filter((l) => Number(l.qty) > 0) : []),
    [indent?.lines]
  );

  if (loading) {
    return (
      <div className={styles.pageShell}>
        <p className={styles.loading}>Preparing purchase requisition preview…</p>
      </div>
    );
  }

  if (!indent) return null;

  const showWatermark = String(indent.status || "").toLowerCase() === "draft";
  const companyName = company?.companyName || "Organisation";

  return (
    <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
      <div className={styles.toolbarStandalone}>
        <button type="button" onClick={() => navigate(appPath(PURCHASE_INDENT_PATHS.detailPath(id)))}>
          Back
        </button>
        <button type="button" className={styles.btnPrintPrimary} onClick={() => window.print()}>
          <Printer size={18} aria-hidden />
          Print
        </button>
      </div>

      <div className={styles.printArea} id="pr-print-document">
        <article className={styles.sheet}>
          {showWatermark ? (
            <div className={styles.watermark} aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className={styles.watermarkText}>
                  DRAFT
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.sheetInner}>
            <header className={styles.docHead}>
              <div className={styles.docBrand}>
                <DocumentOrganizationLogo company={company} className={styles.logoImg} />
                <div>
                  <h1 className={styles.docOrgName}>{companyName}</h1>
                  <p className={styles.docOrgMeta}>
                    {company?.udyamRegistrationNo ? `Udyam: ${company.udyamRegistrationNo}` : null}
                    {company?.cin ? ` · CIN: ${company.cin}` : null}
                  </p>
                </div>
              </div>
              <div className={styles.docTitleWrap}>
                <div className={styles.docTitle}>Purchase Requisition</div>
                <div className={styles.docSubtitle}>{applicationName || "Procurement Management System"}</div>
              </div>
            </header>

            <div className={styles.row2}>
              <div className={styles.block}>
                <div className={styles.blockTitle}>Requisition Details</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      <tr>
                        <td>Requisition No.</td>
                        <td>{indent.indentNo}</td>
                      </tr>
                      <tr>
                        <td>Date</td>
                        <td>{formatPrintDate(indent.indentDate)}</td>
                      </tr>
                      <tr>
                        <td>Department</td>
                        <td>{indent.department || "—"}</td>
                      </tr>
                      <tr>
                        <td>Requested By</td>
                        <td>{indent.requestedBy || "—"}</td>
                      </tr>
                      <tr>
                        <td>Priority</td>
                        <td>{indent.priority || "—"}</td>
                      </tr>
                      <tr>
                        <td>Required By</td>
                        <td>{formatPrintDate(indent.requiredByDate)}</td>
                      </tr>
                      <tr>
                        <td>Status</td>
                        <td>{indent.status || "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {mpbcdcRows.length ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>MPBCDC / Government Procurement Information</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      {mpbcdcRows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <table className={styles.linesTable} style={{ marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Material Code</th>
                  <th>Material Name</th>
                  <th>UoM</th>
                  <th>Qty</th>
                  <th>Required Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {lines.length ? (
                  lines.map((line) => (
                    <tr key={line.lineNo}>
                      <td>{line.lineNo}</td>
                      <td>{line.itemNo}</td>
                      <td>{line.itemName}</td>
                      <td>{line.uom}</td>
                      <td className={styles.num}>{formatQty(line.qty)}</td>
                      <td>{formatPrintDate(line.requiredDate)}</td>
                      <td>{line.lineRemarks || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>No line items</td>
                  </tr>
                )}
              </tbody>
            </table>

            {attachmentRows.length ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>Attachments Summary</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      {attachmentRows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {indent.remarks ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>Remarks</div>
                <div className={styles.blockBody}>{indent.remarks}</div>
              </div>
            ) : null}

            <ProcurementPrintFooter
              companyName={companyName}
              note="This is a system-generated purchase requisition document."
            />
          </div>
        </article>
      </div>
    </div>
  );
}
