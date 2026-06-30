import { createPortal } from "react-dom";
import closeBtnIcon from "../../assets/close-btn.svg";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import styles from "./ConfirmDialog.module.css";

/**
 * @param {{
 *   open: boolean;
 *   title: string;
 *   message: string;
 *   confirmLabel?: string;
 *   cancelLabel?: string;
 *   variant?: "danger" | "primary";
 *   loading?: boolean;
 *   onConfirm: () => void;
 *   onCancel: () => void;
 * }} props
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag({ open });

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      style={overlayStyle}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className={styles.dialog}
        style={modalStyle}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={styles.bar} />
        <header
          className={styles.header}
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <h2 id="confirm-dialog-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            <img src={closeBtnIcon} alt="" />
          </button>
        </header>
        <div className={styles.body}>
          <p id="confirm-dialog-message" className={styles.message}>
            {message}
          </p>
        </div>
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              variant === "danger" ? styles.confirmBtnDanger : styles.confirmBtnPrimary
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
