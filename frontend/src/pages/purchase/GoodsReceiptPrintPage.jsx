import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { appPath } from "../../config/navigation.js";
import { resolveGoodsReceiptPaths } from "../../config/goodsReceiptPaths.js";
import DocumentOrganizationLogo from "../../components/print/DocumentOrganizationLogo.jsx";
import { getCurrentCompanyRequest, getGoodsReceiptRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import ProcurementPrintFooter from "../../components/print/ProcurementPrintFooter.jsx";
import { buildGrnMpbcdcPrintRows } from "../../utils/goodsReceiptPrintHelpers.js";
import { formatPrintDate, formatPrintMoney } from "../../utils/poPrintHelpers.js";
import styles from "./PurchaseOrderPrintPage.module.css";

export default function GoodsReceiptPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useMemo(() => resolveGoodsReceiptPaths(location.pathname), [location.pathname]);
  const toast = useToast();
  const [grn, setGrn] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [grnRes, companyRes] = await Promise.all([
        getGoodsReceiptRequest(id),
        getCurrentCompanyRequest().catch(() => null),
      ]);
      setGrn(grnRes?.data || null);
      setCompany(companyRes?.data || null);
    } catch (err) {
      toast.error(err?.message || "Failed to load GRN");
      setGrn(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    document.body.classList.add("po-print-active");
    return () => document.body.classList.remove("po-print-active");
  }, []);

  const mpbcdcRows = useMemo(() => buildGrnMpbcdcPrintRows(grn), [grn]);

  if (loading) {
    return <p style={{ padding: "1rem" }}>Loading print preview…</p>;
  }

  if (!grn) {
    return <p style={{ padding: "1rem" }}>Goods receipt not found.</p>;
  }

  const companyName = company?.companyName || "Organisation";

  return (
    <div className={`${styles.pageShell} ${styles.pageShellStandalone}`}>
      <div className={styles.toolbarStandalone}>
        <button type="button" onClick={() => navigate(appPath(paths.detailPath(id)))}>
          Back
        </button>
        <button type="button" className={styles.btnPrintPrimary} onClick={() => window.print()}>
          <Printer size={18} aria-hidden />
          Print
        </button>
      </div>

      <article className={styles.sheet}>
        <div className={styles.sheetInner}>
          <header className={styles.compactHead}>
            <div className={styles.compactBrand}>
              <DocumentOrganizationLogo company={company} className={styles.logoImg} />
              <div>
                <h1>{companyName}</h1>
                <p>Goods Receipt Note</p>
              </div>
            </div>
            <div>
              <div>
                <strong>GRN No.</strong> {grn.grnNo}
              </div>
              <div>
                <strong>Date</strong> {formatPrintDate(grn.grnDate)}
              </div>
              <div>
                <strong>Status</strong> {grn.status}
              </div>
            </div>
          </header>

          <div className={styles.block}>
            <div className={styles.blockTitle}>Receipt Details</div>
            <div className={`${styles.blockBody} ${styles.blockBodyFlush}`}>
              <table className={styles.kvTable}>
                <tbody>
                  <tr>
                    <td>Vendor</td>
                    <td>{grn.supplierName || "—"}</td>
                  </tr>
                  <tr>
                    <td>Purchase Order</td>
                    <td>{grn.poNo || "—"}</td>
                  </tr>
                  <tr>
                    <td>Total Amount</td>
                    <td>{formatPrintMoney(grn.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td>Remarks</td>
                    <td>{grn.remarks || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className={styles.linesTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Material</th>
              <th>UoM</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(grn.lines || []).map((line, index) => (
              <tr key={`${line.lineNo}-${line.itemId}`}>
                <td>{index + 1}</td>
                <td>
                  {line.itemNo ? `${line.itemNo} — ` : ""}
                  {line.itemName}
                </td>
                <td>{line.uom}</td>
                <td className={styles.num}>{line.qty}</td>
                <td className={styles.num}>{formatPrintMoney(line.rate)}</td>
                <td className={styles.num}>{formatPrintMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {mpbcdcRows.length ? (
          <div className={styles.block} style={{ marginTop: "0.75rem" }}>
            <div className={styles.blockTitle}>Government Procurement Details</div>
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

            <ProcurementPrintFooter
              companyName={company?.companyName || "Organisation"}
              note="This is a system-generated goods receipt document."
            />
        </div>
      </article>
    </div>
  );
}
