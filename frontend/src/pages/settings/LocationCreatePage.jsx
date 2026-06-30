import { useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import SeparatorIcon from "../../assets/seperator.svg?react";
import LocationForm from "../../components/settings/LocationForm.jsx";
import { appPath } from "../../config/navigation.js";
import { useToast } from "../../hooks/useToast.js";
import { useLocationFormHandlers } from "../../hooks/useLocationFormHandlers.js";
import { createLocationRequest } from "../../services/api.js";
import {
  emptyLocationForm,
  locationFormToPayload,
  validateLocationForm,
} from "../../utils/locationFormState.js";
import styles from "./LocationUpsertPage.module.css";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import "../../styles/theme.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const LIST_PATH = "configuration/location-master";

export default function LocationCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
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
  } = useLocationFormHandlers(emptyLocationForm());

  const contactCount = form.contacts?.length ?? 0;

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
      const res = await createLocationRequest(locationFormToPayload(form));
      const created = res?.data;
      toast.success("Location created successfully");
      const newId = created?._id || created?.id;
      if (newId) {
        navigate(appPath(`${LIST_PATH}/${newId}/edit`), { replace: true });
      } else {
        navigate(appPath(LIST_PATH));
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create location");
    } finally {
      setSaving(false);
    }
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
          <span className="erp-breadcrumb-item">New Location</span>
        </h1>
      </header>

      <section className={styles.wrap}>
        <article className={styles.card}>
          <div className="sc-modal-bar" />
          <div className={styles.cardBody}>
            <LocationForm
              form={form}
              errors={errors}
              isEdit={false}
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
