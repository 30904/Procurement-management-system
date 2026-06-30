import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useToast } from "../../hooks/useToast.js";
import { getServicePurchaseOrderAmendmentHistoryRequest } from "../../services/api.js";
import styles from "../modals/ItemInventoryLevelsModal.module.css";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SpoAmendmentHistoryModal({ open, spoId, spoNo, onClose }) {
  const toast = useToast();
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !spoId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getServicePurchaseOrderAmendmentHistoryRequest(spoId);
        if (!cancelled) setData(res?.data ?? null);
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load amendment history");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, spoId, toast]);

  if (!open) return null;

  const history = Array.isArray(data?.history) ? [...data.history].reverse() : [];
  const pending = data?.pendingAmendment;
  const currentRev = data?.amendRevNo ?? 0;

  return createPortal(
    <div
      className="sc-modal-overlay"
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "min(92vw, 720px)", maxWidth: "720px" }}
      >
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Amendment History — {spoNo || data?.spoNo || ""}</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>
        <div className="sc-modal-body">
          <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.85rem" }}>
            Current revision: <strong>{currentRev > 0 ? currentRev : "Original (0)"}</strong>
            {data?.amendStatus === "Pending" ? (
              <span style={{ marginLeft: "0.5rem", color: "#ea580c", fontWeight: 600 }}>
                · Amendment pending approval
              </span>
            ) : null}
          </p>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading…</p>
          ) : (
            <>
              {pending && data?.amendStatus === "Pending" ? (
                <section
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem 0.85rem",
                    borderRadius: 0,
                    border: "1px solid #fed7aa",
                    background: "#fff7ed",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "0.35rem" }}>Pending amendment</strong>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                    Submitted: {formatDateTime(pending.submittedAt)}
                    {pending.submittedByName ? ` · ${pending.submittedByName}` : ""}
                  </div>
                  {pending.amendmentRemarks ? (
                    <div style={{ marginTop: "0.35rem", fontSize: "0.82rem" }}>
                      Remarks: {pending.amendmentRemarks}
                    </div>
                  ) : null}
                </section>
              ) : null}
              {history.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No approved amendments yet.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {history.map((row) => (
                    <li
                      key={row.revisionNo ?? row._id}
                      style={{ padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Revision {row.revisionNo}</div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>
                        Submitted {formatDateTime(row.submittedAt)}
                        {row.submittedByName ? ` · ${row.submittedByName}` : ""}
                        <br />
                        Approved {formatDateTime(row.approvedAt)}
                        {row.approvedByName ? ` · ${row.approvedByName}` : ""}
                      </div>
                      {row.remarks ? (
                        <div style={{ fontSize: "0.82rem", marginBottom: "0.35rem" }}>Remarks: {row.remarks}</div>
                      ) : null}
                      {Array.isArray(row.changes) && row.changes.length > 0 ? (
                        <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#f8fafc" }}>
                              <th style={{ textAlign: "left", padding: "0.3rem" }}>Field</th>
                              <th style={{ textAlign: "left", padding: "0.3rem" }}>From</th>
                              <th style={{ textAlign: "left", padding: "0.3rem" }}>To</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.changes.map((c, i) => (
                              <tr key={`${row.revisionNo}-${i}`}>
                                <td style={{ padding: "0.3rem" }}>{c.field}</td>
                                <td style={{ padding: "0.3rem" }}>{String(c.from ?? "—")}</td>
                                <td style={{ padding: "0.3rem" }}>{String(c.to ?? "—")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <div className={styles.summaryFooter}>
          <button type="button" className={styles.inlBtnPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
