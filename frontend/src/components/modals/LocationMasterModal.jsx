import { useEffect, useState } from "react";
import ErpBackButton from "../common/ErpBackButton.jsx";

import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import {
  LOCATION_TYPE_OPTIONS,
  OPERATIONAL_CATEGORY_OPTIONS,
  INDIAN_STATES,
} from "../../config/locationFormOptions.js";
import {
  emptyLocationForm,
  locationDocToForm,
  locationFormToPayload,
  validateLocationForm,
} from "../../utils/locationFormState.js";
import { listStoresByLocationRequest } from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import styles from "./LocationMasterModal.module.css";
import "../../styles/subcomponents.css";

function CheckboxField({ label, checked, onChange, hint }) {
  return (
    <div className={styles.checkboxRow}>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={!!checked} onChange={(e) => onChange?.(e.target.checked)} />
        <span>{label}</span>
      </label>
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
    </div>
  );
}

function GeoField({ label, required, value, onChange, error }) {
  return (
    <div className={`sc-field${error ? ` ${styles.fieldError}` : ""}`}>
      <label className={`sc-label${required ? " sc-label-required" : ""}`}>{label}</label>
      <div className={styles.geoWrap}>
        <input
          type="text"
          className="sc-input"
          placeholder="Enter"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          inputMode="decimal"
        />
        <span className={styles.geoPin} aria-hidden>
          📍
        </span>
      </div>
    </div>
  );
}

export default function LocationMasterModal({ onClose, onSave, initialData }) {
  const toast = useToast();
  const [form, setForm] = useState(() => locationDocToForm(initialData));
  const [snapshot, setSnapshot] = useState(() => locationDocToForm(initialData));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [storeOptions, setStoreOptions] = useState([]);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const locationMongoId = initialData?._id || initialData?.id;
  const isEdit = Boolean(locationMongoId);

  useEffect(() => {
    const next = locationDocToForm(initialData);
    setForm(next);
    setSnapshot(next);
    setErrors({});
  }, [initialData]);

  useEffect(() => {
    if (!locationMongoId) {
      setStoreOptions([]);
      return undefined;
    }
    let cancelled = false;
    listStoresByLocationRequest(String(locationMongoId))
      .then((res) => {
        if (cancelled) return;
        const stores = Array.isArray(res?.data) ? res.data : [];
        setStoreOptions(
          stores.map((s) => ({
            value: String(s._id || s.id),
            label: [s.storeCode, s.storeName].filter(Boolean).join(" – ") || String(s._id),
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setStoreOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locationMongoId]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const patchContact = (index, key, value) => {
    setForm((prev) => {
      const contacts = [...(prev.contacts || [])];
      contacts[index] = { ...contacts[index], [key]: value };
      return { ...prev, contacts };
    });
  };

  const addContact = () => {
    setForm((prev) => ({
      ...prev,
      contacts: [
        ...(prev.contacts || []),
        { name: "", mobile: "", email: "", designation: "" },
      ],
    }));
  };

  const removeContact = (index) => {
    setForm((prev) => ({
      ...prev,
      contacts: (prev.contacts || []).filter((_, i) => i !== index),
    }));
  };

  const handleReset = () => {
    setForm(snapshot);
    setErrors({});
    toast.success("Form reset");
  };

  const fieldWrap = (key, node) => (
    <div className={errors[key] ? styles.fieldError : undefined}>{node}</div>
  );

  const handleSubmit = async () => {
    const validation = validateLocationForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await onSave(locationFormToPayload(form));
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={modalStyle} role="dialog" aria-modal="true">
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">Location Info</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          <div className="sc-field-grid">
            {fieldWrap(
              "registrationDate",
              <DateField
                label="Registration Date"
                required
                type="date"
                value={form.registrationDate}
                onChange={(v) => patch("registrationDate", v)}
              />
            )}
            {fieldWrap(
              "locationId",
              <InputField
                label="Location ID"
                required
                value={form.locationId}
                onChange={(v) => patch("locationId", v)}
                placeholder="e.g. Factory"
              />
            )}
            {fieldWrap(
              "name",
              <InputField
                label="Display Name"
                value={form.name}
                onChange={(v) => patch("name", v)}
                placeholder="Friendly name (defaults to Location ID)"
              />
            )}
            <CheckboxField
              label="Head office / central location"
              checked={form.isCentral}
              onChange={(v) => patch("isCentral", v)}
              hint="Only one location should be marked as central (HO)."
            />
            {fieldWrap(
              "locationType",
              <SelectField
                label="Location Type"
                required
                options={LOCATION_TYPE_OPTIONS}
                value={form.locationType}
                onChange={(v) => patch("locationType", v)}
              />
            )}
            {fieldWrap(
              "operationalCategory",
              <SelectField
                label="Operational Category"
                required
                options={OPERATIONAL_CATEGORY_OPTIONS}
                value={form.operationalCategory}
                onChange={(v) => patch("operationalCategory", v)}
              />
            )}

            {fieldWrap(
              "country",
              <InputField
                label="Country"
                required
                value={form.country}
                onChange={(v) => patch("country", v)}
              />
            )}
            {fieldWrap(
              "state",
              <SelectField
                label="State"
                required
                options={INDIAN_STATES}
                value={form.state}
                onChange={(v) => patch("state", v)}
              />
            )}
            {fieldWrap(
              "cityDistrict",
              <InputField
                label="City/District"
                required
                value={form.cityDistrict}
                onChange={(v) => patch("cityDistrict", v)}
              />
            )}
            {fieldWrap(
              "pinCode",
              <InputField
                label="PIN Code"
                required
                value={form.pinCode}
                onChange={(v) => patch("pinCode", v.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
              />
            )}

            {fieldWrap(
              "addressLine1",
              <InputField
                label="Address Line 1"
                required
                value={form.addressLine1}
                onChange={(v) => patch("addressLine1", v)}
              />
            )}
            {fieldWrap(
              "addressLine2",
              <InputField
                label="Address Line 2"
                required
                value={form.addressLine2}
                onChange={(v) => patch("addressLine2", v)}
              />
            )}
            {fieldWrap(
              "addressLine3",
              <InputField
                label="Address Line 3"
                required
                value={form.addressLine3}
                onChange={(v) => patch("addressLine3", v)}
              />
            )}
            <InputField
              label="Address Line 4"
              value={form.addressLine4}
              onChange={(v) => patch("addressLine4", v)}
            />

            <GeoField
              label="Latitude"
              required
              value={form.latitude}
              onChange={(v) => patch("latitude", v)}
              error={errors.latitude}
            />
            <GeoField
              label="Longitude"
              required
              value={form.longitude}
              onChange={(v) => patch("longitude", v)}
              error={errors.longitude}
            />
            <CheckboxField
              label="Use company-level GST (no location GSTIN)"
              checked={form.usesCompanyGstin}
              onChange={(v) => {
                patch("usesCompanyGstin", v);
                if (v) {
                  setErrors((prev) => {
                    if (!prev.gstin) return prev;
                    const next = { ...prev };
                    delete next.gstin;
                    return next;
                  });
                }
              }}
            />
            {fieldWrap(
              "gstin",
              <InputField
                label="GSTIN"
                required={!form.usesCompanyGstin}
                value={form.gstin}
                onChange={(v) => patch("gstin", v.toUpperCase())}
                placeholder={form.usesCompanyGstin ? "Inherited from company" : "15 character GSTIN"}
                disabled={form.usesCompanyGstin}
              />
            )}
            {fieldWrap(
              "status",
              <StatusField
                label="Status"
                required
                value={form.status}
                onChange={(v) => patch("status", v)}
              />
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Module access at this location</h3>
            <div className={styles.flagsGrid}>
              <CheckboxField
                label="Purchase"
                checked={form.enablePurchase}
                onChange={(v) => patch("enablePurchase", v)}
              />
              <CheckboxField
                label="Sales"
                checked={form.enableSales}
                onChange={(v) => patch("enableSales", v)}
              />
              <CheckboxField
                label="Production"
                checked={form.enableProduction}
                onChange={(v) => patch("enableProduction", v)}
              />
              <CheckboxField
                label="Quality"
                checked={form.enableQuality}
                onChange={(v) => patch("enableQuality", v)}
              />
              <CheckboxField
                label="Maintenance"
                checked={form.enableMaintenance}
                onChange={(v) => patch("enableMaintenance", v)}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default inventory stores</h3>
            {isEdit ? (
              <div className="sc-field-grid">
                <SelectField
                  label="Raw material store"
                  options={[{ value: "", label: "— None —" }, ...storeOptions]}
                  value={form.defaultRMStoreId}
                  onChange={(v) => patch("defaultRMStoreId", v)}
                />
                <SelectField
                  label="Finished goods store"
                  options={[{ value: "", label: "— None —" }, ...storeOptions]}
                  value={form.defaultFGStoreId}
                  onChange={(v) => patch("defaultFGStoreId", v)}
                />
                <SelectField
                  label="Scrap store"
                  options={[{ value: "", label: "— None —" }, ...storeOptions]}
                  value={form.defaultScrapStoreId}
                  onChange={(v) => patch("defaultScrapStoreId", v)}
                />
              </div>
            ) : (
              <p className={styles.fieldHint}>
                Save the location first, then edit it to assign default RM, FG, and scrap stores.
              </p>
            )}
          </div>

          {(form.contacts?.length ?? 0) > 0 && (
            <div className={styles.contactsSection}>
              <h3 className={styles.contactsTitle}>Contacts</h3>
              {form.contacts.map((contact, index) => (
                <div key={index} className={styles.contactBlock}>
                  <button
                    type="button"
                    className={styles.contactRemove}
                    onClick={() => removeContact(index)}
                    aria-label={`Remove contact ${index + 1}`}
                  >
                    ×
                  </button>
                  <InputField
                    label="Contact Name"
                    value={contact.name}
                    onChange={(v) => patchContact(index, "name", v)}
                  />
                  <InputField
                    label="Mobile"
                    value={contact.mobile}
                    onChange={(v) => patchContact(index, "mobile", v)}
                    inputMode="tel"
                  />
                  <InputField
                    label="Email"
                    value={contact.email}
                    onChange={(v) => patchContact(index, "email", v)}
                  />
                  <InputField
                    label="Designation"
                    value={contact.designation}
                    onChange={(v) => patchContact(index, "designation", v)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <ErpBackButton onClick={onClose} ariaLabel="Back" />
            <button
              type="button"
              className={styles.btnContact}
              onClick={addContact}
              disabled={saving}
            >
              + Contact
            </button>
          </div>
          <div className={styles.footerRight}>
            <button
              type="button"
              className={styles.btnReset}
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.btnSave}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
