import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  ListOrdered,
  Package,
  ScrollText,
} from "lucide-react";
import { PO_CHANNEL } from "../../config/purchaseOrderWorkspace.js";
import {
  computeImportLandedCost,
  formatFc,
  landedCostFromPoTerms,
} from "../../utils/importLandedCost.js";
import PoApprovalLineCard from "./PoApprovalLineCard.jsx";
import PoDocumentPreview from "./PoDocumentPreview.jsx";
import styles from "./PoApprovalReview.module.css";

function formatMoney(value, currency = "INR") {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  const cur = String(currency || "INR").toUpperCase();
  const sym = cur === "INR" ? "₹" : cur === "USD" ? "$" : cur === "EUR" ? "€" : `${cur} `;
  return `${sym}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function buildApprovalChecks(po, lines, channel, landedSummary) {
  const terms = po.poTerms || {};
  const checks = [];

  checks.push({
    ok: Boolean(po.supplierName),
    label: "Vendor selected",
  });
  checks.push({
    ok: lines.length > 0,
    label: `${lines.length} line(s) with quantity`,
  });
  checks.push({
    ok: Boolean(terms.shipToLocation || terms.shipToLocationId),
    label: "Ship-to location defined",
  });
  checks.push({
    ok: Boolean(terms.paymentTerms?.trim()),
    label: "Payment terms on PO",
    soft: true,
  });

  if (channel === PO_CHANNEL.IMPORT) {
    const cur = String(po.currency || "USD").toUpperCase();
    checks.push({
      ok: cur !== "INR" || Number(landedSummary?.exchangeRate) === 1,
      label: cur === "INR" ? "INR supplier currency" : "Exchange rate captured",
      soft: cur === "INR",
    });
    checks.push({
      ok: Number(landedSummary?.totalLandedCostInr) > 0,
      label: "Landed cost (INR) calculated",
    });
    checks.push({
      ok: Boolean(terms.importMeta?.incoterm || terms.freightTerms),
      label: "INCOTerms / freight terms",
      soft: true,
    });
  } else {
    const total = Number(po.poValue?.totalPoValue ?? po.totalAmount ?? 0);
    checks.push({
      ok: total > 0,
      label: "PO value computed",
    });
    if (Number(po.poValue?.totalTax) > 0) {
      checks.push({
        ok: true,
        label: `GST / tax: ${formatMoney(po.poValue.totalTax)}`,
        soft: true,
      });
    }
  }

  return checks;
}

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "lines", label: "Line items", icon: Package },
  { id: "financials", label: "Financials", icon: CircleDollarSign },
  { id: "terms", label: "Terms & charges", icon: ScrollText },
  { id: "preview", label: "Print preview", icon: ListOrdered },
];

export default function PoApprovalReview({
  po,
  channel = "",
  printPath,
  onBack,
  onApprove,
  onOpenPrint,
  submitting = false,
}) {
  const [tab, setTab] = useState("overview");
  const poTerms = po?.poTerms || {};
  const poValue = po?.poValue || {};
  const currency = po?.currency || "INR";
  const isImport = channel === PO_CHANNEL.IMPORT;

  const lines = useMemo(
    () => (Array.isArray(po?.lines) ? po.lines.filter((l) => Number(l.qty) > 0) : []),
    [po?.lines]
  );

  const incidental = Array.isArray(po?.incidentalExpenses) ? po.incidentalExpenses : [];
  const incidentalTotal = incidental.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const landedSummary = useMemo(() => {
    if (!isImport) return null;
    return computeImportLandedCost({
      lines,
      landedCost: landedCostFromPoTerms(poTerms),
      currency,
      incidentalTotal,
    });
  }, [isImport, lines, poTerms, currency, incidentalTotal]);

  const checks = useMemo(
    () => buildApprovalChecks(po, lines, channel, landedSummary),
    [po, lines, channel, landedSummary]
  );

  const allRequiredOk = checks.filter((c) => !c.soft).every((c) => c.ok);
  const displayTotal = isImport
    ? landedSummary?.totalLandedCostInr
    : Number(poValue.totalPoValue ?? po.totalAmount ?? 0);

  return (
    <div className={styles.shell}>
      <aside className={styles.decision}>
        <div className={`${styles.hero} ${isImport ? styles.heroImport : ""}`}>
          <p className={styles.heroEyebrow}>Approval required</p>
          <h2 className={styles.heroTitle}>{po.poNo}</h2>
          <p className={styles.heroMeta}>
            {po.supplierName} · {formatDate(po.poDate)} · {currency}
            {isImport ? " · Import PO" : channel === PO_CHANNEL.DOMESTIC ? " · Domestic" : ""}
          </p>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Lines</span>
            <span className={styles.kpiValue}>{lines.length}</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{isImport ? "Landed (INR)" : "PO total"}</span>
            <span className={`${styles.kpiValue} ${styles.kpiValueAccent}`}>
              {isImport
                ? `₹${Number(displayTotal || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : formatMoney(displayTotal, currency)}
            </span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Status</span>
            <span className={styles.kpiValue}>{po.status}</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>GRN</span>
            <span className={styles.kpiValue}>{po.grnStatus || "Not Started"}</span>
          </div>
        </div>

        <div className={styles.checklist}>
          <h3 className={styles.checklistTitle}>Approval checklist</h3>
          {checks.map((c) => (
            <div key={c.label} className={styles.checkItem}>
              {c.ok ? (
                <CheckCircle2 size={16} className={styles.checkOk} aria-hidden />
              ) : (
                <AlertTriangle size={16} className={styles.checkWarn} aria-hidden />
              )}
              <span>{c.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          {printPath ? (
            <button type="button" className={styles.btnGhost} onClick={() => onOpenPrint?.(printPath)}>
              <ExternalLink size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Open full print layout
            </button>
          ) : null}
          <button type="button" className={styles.btnSecondary} onClick={onBack} disabled={submitting}>
            Back to summary
          </button>
          <button
            type="button"
            className={styles.btnApprove}
            onClick={onApprove}
            disabled={submitting || po.status !== "Draft" || !allRequiredOk}
            title={!allRequiredOk ? "Resolve checklist items before approving" : undefined}
          >
            {submitting ? "Approving…" : "Approve purchase order"}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
                onClick={() => setTab(t.id)}
              >
                <Icon size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className={styles.panel}>
          {tab === "overview" && (
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Supplier</label>
                <span>{po.supplierName}</span>
              </div>
              <div className={styles.field}>
                <label>PO type</label>
                <span>{po.poType}</span>
              </div>
              <div className={styles.field}>
                <label>Order reference</label>
                <span>{po.orderReferenceNo || "—"}</span>
              </div>
              <div className={styles.field}>
                <label>Ship-to</label>
                <span>{poTerms.shipToLocation || "—"}</span>
              </div>
              <div className={styles.field}>
                <label>Payment terms</label>
                <span>{poTerms.paymentTerms || "—"}</span>
              </div>
              <div className={styles.field}>
                <label>Transport</label>
                <span>
                  {[poTerms.modeOfTransport, poTerms.transporterName].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
              <div className={styles.field}>
                <label>Freight / INCOTerms</label>
                <span>{poTerms.freightTerms || poTerms.importMeta?.incoterm || "—"}</span>
              </div>
              <div className={styles.field}>
                <label>PO validity</label>
                <span>{poTerms.poValidity ? formatDate(poTerms.poValidity) : "—"}</span>
              </div>
            </div>
          )}

          {tab === "lines" &&
            lines.map((line) => (
              <PoApprovalLineCard key={line.lineNo} line={line} currency={currency} />
            ))}

          {tab === "financials" && (
            <>
              {isImport && landedSummary ? (
                <table className={styles.finTable}>
                  <tbody>
                    <tr>
                      <th>Goods value (FC)</th>
                      <td className="num">{formatFc(landedSummary.goodsValueFc, currency)}</td>
                    </tr>
                    <tr>
                      <th>Exchange rate</th>
                      <td className="num">{landedSummary.exchangeRate}</td>
                    </tr>
                    <tr>
                      <th>Freight</th>
                      <td className="num">{formatFc(landedSummary.breakdown.freight, currency)}</td>
                    </tr>
                    <tr>
                      <th>Insurance</th>
                      <td className="num">{formatFc(landedSummary.breakdown.insurance, currency)}</td>
                    </tr>
                    <tr>
                      <th>Customs / duty</th>
                      <td className="num">{formatFc(landedSummary.breakdown.customsDuty, currency)}</td>
                    </tr>
                    <tr>
                      <th>Clearing & port</th>
                      <td className="num">
                        {formatFc(
                          landedSummary.breakdown.clearingCharges + landedSummary.breakdown.portCharges,
                          currency
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Incidental on PO</th>
                      <td className="num">{formatMoney(incidentalTotal, currency)}</td>
                    </tr>
                    <tr>
                      <th>Total landed (INR)</th>
                      <td className={`num ${styles.finTotal}`}>
                        ₹
                        {landedSummary.totalLandedCostInr.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <>
                  <table className={styles.finTable}>
                    <tbody>
                      <tr>
                        <th>Net goods</th>
                        <td className="num">{formatMoney(poValue.netGoodsValue, currency)}</td>
                      </tr>
                      <tr>
                        <th>Incidental</th>
                        <td className="num">{formatMoney(poValue.totalIncidental ?? incidentalTotal, currency)}</td>
                      </tr>
                      <tr>
                        <th>Taxable</th>
                        <td className="num">{formatMoney(poValue.totalTaxable, currency)}</td>
                      </tr>
                      <tr>
                        <th>IGST</th>
                        <td className="num">{formatMoney(poValue.totalIgst, currency)}</td>
                      </tr>
                      <tr>
                        <th>CGST</th>
                        <td className="num">{formatMoney(poValue.totalCgst, currency)}</td>
                      </tr>
                      <tr>
                        <th>SGST</th>
                        <td className="num">{formatMoney(poValue.totalSgst, currency)}</td>
                      </tr>
                      <tr>
                        <th>Total PO value</th>
                        <td className={`num ${styles.finTotal}`}>
                          {formatMoney(poValue.totalPoValue ?? po.totalAmount, currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {Array.isArray(poValue.gstSummary) && poValue.gstSummary.length > 0 ? (
                    <table className={styles.finTable} style={{ marginTop: "1rem" }}>
                      <thead>
                        <tr>
                          <th>HSN</th>
                          <th>Taxable</th>
                          <th>Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {poValue.gstSummary.map((row, i) => (
                          <tr key={i}>
                            <td>{row.hsnCode || row.description || "—"}</td>
                            <td className="num">{formatMoney(row.taxableAmount, currency)}</td>
                            <td className="num">{formatMoney(row.totalTax, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </>
              )}
            </>
          )}

          {tab === "terms" && (
            <>
              {incidental.length > 0 ? (
                <table className={styles.finTable} style={{ marginBottom: "1rem" }}>
                  <thead>
                    <tr>
                      <th>Incidental expense</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidental.map((row, i) => (
                      <tr key={i}>
                        <td>{row.description}</td>
                        <td className="num">{formatMoney(row.amount, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#64748b", fontSize: "0.88rem" }}>No incidental expenses on this PO.</p>
              )}
              {poTerms.poRemarks ? (
                <div style={{ marginTop: "1rem" }}>
                  <strong style={{ fontSize: "0.8rem", color: "#64748b" }}>Remarks</strong>
                  <p style={{ margin: "0.35rem 0 0" }}>{poTerms.poRemarks}</p>
                </div>
              ) : null}
            </>
          )}

          {tab === "preview" && (
            <div className={styles.previewWrap}>
              <PoDocumentPreview po={po} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
