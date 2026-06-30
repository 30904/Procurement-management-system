import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import DocumentOrganizationLogo from "../../components/print/DocumentOrganizationLogo.jsx";
import {
  getCurrentCompanyRequest,
  getLocationByIdRequest,
  getPoTermsConfigRequest,
  getPurchaseOrderRequest,
  getSupplierMasterRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import ProcurementPrintFooter from "../../components/print/ProcurementPrintFooter.jsx";
import { inrAmountInWords } from "../../utils/inrAmountInWords.js";
import {
  buildPrintLineRows,
  buildPoMpbcdcPrintRows,
  formatBillToAddress,
  formatPrintDate,
  formatPrintMoney,
  hasRichTextContent,
  primaryContact,
  supplierAddressBlock,
} from "../../utils/poPrintHelpers.js";
import styles from "./PurchaseOrderPrintPage.module.css";

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

function AddressBlock({ title, lines, phone, email, gstin, emphasizeFirstLine = false }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockTitle}>{title}</div>
      <div className={styles.blockBody}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={emphasizeFirstLine && i === 0 ? styles.blockLinePrimary : undefined}
          >
            {line}
          </div>
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

function resolveDefaultPrintFormat(config, poTerms = {}) {
  const rows = Array.isArray(config?.poPrintFormats) ? config.poPrintFormats : [];
  const defaultKey = String(config?.defaultPoPrintFormatKey || "").trim().toLowerCase();
  const byDefault = rows.find((r) => String(r?.key || "").trim().toLowerCase() === defaultKey);
  const firstActive = rows.find((r) => r?.isActive !== false);
  const picked = byDefault || firstActive || null;
  const templateFromConfig = String(picked?.templateKey || "").trim().toLowerCase();
  const nameFromConfig = String(picked?.name || "").trim();
  const templateFromPo = String(poTerms?.poPrintTemplateKey || "").trim().toLowerCase();
  return {
    templateKey:
      templateFromConfig || templateFromPo || "traditional",
    formatName:
      nameFromConfig || String(poTerms?.poPrintFormatName || "").trim() || "Traditional",
  };
}

export default function PurchaseOrderPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [po, setPo] = useState(null);
  const [company, setCompany] = useState(null);
  const [location, setLocation] = useState(null);
  const [poConfig, setPoConfig] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const poRes = await getPurchaseOrderRequest(id);
      const doc = poRes?.data;
      if (!doc) {
        toast.error("Purchase order not found");
        navigate(appPath("purchase/purchase-order/generate-po"), { replace: true });
        return;
      }
      const [companyRes, supplierRes, poCfgRes] = await Promise.all([
        getCurrentCompanyRequest(),
        doc.supplierId ? getSupplierMasterRequest(doc.supplierId) : Promise.resolve(null),
        getPoTermsConfigRequest().catch(() => null),
      ]);
      const shipToId = doc.poTerms?.shipToLocationId || doc.locationId;
      let loc = null;
      if (shipToId) {
        try {
          const locRes = await getLocationByIdRequest(shipToId);
          loc = locRes?.data || null;
        } catch {
          /* optional */
        }
      }
      setPo({ ...doc, _supplier: supplierRes?.data || null });
      setCompany(companyRes?.data || null);
      setLocation(loc);
      setPoConfig(poCfgRes?.data || null);
    } catch (err) {
      toast.error(err?.message || "Failed to load purchase order");
      navigate(appPath("purchase/purchase-order/generate-po"), { replace: true });
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

  const poTerms = po?.poTerms || {};
  const activePrintFormat = useMemo(
    () => resolveDefaultPrintFormat(poConfig, poTerms),
    [poConfig, poTerms]
  );
  const poPrintTemplateKey = String(activePrintFormat.templateKey || "traditional").toLowerCase();
  const resolvedTemplate =
    poPrintTemplateKey === "compact" || poPrintTemplateKey === "modern"
      ? poPrintTemplateKey
      : "traditional";
  const isTraditionalTemplate = resolvedTemplate === "traditional";
  const isModernTemplate = resolvedTemplate === "modern";
  const poValue = po?.poValue || {};
  const supplier = po?._supplier;
  const supplyType = poValue.supplyType === "interstate" ? "interstate" : "intrastate";

  const billLines = useMemo(
    () => formatBillToAddress(location, company),
    [location, company]
  );
  const shipLines = billLines;
  const billContact = useMemo(() => primaryContact(location?.contacts), [location]);
  const billGstin = location?.gstin || "";

  const vendor = useMemo(() => supplierAddressBlock(supplier), [supplier]);

  const lineRows = useMemo(() => (po ? buildPrintLineRows(po) : []), [po]);
  const mpbcdcPrintRows = useMemo(() => (po ? buildPoMpbcdcPrintRows(po) : []), [po]);

  const gstRows = useMemo(() => {
    const summary = Array.isArray(poValue.gstSummary) ? poValue.gstSummary : [];
    return summary.length
      ? summary
      : [{ hsnCode: "—", taxableAmt: 0, igstAmt: 0, cgstAmt: 0, sgstAmt: 0, totalTax: 0 }];
  }, [poValue.gstSummary]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className={styles.pageShell}>
        <p className={styles.loading}>Preparing purchase order preview…</p>
      </div>
    );
  }

  if (!po) return null;

  const showWatermark = String(po.status || "").toLowerCase() === "draft";
  const hasTermsPage = hasRichTextContent(poTerms.termsBodyHtml);
  const compactRows = lineRows.filter((row) => !row.pad);

  if (resolvedTemplate === "compact") {
    return (
      <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
        <div className={styles.toolbarStandalone}>
          <button type="button" className={styles.btnPrintPrimary} onClick={handlePrint}>
            <Printer size={18} aria-hidden />
            Print
          </button>
        </div>
        <div className={styles.printArea} id="po-print-document">
          <article className={styles.sheet}>
            {showWatermark ? <Watermark /> : null}
            <div className={`${styles.sheetInner} ${styles.compactInner}`}>
              <header className={styles.compactHead}>
                <div className={styles.compactBrand}>
                  <DocumentOrganizationLogo company={company} className={styles.logoImg} />
                  <div>
                    <h1 className={styles.compactTitle}>Purchase Order - Compact</h1>
                    <p className={styles.compactSub}>Format: {activePrintFormat.formatName || "Compact"}</p>
                  </div>
                </div>
                <div className={styles.compactMeta}>
                  <div><span>PO No:</span><strong>{po.poNo}</strong></div>
                  <div><span>Date:</span><strong>{formatPrintDate(po.poDate)}</strong></div>
                  <div><span>Vendor:</span><strong>{po.supplierName}</strong></div>
                </div>
              </header>

              <section className={styles.compactAddressGrid}>
                <div className={styles.compactCard}>
                  <h3>Bill To</h3>
                  {billLines.map((line, idx) => (
                    <p
                      key={`bill-${idx}`}
                      className={idx === 0 ? styles.compactLinePrimary : undefined}
                    >
                      {line}
                    </p>
                  ))}
                  <p>{billContact.phone || company?.contact?.mobile || ""}</p>
                  <p>{billContact.email || company?.contact?.email || ""}</p>
                  {billGstin ? <p>GSTIN: {billGstin}</p> : null}
                </div>
                <div className={styles.compactCard}>
                  <h3>Vendor</h3>
                  {vendor.lines.map((line, idx) => (
                    <p key={`vendor-${idx}`}>{line}</p>
                  ))}
                  <p>{vendor.phone || ""}</p>
                  <p>{vendor.email || ""}</p>
                  {vendor.gstin ? <p>GSTIN: {vendor.gstin}</p> : null}
                </div>
              </section>

              <table className={styles.compactTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Del. Date</th>
                    <th>Qty</th>
                    <th>UoM</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {compactRows.map((row, index) => (
                    <tr key={row.key || index}>
                      <td>{index + 1}</td>
                      <td>{row.description || "—"}</td>
                      <td>{row.deliveryDate || "—"}</td>
                      <td className={styles.num}>{row.qty || "0.00"}</td>
                      <td>{row.uom || "Nos"}</td>
                      <td className={styles.num}>{row.rate || "0.00"}</td>
                      <td className={styles.num}>{row.amount || "0.00"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <section className={styles.compactTotals}>
                <div><span>Taxable</span><strong>{formatPrintMoney(poValue.totalTaxable)}</strong></div>
                <div>
                  <span>{supplyType === "interstate" ? "IGST" : "CGST + SGST"}</span>
                  <strong>
                    {supplyType === "interstate"
                      ? formatPrintMoney(poValue.totalIgst)
                      : `${formatPrintMoney(poValue.totalCgst)} + ${formatPrintMoney(poValue.totalSgst)}`}
                  </strong>
                </div>
                <div><span>Total Tax</span><strong>{formatPrintMoney(poValue.totalTax)}</strong></div>
                <div><span>Round Off</span><strong>{formatPrintMoney(poValue.roundOff, "0.00")}</strong></div>
                <div className={styles.compactGrand}>
                  <span>Total PO Amount</span>
                  <strong>{formatPrintMoney(poValue.totalPoValue)}</strong>
                </div>
              </section>

              <section className={styles.compactWords}>
                <strong>Amount in words:</strong> {inrAmountInWords(poValue.totalPoValue)}
              </section>

              <section className={styles.compactTerms}>
                <div>
                  <h3>PO Terms</h3>
                  <p>Freight: {poTerms.freightTerms || "—"}</p>
                  <p>Payment: {poTerms.paymentTerms || "—"}</p>
                  <p>Transport: {poTerms.modeOfTransport || "—"}</p>
                </div>
                <div>
                  <h3>Remarks</h3>
                  <p>{poTerms.poRemarks || po.remarks || "None"}</p>
                </div>
              </section>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
      <div className={styles.toolbarStandalone}>
        <span className={styles.templateBadge}>
          Active template: {resolvedTemplate} ({activePrintFormat.formatName || "—"})
        </span>
        <button type="button" className={styles.btnPrintPrimary} onClick={handlePrint}>
          <Printer size={18} aria-hidden />
          Print
        </button>
      </div>

      <div className={styles.printArea} id="po-print-document">
        <article className={styles.sheet}>
          {showWatermark ? <Watermark /> : null}
          <div
            className={`${styles.sheetInner} ${isModernTemplate ? styles.modernSheetInner : ""}`}
            data-po-print-template={resolvedTemplate}
          >
          {!isTraditionalTemplate && !isModernTemplate ? (
            <p className={styles.templateNotice}>
              PO format is mapped to &quot;{poTerms?.poPrintFormatName || poTerms?.poPrintFormatKey || poPrintTemplateKey}&quot;.
              Rendering with Traditional layout.
            </p>
          ) : null}
          <header className={`${styles.docHead} ${isModernTemplate ? styles.modernDocHead : ""}`}>
            <div className={styles.logoWrap}>
              <DocumentOrganizationLogo company={company} className={styles.logoImg} />
            </div>
            <h1 className={styles.docTitle}>Purchase Order</h1>
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

          <div className={`${styles.row2} ${isModernTemplate ? styles.modernRow2 : ""}`}>
            <AddressBlock
              title="Bill To"
              lines={billLines}
              phone={billContact.phone || company?.contact?.mobile}
              email={billContact.email || company?.contact?.email}
              gstin={billGstin}
              emphasizeFirstLine
            />
            <div className={styles.block}>
              <div className={styles.blockTitle}>Document Details</div>
              <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                <table className={styles.kvTable}>
                  <tbody>
                    <tr>
                      <td>Purchase Order No.</td>
                      <td>{po.poNo}</td>
                    </tr>
                    <tr>
                      <td>Purchase Order Date</td>
                      <td>{formatPrintDate(po.poDate)}</td>
                    </tr>
                    <tr>
                      <td>Amendment Ref No.</td>
                      <td>
                        {Number(po.amendRevNo) > 0
                          ? `${po.poNo} / AMD-${po.amendRevNo}`
                          : "—"}
                      </td>
                    </tr>
                    <tr>
                      <td>Amendment Date</td>
                      <td>
                        {(() => {
                          const hist = Array.isArray(po.amendmentHistory) ? po.amendmentHistory : [];
                          const last = hist.length ? hist[hist.length - 1] : null;
                          return last?.approvedAt ? formatPrintDate(last.approvedAt) : "—";
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td>PO Type</td>
                      <td>{po.poType || "Standard PO"}</td>
                    </tr>
                    <tr>
                      <td>Order Reference</td>
                      <td>{po.orderReferenceNo || ""}</td>
                    </tr>
                    <tr>
                      <td>Currency</td>
                      <td>{po.currency || "INR"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={`${styles.row2} ${isModernTemplate ? styles.modernRow2 : ""}`}>
            <AddressBlock
              title="Vendor"
              lines={vendor.lines}
              phone={vendor.phone}
              email={vendor.email}
              gstin={vendor.gstin}
            />
            <AddressBlock
              title="Ship To"
              lines={shipLines}
              phone={billContact.phone || company?.contact?.mobile}
              email={billContact.email || company?.contact?.email}
              gstin={billGstin}
              emphasizeFirstLine
            />
          </div>

          {poTerms.openingLineHtml ? (
            <div
              className={styles.introHtml}
              dangerouslySetInnerHTML={{ __html: poTerms.openingLineHtml }}
            />
          ) : (
            <div className={styles.introHtml}>
              <p>Dear Sir/Madam,</p>
            </div>
          )}

          <table className={`${styles.linesTable} ${isModernTemplate ? styles.modernLinesTable : ""}`}>
            <thead>
              <tr>
                <th className={styles.colSn}>#</th>
                <th className={styles.colDesc}>Material Description</th>
                <th>Delivery Date</th>
                <th>HSN Code</th>
                <th>UoM</th>
                <th>Quantity</th>
                <th>Rate/Unit</th>
                <th>Disc %</th>
                <th>Amount Rs</th>
              </tr>
            </thead>
            <tbody>
              {lineRows.map((row, index) => (
                <tr key={row.key} className={row.pad ? styles.linePadRow : undefined}>
                  <td className={styles.colSn}>{row.pad ? "" : index + 1}</td>
                  <td className={styles.colDesc}>
                    {row.description ? (
                      row.description.split("\n").map((part, i) => <div key={i}>{part}</div>)
                    ) : null}
                  </td>
                  <td>{row.deliveryDate}</td>
                  <td>{row.hsn}</td>
                  <td>{row.uom}</td>
                  <td className={styles.num}>{row.qty}</td>
                  <td className={styles.num}>{row.rate}</td>
                  <td className={styles.num}>{row.disc}</td>
                  <td className={styles.num}>{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={`${styles.bottomRow} ${isModernTemplate ? styles.modernBottomRow : ""}`}>
            <table className={`${styles.gstTable} ${isModernTemplate ? styles.modernGstTable : ""}`}>
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Taxable Amt.</th>
                  {supplyType === "interstate" ? (
                    <>
                      <th>IGST %</th>
                      <th>IGST Amt.</th>
                    </>
                  ) : (
                    <>
                      <th>CGST %</th>
                      <th>CGST Amt.</th>
                      <th>SGST %</th>
                      <th>SGST Amt.</th>
                    </>
                  )}
                  <th>Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {gstRows.map((row) => (
                  <tr key={`${row.hsnCode}-${row.gstRate}`}>
                    <td>{row.hsnCode}</td>
                    <td className={styles.num}>{formatPrintMoney(row.taxableAmt)}</td>
                    {supplyType === "interstate" ? (
                      <>
                        <td className={styles.num}>{row.igstRate ? `${row.igstRate}%` : ""}</td>
                        <td className={styles.num}>{formatPrintMoney(row.igstAmt, "-")}</td>
                      </>
                    ) : (
                      <>
                        <td className={styles.num}>{row.cgstRate ? `${row.cgstRate}%` : ""}</td>
                        <td className={styles.num}>{formatPrintMoney(row.cgstAmt, "-")}</td>
                        <td className={styles.num}>{row.sgstRate ? `${row.sgstRate}%` : ""}</td>
                        <td className={styles.num}>{formatPrintMoney(row.sgstAmt, "-")}</td>
                      </>
                    )}
                    <td className={styles.num}>{formatPrintMoney(row.totalTax)}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>
                    <strong>Total &gt;&gt;</strong>
                  </td>
                  <td className={styles.num}>
                    <strong>{formatPrintMoney(poValue.totalTaxable)}</strong>
                  </td>
                  {supplyType === "interstate" ? (
                    <>
                      <td />
                      <td className={styles.num}>
                        <strong>{formatPrintMoney(poValue.totalIgst)}</strong>
                      </td>
                    </>
                  ) : (
                    <>
                      <td />
                      <td className={styles.num}>
                        <strong>{formatPrintMoney(poValue.totalCgst)}</strong>
                      </td>
                      <td />
                      <td className={styles.num}>
                        <strong>{formatPrintMoney(poValue.totalSgst)}</strong>
                      </td>
                    </>
                  )}
                  <td className={styles.num}>
                    <strong>{formatPrintMoney(poValue.totalTax)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className={`${styles.summaryTable} ${isModernTemplate ? styles.modernSummaryTable : ""}`}>
              <tbody>
                <tr>
                  <td>Total Taxable Amt:</td>
                  <td className={styles.num}>
                    <strong>{formatPrintMoney(poValue.totalTaxable)}</strong>
                  </td>
                </tr>
                <tr>
                  <td>Total Input IGST:</td>
                  <td className={styles.num}>{formatPrintMoney(poValue.totalIgst, "")}</td>
                </tr>
                <tr>
                  <td>Total Input SGST:</td>
                  <td className={styles.num}>{formatPrintMoney(poValue.totalSgst, "")}</td>
                </tr>
                <tr>
                  <td>Total Input CGST:</td>
                  <td className={styles.num}>{formatPrintMoney(poValue.totalCgst, "")}</td>
                </tr>
                <tr>
                  <td>Round Off (+/-):</td>
                  <td className={styles.num}>{formatPrintMoney(poValue.roundOff, "0.00")}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Total PO Amount:</strong>
                  </td>
                  <td className={styles.num}>
                    <strong>{formatPrintMoney(poValue.totalPoValue)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <table className={`${styles.wordsTable} ${isModernTemplate ? styles.modernWordsTable : ""}`}>
            <tbody>
              <tr>
                <td className={styles.wordsLabel}>Total Tax Amount (In Words):</td>
                <td>{inrAmountInWords(poValue.totalTax)}</td>
              </tr>
              <tr>
                <td className={styles.wordsLabel}>Total PO Amount (In Words):</td>
                <td>{inrAmountInWords(poValue.totalPoValue)}</td>
              </tr>
              <tr>
                <td colSpan={2} className={styles.gstNote}>
                  (Note: GST Amount will be paid after your Invoice shown in GSTR 2B)
                </td>
              </tr>
            </tbody>
          </table>

          {mpbcdcPrintRows.length ? (
            <div className={styles.block} style={{ marginTop: "0.75rem" }}>
              <div className={styles.blockTitle}>Procurement Reference</div>
              <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                <table className={styles.kvTable}>
                  <tbody>
                    {mpbcdcPrintRows.map((row) => (
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

          <div className={`${styles.row2Aligned} ${isModernTemplate ? styles.modernRow2 : ""}`}>
            <div className={styles.row2TitleRow}>
              <div className={styles.blockTitle}>PO Terms</div>
              <div className={styles.blockTitle}>
                For {company?.companyName || location?.name || "Company"}
              </div>
            </div>
            <div className={styles.row2ContentRow}>
              <div className={styles.block}>
                <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
                  <table className={styles.kvTable}>
                    <tbody>
                      <tr>
                        <td>Freight Term</td>
                        <td>{poTerms.freightTerms || ""}</td>
                      </tr>
                      <tr>
                        <td>Payment Terms</td>
                        <td>{poTerms.paymentTerms || ""}</td>
                      </tr>
                      <tr>
                        <td>Mode of Transport</td>
                        <td>{poTerms.modeOfTransport || ""}</td>
                      </tr>
                      <tr>
                        <td>Transporter</td>
                        <td>{poTerms.transporterName || ""}</td>
                      </tr>
                      <tr>
                        <td>PO Remark</td>
                        <td>{poTerms.poRemarks || po.remarks || "None"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.block}>
                <div className={styles.signArea} />
                <div className={styles.signLabel}>Authorised Signatory</div>
              </div>
            </div>
          </div>

          <ProcurementPrintFooter
            showSignatures={false}
            companyName={company?.companyName || location?.name || "Company"}
            note="This is a system-generated document; hence, no signature is required."
          />
          </div>
        </article>

        {hasTermsPage ? (
          <article className={`${styles.sheet} ${styles.termsPage}`}>
            {showWatermark ? <Watermark /> : null}
            <div className={styles.sheetInner}>
              <div className={styles.termsPageHead}>
                <h2 className={styles.termsPageTitle}>Terms &amp; Conditions</h2>
                <p className={styles.termsPageMeta}>
                  Purchase Order No.: <strong>{po.poNo}</strong>
                  {" · "}
                  Date: <strong>{formatPrintDate(po.poDate)}</strong>
                  {" · "}
                  Vendor: <strong>{po.supplierName}</strong>
                </p>
              </div>
              <div
                className={styles.termsPageBody}
                dangerouslySetInnerHTML={{ __html: poTerms.termsBodyHtml }}
              />
              <ProcurementPrintFooter
                showSignatures={false}
                companyName={company?.companyName || location?.name || "Company"}
                note={`Standard terms & conditions appended to Purchase Order ${po.poNo}.`}
              />
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
