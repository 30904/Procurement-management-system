import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import SeparatorIcon from "../../assets/seperator.svg?react";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import { appPath } from "../../config/navigation.js";
import { useToast } from "../../hooks/useToast.js";
import { useLocationScope } from "../../context/LocationScopeContext.jsx";
import {
  createInventoryStoreRequest,
  listLocationsRequest,
} from "../../services/api.js";
import {
  emptyInventoryStoreForm,
  inventoryStoreFormToCreatePayload,
  validateInventoryStoreForm,
} from "../../utils/inventoryStoreFormState.js";
import styles from "./LocationUpsertPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "configuration/inventory-stores";
const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function InventoryStoreCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { activeLocationId } = useLocationScope();
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(emptyInventoryStoreForm);
  const [snapshot, setSnapshot] = useState(emptyInventoryStoreForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    listLocationsRequest()
      .then((res) => {
        const locs = Array.isArray(res?.data) ? res.data : [];
        setLocations(
          locs.map((l) => ({ value: String(l._id), label: l.name || l.locationId }))
        );
      })
      .catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    if (activeLocationId) {
      setForm((f) => ({ ...f, locationId: activeLocationId }));
      setSnapshot((f) => ({ ...f, locationId: activeLocationId }));
    }
  }, [activeLocationId]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fieldWrap = (key, node) => (
    <div className={errors[key] ? styles.fieldError : undefined}>{node}</div>
  );

  async function handleSave() {
    if (saving) return;
    const validation = validateInventoryStoreForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await createInventoryStoreRequest(inventoryStoreFormToCreatePayload(form));
      toast.success("Inventory store created");
      navigate(appPath(LIST_PATH));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create store");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(LIST_PATH))} ariaLabel="Back to Inventory Stores" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/company-setup"))}
          >
            Company Setup
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(LIST_PATH))}>
            Inventory Stores
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">New Store</span>
        </h1>
      </header>

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <div className="sc-field-grid">
              {fieldWrap(
                "locationId",
                <SelectField
                  label="Location"
                  required
                  options={locations}
                  value={form.locationId}
                  onChange={(v) => patch("locationId", v)}
                />
              )}
              {fieldWrap(
                "storeCode",
                <InputField
                  label="Store Code"
                  required
                  value={form.storeCode}
                  onChange={(v) => patch("storeCode", v)}
                  placeholder="Enter store code"
                />
              )}
              {fieldWrap(
                "storeName",
                <InputField
                  label="Store Name"
                  required
                  value={form.storeName}
                  onChange={(v) => patch("storeName", v)}
                  placeholder="Enter store name"
                />
              )}
              {fieldWrap(
                "status",
                <SelectField
                  label="Status"
                  required
                  options={STATUS_OPTIONS}
                  value={form.status}
                  onChange={(v) => patch("status", v)}
                />
              )}
              <div className={styles.checkboxRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!!form.isDefault}
                    onChange={(e) => patch("isDefault", e.target.checked)}
                  />
                  <span>Default store for this location</span>
                </label>
              </div>
              <InputField
                label="Description"
                value={form.description}
                onChange={(v) => patch("description", v)}
                placeholder="Optional"
              />
            </div>
          </div>
          <footer className={styles.footer}>
            <div className={styles.footerLeft} />
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.btnReset}
                onClick={() => {
                  setForm(snapshot);
                  setErrors({});
                  toast.success("Form reset");
                }}
                disabled={saving}
              >
                Reset
              </button>
              <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </article>
      </section>
    </div>
  );
}
