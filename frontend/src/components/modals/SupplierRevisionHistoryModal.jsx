import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";

const PAGE_SIZE = 5;

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yy} ${hh}:${min}`;
}

function statusLabel(value) {
  return String(value || "").toUpperCase() === "A" ? "Active" : "Inactive";
}

function fieldLabel(field) {
  const labels = {
    supplierName: "Vendor Name",
    supplierNickName: "Vendor Short Name",
    isSupplierActive: "Status",
    supplierCompanyType: "Company Type",
    supplierCurrency: "Currency",
    supplierINCOTerms: "Freight/INCO Terms",
    supplierPaymentTerms: "Payment Terms",
    countryOfOrigin: "Country of Origin",
    supplierType: "Supplier Type",
    supplierCIN: "PAN Card No.",
    supplierURD: "URD",
    supplierMSMENo: "MSME Classification",
    supplierLeadTimeInDays: "Lead Time (Days)",
    supplierVendorCode: "Vendor Code",
    supplierWebsite: "Website",
    gstClassification: "GST Classification",
    gstin: "GSTIN",
    supplierBillingAddress: "Billing Address",
    supplierShippingAddress: "Shipping Address",
    supplierBankDetails: "Bank Details",
    supplierContactMatrix: "Contact Details",
    supplierAddress: "Other Address",
  };
  return labels[field] || field;
}

function buildHistoryRows(sourceRow) {
  if (!sourceRow) return [];

  const sorted = [...(sourceRow.revisionHistory || [])].sort(
    (a, b) => Number(b.revisionNo || 0) - Number(a.revisionNo || 0)
  );

  const snapshot = {
    supplierCode: sourceRow.supplierCode,
    supplierName: sourceRow.supplierName,
    gstin: sourceRow.gstin,
    status: statusLabel(sourceRow.isSupplierActive),
  };

  const rows = [];
  for (const rev of sorted) {
    rows.push({
      id: `rev-${rev.revisionNo}`,
      supplierCode: snapshot.supplierCode,
      supplierName: snapshot.supplierName,
      gstin: snapshot.gstin,
      status: snapshot.status,
      revNumber: rev.revisionNo,
      revision: rev,
    });
    for (const ch of rev.changes || []) {
      if (ch.field === "supplierName") snapshot.supplierName = ch.from;
      if (ch.field === "gstin") snapshot.gstin = ch.from;
      if (ch.field === "isSupplierActive") snapshot.status = ch.from;
    }
  }

  if (sorted.length > 0) {
    rows.push({
      id: "rev-base",
      supplierCode: snapshot.supplierCode,
      supplierName: snapshot.supplierName,
      gstin: snapshot.gstin,
      status: snapshot.status,
      revNumber: 0,
      revision: null,
    });
  } else {
    rows.push({
      id: "rev-current",
      supplierCode: snapshot.supplierCode,
      supplierName: snapshot.supplierName,
      gstin: snapshot.gstin,
      status: snapshot.status,
      revNumber: Number(sourceRow.revNumber || 0),
      revision: null,
    });
  }

  return rows;
}

function RevisionInfoViewModal({ entry, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  if (!entry) return null;

  const revision = entry.revision;
  const changedFields = revision?.changes || [];
  const changedBy =
    revision?.changedBy?.name ||
    revision?.changedBy?.userName ||
    revision?.changedBy?.userEmail ||
    "—";

  return createPortal(
    <div
      className="sc-modal-overlay"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "52vw", minWidth: "620px", maxWidth: "860px", maxHeight: "78vh" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Revision Info</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ padding: "2vh 1.5vw", gap: "1.2vh" }}>
          <div className="sc-field-grid sc-field-grid--2col">
            <InputField label="Revision No." required value={`Rev ${entry.revNumber}`} locked />
            <InputField label="Revision Date" required value={formatDate(revision?.revisionDate)} locked />
            <div className="sc-field sc-field--full">
              <label className="sc-label sc-label-required">Reason for Revision</label>
              <textarea
                className="sc-input"
                style={{ minHeight: "6.2vh", paddingTop: "0.7vh", resize: "none" }}
                value={revision?.reason || "Initial version"}
                readOnly
              />
            </div>
            <InputField label="Revision Proposed by" required value={revision?.proposedBy || "—"} locked />
            <InputField label="Revision Approved by" required value={revision?.approvedBy || "—"} locked />
          </div>

          <div className="rl-separator" />

          <div>
            <div className="sc-label" style={{ marginBottom: "0.8vh" }}>
              Changed Fields
            </div>
            {changedFields.length === 0 ? (
              <div className="rl-empty" style={{ textAlign: "left", padding: "1vh 0" }}>
                No field-level changes captured for this revision.
              </div>
            ) : (
              <table className="rl-table">
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Field</th>
                    <th style={{ width: "37%" }}>From</th>
                    <th style={{ width: "37%" }}>To</th>
                  </tr>
                </thead>
                <tbody>
                  {changedFields.map((ch, idx) => (
                    <tr key={`${ch.field}-${idx}`}>
                      <td>{fieldLabel(ch.field)}</td>
                      <td>{String(ch.from ?? "—")}</td>
                      <td>{String(ch.to ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="rl-empty" style={{ textAlign: "left", padding: "1.2vh 0 0" }}>
              Changed by: <strong>{changedBy}</strong> on{" "}
              <strong>{formatDateTime(revision?.changedAt)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SupplierRevisionHistoryModal({ open, sourceRow, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [page, setPage] = useState(1);
  const [viewEntry, setViewEntry] = useState(null);

  const allRows = useMemo(() => buildHistoryRows(sourceRow), [sourceRow]);
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return allRows.slice(start, start + PAGE_SIZE);
  }, [allRows, safePage]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="sc-modal-overlay"
        style={overlayStyle}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div
          ref={modalRef}
          className="sc-modal rl-modal"
          style={{ ...modalStyle, width: "72vw", maxWidth: "1120px", height: "68vh", minHeight: "460px" }}
        >
          <div className="sc-modal-bar" />
          <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
            <span className="sc-modal-title">Revision History</span>
            <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
              <img src={CloseBtnIcon} alt="Close" />
            </button>
          </div>

          <div className="rl-separator" />
          <div className="rl-pagination">
            <button
              type="button"
              className="rl-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft size={18} color="#0f3d91" />
            </button>
            <span className="rl-page-label">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="rl-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={18} color="#0f3d91" />
            </button>
          </div>
          <div className="rl-separator" />

          <div className="rl-table-wrap">
            {pageRows.length === 0 ? (
              <div className="rl-empty">No revision history available.</div>
            ) : (
              <table className="rl-table">
                <thead>
                  <tr>
                    <th style={{ width: "14%" }}>Vendor Code</th>
                    <th style={{ width: "24%" }}>Vendor Name</th>
                    <th style={{ width: "18%" }}>GSTIN</th>
                    <th style={{ width: "11%", textAlign: "center" }}>Status</th>
                    <th style={{ width: "10%", textAlign: "center" }}>Rev #</th>
                    <th style={{ width: "10%", textAlign: "center" }}>Rev Info</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const isInactive = String(row.status || "").toLowerCase() === "inactive";
                    return (
                      <tr key={row.id}>
                        <td>{row.supplierCode}</td>
                        <td>{row.supplierName}</td>
                        <td>{row.gstin}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="im-status" style={{ justifyContent: "center" }}>
                            <span
                              className={`im-status-dot ${isInactive ? "im-status-dot--inactive" : ""}`}
                            />
                            {row.status || "Active"}
                          </span>
                        </td>
                        <td className="rl-rev-num" style={{ textAlign: "center" }}>
                          Rev {row.revNumber}
                        </td>
                        <td className="rl-rev-info">
                          {row.revision ? (
                            <Eye
                              size={17}
                              color="#ec4899"
                              style={{ cursor: "pointer" }}
                              onClick={() => setViewEntry(row)}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <RevisionInfoViewModal entry={viewEntry} onClose={() => setViewEntry(null)} />
    </>,
    document.body
  );
}
