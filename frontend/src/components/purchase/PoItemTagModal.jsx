import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import "../../styles/subcomponents.css";
import styles from "./PoModal.module.css";

const FIELD_KEYS = ["itemNo", "itemName", "itemDescription", "materialCode", "mpn"];

const FIELD_META = {
  itemNo: { label: "Material Code", valueKey: "itemNo" },
  itemName: { label: "Material Name", valueKey: "itemName" },
  itemDescription: { label: "Material Description", valueKey: "description" },
  materialCode: { label: "Material Code", valueKey: "materialCode" },
  mpn: { label: "MPN - Mfr Part No.", valueKey: "mpn" },
};

function buildTagValue(row, selected) {
  return FIELD_KEYS.filter((key) => selected[key])
    .map((key) => String(row?.[FIELD_META[key].valueKey] ?? "").trim())
    .filter(Boolean)
    .join(" | ");
}

function defaultSelected(row) {
  if (row?.tagFields && typeof row.tagFields === "object") {
    return FIELD_KEYS.reduce((acc, key) => ({ ...acc, [key]: Boolean(row.tagFields[key]) }), {});
  }
  return {
    itemNo: true,
    itemName: true,
    itemDescription: true,
    materialCode: false,
    mpn: Boolean(row?.mpn),
  };
}

export default function PoItemTagModal({ open, row, onClose, onSave }) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();
  const [selected, setSelected] = useState(defaultSelected(row));

  useEffect(() => {
    if (!open) return;
    setSelected(defaultSelected(row));
  }, [open, row]);

  const tagPreview = useMemo(() => buildTagValue(row, selected), [row, selected]);

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
          <span className={styles.itemTagSubTitle}>(Select field to include in PO format)</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
          {FIELD_KEYS.map((key) => {
            const meta = FIELD_META[key];
            const value = String(row?.[meta.valueKey] ?? "");
            return (
              <div key={key} className={styles.itemTagRow}>
                <span className={styles.itemTagLabel}>{meta.label}</span>
                <span className={styles.arrow}>→</span>
                <input className="sc-input" value={value} readOnly tabIndex={-1} />
                <label className={styles.itemTagCheckWrap}>
                  <input
                    type="checkbox"
                    checked={Boolean(selected[key])}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span className={styles.itemTagCheckBox} />
                </label>
              </div>
            );
          })}
          <div className={styles.itemTagPreview}>
            <span>Tag Preview</span>
            <span className={styles.totalArrow}>→</span>
            <span className={styles.totalValue}>{tagPreview || "—"}</span>
          </div>
        </div>
        <ModalFooterActions
          onCancel={onClose}
          onSave={() =>
            onSave?.({
              tag: tagPreview,
              tagFields: selected,
            })
          }
        />
      </div>
    </div>,
    document.body
  );
}

