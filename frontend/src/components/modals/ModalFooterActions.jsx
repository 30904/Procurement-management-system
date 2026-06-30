import CancelIcon from "../../assets/cancel.svg";
import ResetBtnIcon from "../../assets/reset-btn.svg";
import SaveBtnIcon from "../../assets/save-btn.svg?react";

/**
 * Standard sc-modal footer: cancel image + save SVG (sized via .sc-modal-footer svg).
 */
export default function ModalFooterActions({
  onCancel,
  onSave,
  onReset,
  saving = false,
  showDevHint = false,
  showReset = false,
}) {
  return (
    <div
      className={`sc-modal-footer${showDevHint ? " sc-modal-footer--with-hint" : ""}`}
    >
      {showDevHint ? (
        <span className="sc-modal-dev-hint">Alt+F1 — fill sample data</span>
      ) : null}
      <div className="sc-modal-footer-actions">
        {showReset && onReset ? (
          <img
            src={ResetBtnIcon}
            alt="Reset"
            onClick={onReset}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onReset?.();
              }
            }}
          />
        ) : null}
        <img
          src={CancelIcon}
          alt="Cancel"
          onClick={onCancel}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCancel?.();
            }
          }}
        />
        {onSave ? (
          <SaveBtnIcon
            className="erp-action-svg-btn"
            onClick={onSave}
            style={{
              opacity: saving ? 0.6 : 1,
              pointerEvents: saving ? "none" : "auto",
              cursor: saving ? "wait" : "pointer",
            }}
            aria-label="Save"
          />
        ) : null}
      </div>
    </div>
  );
}
