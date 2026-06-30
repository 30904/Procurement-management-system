import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import DocumentOrganizationLogo from "../../components/print/DocumentOrganizationLogo.jsx";
import {
  getCurrentCompanyRequest,
  getLocationByIdRequest,
  getLogisticsMasterRequest,
  getServicePurchaseOrderRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { inrAmountInWords } from "../../utils/inrAmountInWords.js";
import {
  buildSpoGstSummaryRows,
  buildSpoPrintLineRows,
  formatLocationAddress,
  formatPrintDate,
  formatPrintMoney,
  logisticsProviderBlock,
  primaryContact,
} from "../../utils/spoPrintHelpers.js";
import styles from "./PurchaseOrderPrintPage.module.css";
import spoStyles from "./ServicePurchaseOrderPrintPage.module.css";

function Watermark({ label = "DRAFT" }) {
  return (
    <div className={styles.watermark} aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className={styles.watermarkText}>
          {label}
        </span>
      ))}
    </div>
  );
}

function AddressBlock({ title, lines, phone, email, gstin }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockTitle}>{title}</div>
      <div className={styles.blockBody}>
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {phone ? <div>Contact No.: {phone}</div> : null}
        {email ? <div>Email: {email}</div> : null}
        {gstin ? (
          <div>
            <strong>GSTIN:</strong> {gstin}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ServicePurchaseOrderPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [spo, setSpo] = useState(null);
  const [company, setCompany] = useState(null);
  const [location, setLocation] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const spoRes = await getServicePurchaseOrderRequest(id);
      const doc = spoRes?.data;
      if (!doc) {
        toast.error("Service purchase order not found");
        navigate(appPath("purchase/service-po/generate-spo"), { replace: true });
        return;
      }
      const [companyRes, providerRes] = await Promise.all([
        getCurrentCompanyRequest(),
        doc.serviceProviderId
          ? getLogisticsMasterRequest(doc.serviceProviderId)
          : Promise.resolve(null),
      ]);
      let loc = null;
      if (doc.locationId) {
        try {
          const locRes = await getLocationByIdRequest(doc.locationId);
          loc = locRes?.data || null;
        } catch {
          /* optional */
        }
      }
      setSpo({ ...doc, _provider: providerRes?.data || null });
      setCompany(companyRes?.data || null);
      setLocation(loc);
    } catch (err) {
      toast.error(err?.message || "Failed to load service purchase order");
      navigate(appPath("purchase/service-po/generate-spo"), { replace: true });
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

  const spoValue = spo?.spoValue || {};
  const provider = useMemo(() => logisticsProviderBlock(spo?._provider), [spo?._provider]);
  const billLines = useMemo(() => formatLocationAddress(location, company), [location, company]);
  const billContact = useMemo(() => primaryContact(location?.contacts), [location]);
  const billGstin = location?.gstin || "";
  const lineRows = useMemo(() => (spo ? buildSpoPrintLineRows(spo) : []), [spo]);
  const gstRows = useMemo(() => (spo ? buildSpoGstSummaryRows(spo) : []), [spo]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className={styles.pageShell}>
        <p className={styles.loading}>Preparing service purchase order preview…</p>
      </div>
    );
  }

  if (!spo) return null;

  const showWatermark = String(spo.status || "").toLowerCase() === "draft";

  return (
    <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
      <div className={styles.toolbarStandalone}>
        <button type="button" className={styles.btnPrintPrimary} onClick={handlePrint}>
          <Printer size={18} aria-hidden />
          Print
        </button>
      </div>

      <div className={styles.printArea} id="spo-print-document">
        <article className={styles.sheet}>
          {showWatermark ? <Watermark /> : null}
          <div className={styles.sheetInner}>
            <header className={styles.docHead}>
              <div className={styles.logoWrap}>
                <DocumentOrganizationLogo company={company} className={styles.logoImg} />
              </div>
              <h1 className={styles.docTitle}>Service Purchase Order</h1>
              <div className={styles.regBlock}>
                {company?.udyamRegistrationNo ? (
                  <div>
                    <strong>Udyam No.:</strong> {company.udyamRegistrationNo}
                  </div>
                ) : null}
                {company?.corporateIdentificationNo ? (
                  <div>
                    <strong>CIN:</strong> {company.corporateIdentificationNo}
                  </div>
                ) : null}
              </div>
            </header>

            <div className={styles.row2}>
              <AddressBlock
                title="Bill To"
                lines={billLines}
                phone={billContact.phone || company?.contact?.mobile}
                email={billContact.email || company?.contact?.email}
                gstin={billGstin}
              />
              <div className={styles.block}>
                <div className={styles.blockTitle}>Document Details</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      <tr>
                        <td>SPO No.</td>
                        <td>{spo.spoNo}</td>
                      </tr>
                      <tr>
                        <td>SPO Date</td>
                        <td>{formatPrintDate(spo.spoDate)}</td>
                      </tr>
                      <tr>
                        <td>Amendment Ref No.</td>
                        <td>
                          {Number(spo.amendRevNo) > 0
                            ? `${spo.spoNo} / AMD-${spo.amendRevNo}`
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td>Service Category</td>
                        <td>{spo.serviceCategory || "Domestic"}</td>
                      </tr>
                      <tr>
                        <td>Order Reference</td>
                        <td>{spo.orderReferenceNo || ""}</td>
                      </tr>
                      <tr>
                        <td>SPO Validity</td>
                        <td>{formatPrintDate(spo.spoValidity)}</td>
                      </tr>
                      <tr>
                        <td>Currency</td>
                        <td>{spo.currency || "INR"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.row2}>
              <AddressBlock
                title="Service Provider"
                lines={provider.lines}
                phone={provider.phone}
                email={provider.email}
                gstin={provider.gstin}
              />
              <AddressBlock title="Ship To / Location" lines={billLines} gstin={billGstin} />
            </div>

            <div className={styles.introHtml}>
              <p>Dear Sir/Madam,</p>
              <p>Please find below the service purchase order details.</p>
            </div>

            <table className={styles.linesTable}>
              <thead>
                <tr>
                  <th className={styles.colSn}>#</th>
                  <th className={styles.colDesc}>Description of Services</th>
                  <th>SAC</th>
                  <th>GST %</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Disc %</th>
                  <th>Net Rate</th>
                  <th>Amount</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {lineRows.map((row, index) => (
                  <tr key={row.key} className={row.pad ? styles.linePadRow : undefined}>
                    <td className={styles.colSn}>{index + 1}</td>
                    <td className={styles.colDesc}>
                      {row.description
                        ? row.description.split("\n").map((part, i) => <div key={i}>{part}</div>)
                        : null}
                    </td>
                    <td>{row.sacCode}</td>
                    <td className={styles.num}>
                      {row.gstRate != null && row.gstRate !== "" ? `${row.gstRate}%` : ""}
                    </td>
                    <td className={styles.num}>{row.qty}</td>
                    <td className={styles.num}>{row.rate}</td>
                    <td className={styles.num}>{row.disc}</td>
                    <td className={styles.num}>{row.netRate}</td>
                    <td className={styles.num}>{row.lineValue}</td>
                    <td>{row.scheduleDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.bottomRow}>
              <table className={styles.gstTable}>
                <thead>
                  <tr>
                    <th>SAC</th>
                    <th>Taxable Amt.</th>
                    <th>GST %</th>
                    <th>GST Amt.</th>
                  </tr>
                </thead>
                <tbody>
                  {gstRows.map((row) => (
                    <tr key={row.sacCode}>
                      <td>{row.sacCode}</td>
                      <td className={styles.num}>{formatPrintMoney(row.taxableAmt)}</td>
                      <td className={styles.num}>{row.gstRate ? `${row.gstRate}%` : ""}</td>
                      <td className={styles.num}>{formatPrintMoney(row.gstAmt)}</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>
                      <strong>Total &gt;&gt;</strong>
                    </td>
                    <td className={styles.num}>
                      <strong>{formatPrintMoney(spoValue.totalTaxable)}</strong>
                    </td>
                    <td />
                    <td className={styles.num}>
                      <strong>{formatPrintMoney(spoValue.totalGst)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table className={styles.summaryTable}>
                <tbody>
                  <tr>
                    <td>Total Taxable Amt:</td>
                    <td className={styles.num}>
                      <strong>{formatPrintMoney(spoValue.totalTaxable)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>Total GST:</td>
                    <td className={styles.num}>{formatPrintMoney(spoValue.totalGst, "")}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total SPO Amount:</strong>
                    </td>
                    <td className={styles.num}>
                      <strong>{formatPrintMoney(spoValue.totalSpoValue)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <table className={styles.wordsTable}>
              <tbody>
                <tr>
                  <td className={styles.wordsLabel}>Total GST (In Words):</td>
                  <td>{inrAmountInWords(spoValue.totalGst)}</td>
                </tr>
                <tr>
                  <td className={styles.wordsLabel}>Total SPO Amount (In Words):</td>
                  <td>{inrAmountInWords(spoValue.totalSpoValue)}</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.row2}>
              <div className={styles.block}>
                <div className={styles.blockTitle}>SPO Terms</div>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      <tr>
                        <td>Payment Terms</td>
                        <td>{spo.paymentTerms || ""}</td>
                      </tr>
                      <tr>
                        <td>SPO Remarks</td>
                        <td>{spo.spoRemarks || "None"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.block}>
                <div className={styles.blockTitle}>
                  For {company?.companyName || location?.name || "Company"}
                </div>
                <div className={styles.signArea} />
                <div className={styles.signLabel}>Authorised Signatory</div>
              </div>
            </div>

            <div className={styles.docClose}>
              <p className={styles.footerNote}>
                This is a system-generated document; hence, no signature is required.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
