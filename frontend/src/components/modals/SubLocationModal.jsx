import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../common/ErpBackButton.jsx";

import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SelectField from "../subcomponents/SelectField.jsx";
import {
  listSubLocationsRequest,
  createSubLocationRequest,
  deleteSubLocationRequest,
  listLocationsRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import styles from "./SubLocationModal.module.css";
import "../../styles/subcomponents.css";

function makeLocalKey() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function SubLocationModal({ parentLocation, onClose, onSaved }) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parentId, setParentId] = useState(parentLocation?.id ? String(parentLocation.id) : "");
  const [parentOptions, setParentOptions] = useState([]);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const resolvedParent =
    parentLocation ||
    (parentId ? { id: parentId, locationId: parentOptions.find((o) => o.value === parentId)?.label } : null);

  const loadParents = useCallback(async () => {
    if (parentLocation?.id) return;
    try {
      const res = await listLocationsRequest();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setParentOptions(
        rows.map((r) => ({
          value: String(r._id || r.id),
          label: r.locationId || r.locationCode || String(r._id),
        }))
      );
    } catch {
      setParentOptions([]);
    }
  }, [parentLocation?.id]);

  const loadSubLocations = useCallback(async () => {
    const pid = parentLocation?.id || parentId;
    if (!pid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listSubLocationsRequest("", String(pid));
      const rows = Array.isArray(res?.data) ? res.data : [];
      setItems(
        rows.map((r) => ({
          id: String(r._id || r.id),
          subLocationId: r.subLocationId || "",
          subLocationName: r.subLocationName || r.subLocationId || "",
          _localKey: String(r._id || r.id),
          isNew: false,
        }))
      );
      setRemovedIds([]);
    } catch (err) {
      toast.error(err?.message || "Failed to load sub-locations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [parentLocation?.id, parentId, toast]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  useEffect(() => {
    if (parentLocation?.id) setParentId(String(parentLocation.id));
  }, [parentLocation?.id]);

  useEffect(() => {
    loadSubLocations();
  }, [loadSubLocations]);

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) {
      toast.error("Enter a sub-location name");
      return;
    }
    const pid = resolvedParent?.id;
    if (!pid) {
      toast.error("Select a parent location first");
      return;
    }
    const exists = items.some(
      (it) => it.subLocationId.toLowerCase() === name.toLowerCase() && !removedIds.includes(it.id)
    );
    if (exists) {
      toast.error("This sub-location already exists in the list");
      return;
    }
    setItems((prev) => [
      ...prev,
      { subLocationId: name, subLocationName: name, _localKey: makeLocalKey(), isNew: true },
    ]);
    setDraft("");
  };

  const handleRemove = (item) => {
    if (item.id && !item.isNew) {
      setRemovedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    }
    setItems((prev) => prev.filter((it) => it._localKey !== item._localKey));
  };

  const handleSave = async () => {
    const pid = resolvedParent?.id;
    if (!pid) {
      toast.error("Select a parent location");
      return;
    }

    const parentRow = parentLocation || {};
    const basePayload = {
      parentLocation: pid,
      locationType: parentRow.locationType || "",
      operationalCategory: parentRow.operationalCategory || "",
      gstin: parentRow.gstin || "",
      status: "Active",
      description: "",
    };

    setSaving(true);
    try {
      for (const id of removedIds) {
        await deleteSubLocationRequest(id);
      }
      const toCreate = items.filter((it) => it.isNew);
      for (const it of toCreate) {
        await createSubLocationRequest({
          ...basePayload,
          subLocationId: it.subLocationId,
          subLocationName: it.subLocationName || it.subLocationId,
        });
      }
      toast.success("Sub-locations saved");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save sub-locations");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className={`sc-modal ${styles.modal}`}
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sub-location-modal-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="sub-location-modal-title" className="sc-modal-title">
            Sub-Location
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className={`sc-modal-body ${styles.body}`}>
          {!parentLocation?.id && (
            <div className={styles.parentSelectWrap}>
              <SelectField
                label="Parent Location"
                required
                options={parentOptions}
                value={parentId}
                onChange={(v) => setParentId(v)}
              />
            </div>
          )}

          {resolvedParent?.locationId && (
            <p className={styles.parentHint}>
              Parent location: <strong>{resolvedParent.locationId}</strong>
            </p>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionLabel}>Add New Sub-Location</h3>
            <div className={styles.addRow}>
              <input
                type="text"
                className={styles.addInput}
                placeholder="Enter Sub-Location"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
              />
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleAdd}
                disabled={saving || !draft.trim()}
                aria-label="Add sub-location"
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.listArea}>
            {loading ? (
              <p className={styles.listEmpty}>Loading…</p>
            ) : items.length === 0 ? (
              <p className={styles.listEmpty}>No sub-locations added yet</p>
            ) : (
              items.map((item) => (
                <div key={item._localKey} className={styles.listItem}>
                  <span className={styles.listItemName}>
                    {item.subLocationName || item.subLocationId}
                  </span>
                  <button
                    type="button"
                    className={styles.listItemRemove}
                    onClick={() => handleRemove(item)}
                    disabled={saving}
                    aria-label={`Remove ${item.subLocationId}`}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <ErpBackButton onClick={onClose} ariaLabel="Back" />
          <button
            type="button"
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
