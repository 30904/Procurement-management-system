import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

const VIEW_FIELDS = [
  { label: "Material Code", key: "itemNo" },
  { label: "Material Name", key: "itemName" },
  { label: "Material Description", key: "itemDescription" },
  { label: "Material Code", key: "materialCode" },
  { label: "MPN - Mfr Part No.", key: "mpn" },
  { label: "QC Level", key: "qcLevel" },
];

function fieldValue(row, key) {
  if (key === "itemDescription") {
    return String(row?.itemDescription ?? row?.description ?? "").trim();
  }
  return String(row?.[key] ?? "").trim();
}

export default function ItemTagViewModal({ open, row, onClose }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  if (!open || !row) return null;

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "48vw", minWidth: 520, maxWidth: 760 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">Material Tag</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
          {VIEW_FIELDS.map(({ label, key }) => (
            <div key={key} className={styles.itemTagRowView}>
              <span className={styles.itemTagLabel}>{label}</span>
              <span className={styles.arrow}>→</span>
              <input className="sc-input" value={fieldValue(row, key)} readOnly tabIndex={-1} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
