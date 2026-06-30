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
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function fieldLabel(field) {
  const labels = {
    serviceDescription: "Service Description",
    sacCode: "SAC Code",
    gstRate: "GST Rate %",
    status: "Status",
  };
  return labels[field] || field;
}

function buildHistoryRows(sourceRow) {
  if (!sourceRow) return [];
  const sorted = [...(sourceRow.revisionHistory || [])].sort((a, b) => Number(b.revisionNo || 0) - Number(a.revisionNo || 0));
  const snapshot = {
    serviceNo: sourceRow.serviceNo,
    serviceDescription: sourceRow.serviceDescription,
    sacCode: sourceRow.sacCode,
    status: sourceRow.status,
  };
  const rows = [];
  for (const rev of sorted) {
    rows.push({ id: `rev-${rev.revisionNo}`, ...snapshot, revNumber: rev.revisionNo, revision: rev });
    for (const ch of rev.changes || []) {
      if (ch.field === "serviceDescription") snapshot.serviceDescription = ch.from;
      if (ch.field === "sacCode") snapshot.sacCode = ch.from;
      if (ch.field === "status") snapshot.status = ch.from;
    }
  }
  rows.push(sorted.length > 0 ? { id: "rev-base", ...snapshot, revNumber: 0, revision: null } : { id: "rev-current", ...snapshot, revNumber: Number(sourceRow.revNumber || 0), revision: null });
  return rows;
}

function RevisionInfoViewModal({ entry, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  if (!entry) return null;
  const revision = entry.revision;
  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", minWidth: "620px", maxWidth: "860px", maxHeight: "78vh" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Revision Info</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
        </div>
        <div className="sc-modal-body" style={{ padding: "2vh 1.5vw", gap: "1.2vh" }}>
          <div className="sc-field-grid sc-field-grid--2col">
            <InputField label="Revision No." required value={`Rev ${entry.revNumber}`} locked />
            <InputField label="Revision Date" required value={formatDate(revision?.revisionDate)} locked />
            <div className="sc-field sc-field--full"><label className="sc-label sc-label-required">Reason for Revision</label><textarea className="sc-input" style={{ minHeight: "6.2vh", paddingTop: "0.7vh", resize: "none" }} value={revision?.reason || "Initial version"} readOnly /></div>
            <InputField label="Revision Proposed by" required value={revision?.proposedBy || "—"} locked />
            <InputField label="Revision Approved by" required value={revision?.approvedBy || "—"} locked />
          </div>
          <div className="rl-separator" />
          <table className="rl-table">
            <thead><tr><th style={{ width: "26%" }}>Field</th><th style={{ width: "37%" }}>From</th><th style={{ width: "37%" }}>To</th></tr></thead>
            <tbody>{(revision?.changes || []).map((ch, i) => <tr key={`${ch.field}-${i}`}><td>{fieldLabel(ch.field)}</td><td>{String(ch.from ?? "—")}</td><td>{String(ch.to ?? "—")}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ServiceRevisionHistoryModal({ open, sourceRow, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [page, setPage] = useState(1);
  const [viewEntry, setViewEntry] = useState(null);
  const allRows = useMemo(() => buildHistoryRows(sourceRow), [sourceRow]);
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = allRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  if (!open) return null;
  return createPortal(
    <>
      <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div ref={modalRef} className="sc-modal rl-modal" style={{ ...modalStyle, width: "72vw", maxWidth: "1120px", height: "68vh", minHeight: "460px" }}>
          <div className="sc-modal-bar" />
          <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
            <span className="sc-modal-title">Revision History</span>
            <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close"><img src={CloseBtnIcon} alt="Close" /></button>
          </div>
          <div className="rl-separator" />
          <div className="rl-pagination">
            <button type="button" className="rl-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}><ChevronLeft size={18} color="#0f3d91" /></button>
            <span className="rl-page-label">Page {safePage} of {totalPages}</span>
            <button type="button" className="rl-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}><ChevronRight size={18} color="#0f3d91" /></button>
          </div>
          <div className="rl-separator" />
          <div className="rl-table-wrap">
            <table className="rl-table">
              <thead><tr><th>Service No.</th><th>Service Description</th><th>SAC Code</th><th style={{ textAlign: "center" }}>Status</th><th style={{ textAlign: "center" }}>Rev #</th><th style={{ textAlign: "center" }}>Rev Info</th></tr></thead>
              <tbody>
                {pageRows.length === 0 ? <tr><td colSpan={6} className="rl-empty">No revision history available.</td></tr> : pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.serviceNo}</td><td>{row.serviceDescription}</td><td>{row.sacCode}</td>
                    <td style={{ textAlign: "center" }}>{row.status}</td>
                    <td style={{ textAlign: "center" }}>Rev {row.revNumber}</td>
                    <td className="rl-rev-info">{row.revision ? <Eye size={17} color="#ec4899" style={{ cursor: "pointer" }} onClick={() => setViewEntry(row)} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <RevisionInfoViewModal entry={viewEntry} onClose={() => setViewEntry(null)} />
    </>,
    document.body
  );
}
