import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil, Printer } from "lucide-react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";
import SeparatorIcon from "../../assets/seperator.svg?react";
import GoodsReceiptMpbcdcDetailView from "../../components/purchase/GoodsReceiptMpbcdcDetailView.jsx";
import GoodsReceiptDocumentsSection from "../../components/purchase/GoodsReceiptDocumentsSection.jsx";
import AuditInformationSection from "../../components/common/AuditInformationSection.jsx";
import DetailTimelinePlaceholder from "../../components/common/DetailTimelinePlaceholder.jsx";
import DocumentStatusBadge from "../../components/common/DocumentStatusBadge.jsx";
import { appPath } from "../../config/navigation.js";
import { resolveGoodsReceiptPaths } from "../../config/goodsReceiptPaths.js";
import { useToast } from "../../hooks/useToast.js";
import { getGoodsReceiptRequest, postGoodsReceiptRequest } from "../../services/api.js";
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

export default function GoodsReceiptDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paths = useMemo(() => resolveGoodsReceiptPaths(location.pathname), [location.pathname]);
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [grn, setGrn] = useState(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getGoodsReceiptRequest(id);
      setGrn(res?.data || null);
    } catch (err) {
      toast.error(err?.message || "Failed to load goods receipt");
      setGrn(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    if (!id) return;
    setPosting(true);
    try {
      await postGoodsReceiptRequest(id);
      toast.success("GRN posted successfully");
      load();
    } catch (err) {
      toast.error(err?.message || "Post failed");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p style={{ padding: "1rem" }}>Loading goods receipt…</p>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p style={{ padding: "1rem" }}>Goods receipt not found.</p>
      </div>
    );
  }

  const isDraft = grn.status === "Draft";

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(paths.listPath))} ariaLabel="Back to list" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(paths.hubSegment))}>
            {paths.hubSegment === "purchase" ? "Purchase" : "Stores"}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(paths.listPath))}>
            {paths.title}
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">{grn.grnNo || "View"}</span>
        </h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button type="button" className={styles.btnSecondary} onClick={() => navigate(appPath(paths.printPath(id)))}>
            <Printer size={16} style={{ marginRight: 6 }} />
            Print
          </button>
          {isDraft ? (
            <>
              <button type="button" className={styles.btnSecondary} onClick={() => navigate(appPath(paths.editPath(id)))}>
                <Pencil size={16} style={{ marginRight: 6 }} />
                Edit
              </button>
              <button type="button" className={styles.btnPrimary} disabled={posting} onClick={handlePost}>
                {posting ? "Posting…" : "Post"}
              </button>
            </>
          ) : null}
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>GRN Header</h2>
          <div className={styles.fieldGrid}>
            <Field label="GRN No." value={grn.grnNo} />
            <Field label="Receipt Date" value={formatDate(grn.grnDate)} />
            <Field label="Purchase Order" value={grn.poNo} />
            <Field label="Vendor" value={grn.supplierName} />
            <Field label="Status" value={<DocumentStatusBadge status={grn.status} />} />
            <Field label="Total Amount" value={`₹${formatMoney(grn.totalAmount)}`} />
            <Field label="Remarks" value={grn.remarks} />
          </div>
        </section>

        <GoodsReceiptMpbcdcDetailView grn={grn} />

        <GoodsReceiptDocumentsSection grnId={id} readOnly />

        <AuditInformationSection document={grn} documentType="grn" />
        <DetailTimelinePlaceholder />

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Receipt Lines</h2>
          <div className="im-table-scroll">
            <table className="im-table im-table--master">
              <thead>
                <tr>
                  <th>Material Code</th>
                  <th>Material Name</th>
                  <th>UoM</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(grn.lines || []).map((line) => (
                  <tr key={`${line.lineNo}-${line.itemId}`}>
                    <td>{line.itemNo}</td>
                    <td>{line.itemName}</td>
                    <td>{line.uom}</td>
                    <td style={{ textAlign: "right" }}>{line.qty}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(line.rate)}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
