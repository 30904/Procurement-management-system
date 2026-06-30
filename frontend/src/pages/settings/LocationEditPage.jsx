import { useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import LocationForm from "../../components/settings/LocationForm.jsx";
import { appPath } from "../../config/navigation.js";
import { useToast } from "../../hooks/useToast.js";
import { useLocationFormHandlers } from "../../hooks/useLocationFormHandlers.js";
import {
  getLocationByIdRequest,
  listStoresByLocationRequest,
  updateLocationRequest,
} from "../../services/api.js";
import {
  emptyLocationForm,
  locationDocToForm,
  locationFormToPayload,
  validateLocationForm,
} from "../../utils/locationFormState.js";
import styles from "./LocationUpsertPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "configuration/location-master";

export default function LocationEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeOptions, setStoreOptions] = useState([]);
  const [locationLabel, setLocationLabel] = useState("");

  const {
    form,
    errors,
    setErrors,
    patch,
    patchContact,
    addContact,
    removeContact,
    clearGstinError,
    resetForm,
    replaceForm,
  } = useLocationFormHandlers(emptyLocationForm());

  const contactCount = form.contacts?.length ?? 0;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [locRes, storesRes] = await Promise.all([
          getLocationByIdRequest(id),
          listStoresByLocationRequest(id),
        ]);
        if (cancelled) return;
        const doc = locRes?.data;
        if (!doc) throw new Error("Location not found");
        const next = locationDocToForm(doc);
        replaceForm(next);
        setLocationLabel(doc.locationId || doc.name || "Location");

        const stores = Array.isArray(storesRes?.data) ? storesRes.data : [];
        setStoreOptions(
          stores.map((s) => ({
            value: String(s._id || s.id),
            label: [s.storeCode, s.storeName].filter(Boolean).join(" – ") || String(s._id),
          }))
        );
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.data?.message || err?.message || "Failed to load location");
          navigate(appPath(LIST_PATH), { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, replaceForm, toast]);

  async function handleSave() {
    if (saving) return;
    const validation = validateLocationForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await updateLocationRequest(id, locationFormToPayload(form));
      toast.success("Location updated successfully");
      navigate(appPath(LIST_PATH));
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update location");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <p className={styles.loading}>Loading location…</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page}`}>
      <header className={toolbarStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath(LIST_PATH))} ariaLabel="Back to Location Master" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span
            className="erp-breadcrumb-link"
            onClick={() => navigate(appPath("configuration/company-setup"))}
          >
            Company Setup
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-link" onClick={() => navigate(appPath(LIST_PATH))}>
            Location Master
          </span>
          <SeparatorIcon className="erp-breadcrumb-sep" />
          <span className="erp-breadcrumb-item">Edit — {locationLabel}</span>
        </h1>
      </header>

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <LocationForm
              form={form}
              errors={errors}
              isEdit
              storeOptions={storeOptions}
              onPatch={patch}
              onPatchContact={patchContact}
              onRemoveContact={removeContact}
              onClearGstinError={clearGstinError}
            />
          </div>
          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <button type="button" className={styles.btnAux} onClick={addContact} disabled={saving}>
                <Plus size={16} strokeWidth={2.5} aria-hidden />
                Contact Details
                {contactCount > 0 ? <span className={styles.badge}>{contactCount}</span> : null}
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.btnReset}
                onClick={() => {
                  resetForm();
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
