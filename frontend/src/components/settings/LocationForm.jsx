import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import {
  LOCATION_TYPE_OPTIONS,
  OPERATIONAL_CATEGORY_OPTIONS,
  INDIAN_STATES,
} from "../../config/locationFormOptions.js";
import styles from "../../pages/settings/LocationUpsertPage.module.css";

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

function GeoField({ label, required, value, onChange, hasError }) {
  return (
    <div className={`sc-field${hasError ? ` ${styles.fieldError}` : ""}`}>
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

/**
 * Location create/edit form body (used on full pages, not modal).
 */
export default function LocationForm({
  form,
  errors = {},
  isEdit = false,
  storeOptions = [],
  onPatch,
  onPatchContact,
  onRemoveContact,
  onClearGstinError,
}) {
  const fieldWrap = (key, node) => (
    <div className={errors[key] ? styles.fieldError : undefined}>{node}</div>
  );

  return (
    <>
      <div className="sc-field-grid">
        {fieldWrap(
          "registrationDate",
          <DateField
            label="Registration Date"
            required
            type="date"
            value={form.registrationDate}
            onChange={(v) => onPatch("registrationDate", v)}
          />
        )}
        {fieldWrap(
          "locationId",
          <InputField
            label="Location ID"
            required
            value={form.locationId}
            onChange={(v) => onPatch("locationId", v)}
            placeholder="e.g. Factory"
          />
        )}
        {fieldWrap(
          "name",
          <InputField
            label="Display Name"
            value={form.name}
            onChange={(v) => onPatch("name", v)}
            placeholder="Friendly name (defaults to Location ID)"
          />
        )}
        <CheckboxField
          label="Head office / central location"
          checked={form.isCentral}
          onChange={(v) => onPatch("isCentral", v)}
          hint="Only one location should be marked as central (HO)."
        />
        {fieldWrap(
          "locationType",
          <SelectField
            label="Location Type"
            required
            options={LOCATION_TYPE_OPTIONS}
            value={form.locationType}
            onChange={(v) => onPatch("locationType", v)}
          />
        )}
        {fieldWrap(
          "operationalCategory",
          <SelectField
            label="Operational Category"
            required
            options={OPERATIONAL_CATEGORY_OPTIONS}
            value={form.operationalCategory}
            onChange={(v) => onPatch("operationalCategory", v)}
          />
        )}
        {fieldWrap(
          "country",
          <InputField
            label="Country"
            required
            value={form.country}
            onChange={(v) => onPatch("country", v)}
          />
        )}
        {fieldWrap(
          "state",
          <SelectField
            label="State"
            required
            options={INDIAN_STATES}
            value={form.state}
            onChange={(v) => onPatch("state", v)}
          />
        )}
        {fieldWrap(
          "cityDistrict",
          <InputField
            label="City/District"
            required
            value={form.cityDistrict}
            onChange={(v) => onPatch("cityDistrict", v)}
          />
        )}
        {fieldWrap(
          "pinCode",
          <InputField
            label="PIN Code"
            required
            value={form.pinCode}
            onChange={(v) => onPatch("pinCode", v.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
          />
        )}
        {fieldWrap(
          "addressLine1",
          <InputField
            label="Address Line 1"
            required
            value={form.addressLine1}
            onChange={(v) => onPatch("addressLine1", v)}
          />
        )}
        {fieldWrap(
          "addressLine2",
          <InputField
            label="Address Line 2"
            required
            value={form.addressLine2}
            onChange={(v) => onPatch("addressLine2", v)}
          />
        )}
        {fieldWrap(
          "addressLine3",
          <InputField
            label="Address Line 3"
            required
            value={form.addressLine3}
            onChange={(v) => onPatch("addressLine3", v)}
          />
        )}
        <InputField
          label="Address Line 4"
          value={form.addressLine4}
          onChange={(v) => onPatch("addressLine4", v)}
        />
        <GeoField
          label="Latitude"
          required
          value={form.latitude}
          onChange={(v) => onPatch("latitude", v)}
          hasError={!!errors.latitude}
        />
        <GeoField
          label="Longitude"
          required
          value={form.longitude}
          onChange={(v) => onPatch("longitude", v)}
          hasError={!!errors.longitude}
        />
        <CheckboxField
          label="Use company-level GST (no location GSTIN)"
          checked={form.usesCompanyGstin}
          onChange={(v) => {
            onPatch("usesCompanyGstin", v);
            if (v) onClearGstinError?.();
          }}
        />
        {fieldWrap(
          "gstin",
          <InputField
            label="GSTIN"
            required={!form.usesCompanyGstin}
            value={form.gstin}
            onChange={(v) => onPatch("gstin", v.toUpperCase())}
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
            onChange={(v) => onPatch("status", v)}
          />
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Module access at this location</h3>
        <div className={styles.flagsGrid}>
          <CheckboxField
            label="Purchase"
            checked={form.enablePurchase}
            onChange={(v) => onPatch("enablePurchase", v)}
          />
          <CheckboxField
            label="Sales"
            checked={form.enableSales}
            onChange={(v) => onPatch("enableSales", v)}
          />
          <CheckboxField
            label="Production"
            checked={form.enableProduction}
            onChange={(v) => onPatch("enableProduction", v)}
          />
          <CheckboxField
            label="Quality"
            checked={form.enableQuality}
            onChange={(v) => onPatch("enableQuality", v)}
          />
          <CheckboxField
            label="Maintenance"
            checked={form.enableMaintenance}
            onChange={(v) => onPatch("enableMaintenance", v)}
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
              onChange={(v) => onPatch("defaultRMStoreId", v)}
            />
            <SelectField
              label="Finished goods store"
              options={[{ value: "", label: "— None —" }, ...storeOptions]}
              value={form.defaultFGStoreId}
              onChange={(v) => onPatch("defaultFGStoreId", v)}
            />
            <SelectField
              label="Scrap store"
              options={[{ value: "", label: "— None —" }, ...storeOptions]}
              value={form.defaultScrapStoreId}
              onChange={(v) => onPatch("defaultScrapStoreId", v)}
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
                onClick={() => onRemoveContact(index)}
                aria-label={`Remove contact ${index + 1}`}
              >
                ×
              </button>
              <InputField
                label="Contact Name"
                value={contact.name}
                onChange={(v) => onPatchContact(index, "name", v)}
              />
              <InputField
                label="Mobile"
                value={contact.mobile}
                onChange={(v) => onPatchContact(index, "mobile", v)}
                inputMode="tel"
              />
              <InputField
                label="Email"
                value={contact.email}
                onChange={(v) => onPatchContact(index, "email", v)}
              />
              <InputField
                label="Designation"
                value={contact.designation}
                onChange={(v) => onPatchContact(index, "designation", v)}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
