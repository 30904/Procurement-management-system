import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function PoItemRateTrendModal({ open, row, supplierName, poNo, poDate, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  if (!open || !row) return null;

  const trendRows = [
    {
      supplierName: supplierName || "—",
      poNo: poNo || "0",
      poDate: formatDate(poDate),
      uom: row.uom || "—",
      qty: row.qty || "0",
      rate: row.rate || row.vbp || "0",
    },
  ];

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "64vw", minWidth: 640, maxWidth: 980 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Rate Trend</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body">
          <div className="im-table-scroll">
            <table className={`im-table im-table--master ${styles.rateTrendTable}`}>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>PO No.</th>
                  <th>PO Date</th>
                  <th>UoM</th>
                  <th>PO Qty</th>
                  <th>Rate/Unit</th>
                </tr>
              </thead>
              <tbody>
                {trendRows.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.supplierName}</td>
                    <td style={{ textAlign: "center" }}>{r.poNo}</td>
                    <td style={{ textAlign: "center" }}>{r.poDate}</td>
                    <td style={{ textAlign: "center" }}>{r.uom}</td>
                    <td style={{ textAlign: "center" }}>{r.qty}</td>
                    <td style={{ textAlign: "center" }}>{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

