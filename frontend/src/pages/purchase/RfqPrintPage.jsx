import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { RFQ_PATHS } from "../../config/rfqPaths.js";
import { RFQ_DOCUMENT_TYPES } from "../../config/rfqOptions.js";
import DocumentOrganizationLogo from "../../components/print/DocumentOrganizationLogo.jsx";
import ProcurementPrintFooter from "../../components/print/ProcurementPrintFooter.jsx";
import {
  getCurrentCompanyRequest,
  getRfqRequest,
  listFilesRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import {
  buildRfqHeaderPrintRows,
  buildRfqLinePrintRows,
  buildRfqVendorPrintRows,
} from "../../utils/rfqPrintHelpers.js";
import { formatPrintDate } from "../../utils/poPrintHelpers.js";
import styles from "./PurchaseOrderPrintPage.module.css";

function formatQty(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function RfqPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rfq, setRfq] = useState(null);
  const [company, setCompany] = useState(null);
  const [files, setFiles] = useState([]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [rfqRes, companyRes, filesRes] = await Promise.all([
        getRfqRequest(id),
        getCurrentCompanyRequest().catch(() => null),
        listFilesRequest({ entityType: "purchase_rfq", entityId: id, limit: 200 }).catch(() => ({
          data: [],
        })),
      ]);
      const doc = rfqRes?.data;
      if (!doc) {
        toast.error("RFQ not found");
        navigate(appPath(RFQ_PATHS.listPath), { replace: true });
        return;
      }
      setRfq(doc);
      setCompany(companyRes?.data || null);
      setFiles(Array.isArray(filesRes?.data) ? filesRes.data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load RFQ");
      navigate(appPath(RFQ_PATHS.listPath), { replace: true });
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

  const headerRows = useMemo(() => buildRfqHeaderPrintRows(rfq), [rfq]);
  const vendorRows = useMemo(() => buildRfqVendorPrintRows(rfq?.vendors || []), [rfq?.vendors]);
  const lineRows = useMemo(
    () => buildRfqLinePrintRows((rfq?.lines || []).filter((l) => Number(l.qty) > 0)),
    [rfq?.lines]
  );

  const attachmentSummary = useMemo(() => {
    const map = {};
    files.forEach((f) => {
      const code = f.documentTypeCode || "other";
      const label = RFQ_DOCUMENT_TYPES.find((d) => d.code === code)?.label || code;
      if (!map[label]) map[label] = 0;
      map[label] += 1;
    });
    return Object.entries(map).map(([label, count]) => [label, `${count} file(s)`]);
  }, [files]);

  if (loading) {
    return (
      <div className={styles.pageShell}>
        <p className={styles.loading}>Preparing RFQ preview…</p>
      </div>
    );
  }

  if (!rfq) return null;

  const showWatermark = String(rfq.status || "").toLowerCase() === "draft";
  const companyName = company?.companyName || "Organisation";

  return (
    <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
      <div className={styles.toolbarStandalone}>
        <button type="button" onClick={() => navigate(appPath(RFQ_PATHS.detailPath(id)))}>
          Back
        </button>
        <button type="button" className={styles.btnPrintPrimary} onClick={() => window.print()}>
          <Printer size={18} aria-hidden />
          Print
        </button>
      </div>

      <div className={styles.printArea} id="rfq-print-document">
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
                <div className={styles.docTitle}>Request for Quotation</div>
                <div className={styles.docSubtitle}>Procurement Management System</div>
              </div>
            </header>

            <div className={styles.row2}>
              <div className={styles.block}>
                <div className={styles.blockTitle}>RFQ Information</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      {headerRows.map(([label, value]) => (
                        <tr key={label}>
                          <td>{label}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.block} style={{ marginTop: "0.5rem" }}>
              <div className={styles.blockTitle}>Vendor Summary</div>
              <table className={styles.linesTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Vendor Name</th>
                    <th>Preferred</th>
                    <th>MSME</th>
                    <th>GeM</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorRows.length ? (
                    vendorRows.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell, idx) => (
                          <td key={idx}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>No vendors</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <table className={styles.linesTable} style={{ marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>UoM</th>
                  <th>Qty</th>
                  <th>Expected Delivery</th>
                  <th>Technical Spec</th>
                  <th>Drawing Ref</th>
                </tr>
              </thead>
              <tbody>
                {lineRows.length ? (
                  lineRows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, idx) => (
                        <td key={idx} className={idx === 4 ? styles.num : undefined}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>No line items</td>
                  </tr>
                )}
              </tbody>
            </table>

            {rfq.terms ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>Terms & Conditions</div>
                <div className={styles.blockBody}>{rfq.terms}</div>
              </div>
            ) : null}

            {attachmentSummary.length ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>Attachments</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      {attachmentSummary.map(([label, value]) => (
                        <tr key={label}>
                          <td>{label}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {rfq.remarks ? (
              <div className={styles.block} style={{ marginTop: "0.5rem" }}>
                <div className={styles.blockTitle}>Remarks</div>
                <div className={styles.blockBody}>{rfq.remarks}</div>
              </div>
            ) : null}

            <div className={styles.block} style={{ marginTop: "0.5rem" }}>
              <div className={styles.blockTitle}>Signature</div>
              <div className={styles.blockBody}>
                <div style={{ minHeight: "4rem" }} />
                <p>Authorised Signatory · {rfq.buyer || "Buyer"}</p>
              </div>
            </div>

            <ProcurementPrintFooter
              companyName={companyName}
              note="This is a system-generated Request for Quotation document."
            />
          </div>
        </article>
      </div>
    </div>
  );
}
