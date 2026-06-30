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

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${formatDate(value)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildHistoryRows(sourceRow) {
  if (!sourceRow) return [];
  const sorted = [...(sourceRow.revisionHistory || [])].sort(
    (a, b) => Number(b.revisionNo || 0) - Number(a.revisionNo || 0)
  );
  const lineCount = Array.isArray(sourceRow.lines) ? sourceRow.lines.length : 0;

  const rows = sorted.map((rev) => ({
    id: `rev-${rev.revisionNo}`,
    itemNo: sourceRow.itemNo,
    itemName: sourceRow.itemName,
    lineCount,
    revNumber: rev.revisionNo,
    revision: rev,
  }));

  if (!sorted.length) {
    rows.push({
      id: "rev-current",
      itemNo: sourceRow.itemNo,
      itemName: sourceRow.itemName,
      lineCount,
      revNumber: Number(sourceRow.revNumber || 0),
      revision: null,
    });
  }

  return rows;
}

function RevisionInfoViewModal({ entry, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  if (!entry?.revision) return null;
  const revision = entry.revision;
  const changedBy =
    revision?.changedBy?.name || revision?.changedBy?.userName || revision?.changedBy?.userEmail || "—";

  return createPortal(
    <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", minWidth: "560px", maxWidth: "860px" }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Revision Info</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ padding: "1.5rem" }}>
          <div className="sc-field-grid sc-field-grid--2col">
            <InputField label="Revision No." required value={`Rev ${entry.revNumber}`} locked />
            <InputField label="Revision Date" required value={formatDate(revision.revisionDate)} locked />
            <InputField label="Proposed by" required value={revision.proposedBy || "—"} locked />
            <InputField label="Approved by" required value={revision.approvedBy || "—"} locked />
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            Changed by <strong>{changedBy}</strong> on <strong>{formatDateTime(revision.changedAt)}</strong>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function RmSpecificationRevisionHistoryModal({ open, sourceRow, onClose }) {
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
      <div className="sc-modal-overlay" style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div ref={modalRef} className="sc-modal rl-modal" style={{ ...modalStyle, width: "70vw", maxWidth: "960px", minHeight: "400px" }}>
          <div className="sc-modal-bar" />
          <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
            <span className="sc-modal-title">RM Specification — Revision History</span>
            <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
              <img src={CloseBtnIcon} alt="Close" />
            </button>
          </div>
          <div className="rl-pagination" style={{ padding: "0.75rem 1rem" }}>
            <button type="button" className="rl-page-btn" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="rl-page-btn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="rl-table-wrap" style={{ padding: "0 1rem 1rem" }}>
            <table className="rl-table">
              <thead>
                <tr>
                  <th>Material Code</th>
                  <th>Material Name</th>
                  <th style={{ textAlign: "center" }}>Spec lines</th>
                  <th style={{ textAlign: "center" }}>Rev #</th>
                  <th style={{ textAlign: "center" }}>Rev Info</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.itemNo}</td>
                    <td>{row.itemName}</td>
                    <td style={{ textAlign: "center" }}>{row.lineCount}</td>
                    <td style={{ textAlign: "center" }}>Rev {row.revNumber}</td>
                    <td style={{ textAlign: "center" }}>
                      <Eye
                        size={17}
                        color="#ec4899"
                        style={{ cursor: row.revision ? "pointer" : "default", opacity: row.revision ? 1 : 0.35 }}
                        onClick={() => row.revision && setViewEntry(row)}
                      />
                    </td>
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
