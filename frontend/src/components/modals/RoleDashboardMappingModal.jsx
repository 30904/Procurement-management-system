import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  CircleDollarSign,
  Factory,
  LayoutDashboard,
  Shield,
  ShoppingCart,
} from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useToast } from "../../hooks/useToast.js";
import { updateRoleDashboardMappingRequest } from "../../services/api.js";
import styles from "./RoleDashboardMappingModal.module.css";
import "../../styles/subcomponents.css";

const DASHBOARD_ICONS = {
  executive: BarChart3,
  operations: Factory,
  finance: CircleDollarSign,
  purchase: ShoppingCart,
  default: LayoutDashboard,
};

export default function RoleDashboardMappingModal({ roleRow, catalog, onClose, onSaved }) {
  const toast = useToast();
  const [dashboardKey, setDashboardKey] = useState(roleRow?.dashboardKey || "default");
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const selected = useMemo(
    () => (catalog || []).find((c) => c.key === dashboardKey),
    [catalog, dashboardKey]
  );

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await updateRoleDashboardMappingRequest(roleRow._id || roleRow.id, { dashboardKey });
      await onSaved();
    } catch (err) {
      toast.error(err?.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-dash-map-title"
      >
        <div className="sc-modal-bar" />

        <header
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="role-dash-map-title" className="sc-modal-title">
            Assign dashboard
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.roleCard}>
            <div className={styles.roleIcon} aria-hidden>
              <Shield size={20} strokeWidth={2} />
            </div>
            <div className={styles.roleMeta}>
              <p className={styles.roleName}>{roleRow?.roleName}</p>
              <p className={styles.roleCode}>Role code · {roleRow?.roleCode}</p>
            </div>
          </div>

          <p className={styles.hint}>
            Choose which dashboard users with this role see when they open{" "}
            <strong>Dashboard</strong> from the sidebar. Changes apply on their next visit to the
            dashboard page.
          </p>

          <div>
            <p className={styles.sectionLabel}>Dashboard screen</p>
            <div className={styles.optionGrid} role="radiogroup" aria-label="Dashboard screen">
              {(catalog || []).map((item) => {
                const Icon = DASHBOARD_ICONS[item.key] || LayoutDashboard;
                const isSelected = dashboardKey === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                    onClick={() => setDashboardKey(item.key)}
                  >
                    {isSelected ? <span className={styles.checkMark} aria-hidden>✓</span> : null}
                    <span className={styles.optionIcon} aria-hidden>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <span className={styles.optionText}>
                      <p className={styles.optionTitle}>{item.label}</p>
                      {item.description ? (
                        <p className={styles.optionDesc}>{item.description}</p>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected ? (
            <p className={styles.preview}>
              <strong>Preview:</strong> {selected.label} — {selected.description}
            </p>
          ) : null}
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onSave={handleSave}
          saving={saving}
          saveLabel="Save mapping"
        />
      </div>
    </div>,
    document.body
  );
}
