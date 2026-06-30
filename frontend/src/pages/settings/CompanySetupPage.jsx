import { useCallback, useEffect, useState } from "react";
import ErpBackButton from "../../components/common/ErpBackButton.jsx";

import { Navigate, useNavigate } from "react-router-dom";
import { appPath } from "../../config/navigation.js";
import { usePermissions } from "../../context/PermissionsContext.jsx";
import {
  getCurrentCompanyRequest,
  updateCurrentCompanyRequest,
} from "../../services/api.js";
import {
  companyDocToForm,
  companyFormToPayload,
  emptyCompanyForm,
  validateCompanyForm,
} from "../../utils/companyFormState.js";
import {
  CONSTITUTION_OPTIONS,
  GST_CLASSIFICATION_OPTIONS,
  INDUSTRY_TYPE_OPTIONS,
  MSME_OPTIONS,
  NATURE_OF_BUSINESS_OPTIONS,
  STATUS_OPTIONS,
} from "../../config/companyFormOptions.js";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import DateField from "../../components/subcomponents/DateField.jsx";
import layoutStyles from "../../styles/page-toolbar.module.css";
import masterStyles from "../masters/SupplierCreatePage.module.css";
import pageStyles from "./CompanySetupPage.module.css";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/subcomponents.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/erp-layout.css";

export default function CompanySetupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isSuperAdmin, loading: permsLoading, refreshPermissions, checkPermission } =
    usePermissions();
  const [form, setForm] = useState(emptyCompanyForm);
  const [snapshot, setSnapshot] = useState(emptyCompanyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const canAccess = isSuperAdmin || checkPermission("company_setup").enabled;

  const loadCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrentCompanyRequest();
      const next = companyDocToForm(res?.data);
      setForm(next);
      setSnapshot(next);
      setErrors({});
    } catch (err) {
      toast.error(err?.message || "Failed to load company details");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (canAccess) loadCompany();
  }, [canAccess, loadCompany]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleReset = () => {
    setForm(snapshot);
    setErrors({});
    toast.success("Form reset to last saved values");
  };

  const handleSave = async () => {
    const validation = validateCompanyForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await updateCurrentCompanyRequest(companyFormToPayload(form));
      const next = companyDocToForm(res?.data);
      setForm(next);
      setSnapshot(next);
      setErrors({});
      toast.success(res?.message || "Company details saved");
      if (refreshPermissions) await refreshPermissions();
    } catch (err) {
      toast.error(err?.message || "Failed to save company details");
    } finally {
      setSaving(false);
    }
  };

  if (!permsLoading && !canAccess) {
    return <Navigate to={appPath("configuration")} replace />;
  }

  if (permsLoading) return null;

  const fieldClass = (key) => (errors[key] ? pageStyles.fieldError : "");

  return (
    <div className={`erp-page ${layoutStyles.page}`}>
      <header className={layoutStyles.toolbar}>
        <ErpBackButton onClick={() => navigate(appPath("configuration"))} ariaLabel="Back to Settings" />
        <h1 className="erp-breadcrumb erp-breadcrumb--page-title">
          <span className="erp-breadcrumb-item">Company</span>
        </h1>
      </header>

      <section className={`${masterStyles.wrap} ${pageStyles.wrap}`}>
        <article className={masterStyles.card}>
          <div className="sc-modal-bar" />

          {loading ? (
            <div className={pageStyles.loadingWrap}>Loading company details…</div>
          ) : (
            <>
              <div className={`${masterStyles.cardBody} ${pageStyles.cardBody}`}>
                <p className={pageStyles.infoNote}>
                  GST Classification applies at the company level. Location-specific GSTIN, head office flag,
                  default inventory stores, and module access per site are configured in{" "}
                  <strong>Location Master</strong> under Company Setup.
                </p>

                <div className="sc-field-grid">
                  <div className={fieldClass("registrationNo")}>
                    <InputField
                      label="Registration No."
                      required
                      value={form.registrationNo}
                      onChange={(v) => patch("registrationNo", v)}
                      placeholder="Enter Registration No."
                    />
                  </div>
                  <div className={fieldClass("registrationDate")}>
                    <DateField
                      label="Registration Date"
                      required
                      type="date"
                      value={form.registrationDate}
                      onChange={(v) => patch("registrationDate", v)}
                    />
                  </div>
                  <div className={fieldClass("companyName")}>
                    <InputField
                      label="Company Legal Name"
                      required
                      value={form.companyName}
                      onChange={(v) => patch("companyName", v)}
                      placeholder="Enter legal entity name"
                    />
                  </div>
                  <div>
                    <InputField
                      label="Company Nick Name"
                      value={form.displayName}
                      onChange={(v) => patch("displayName", v)}
                      placeholder="Short display name"
                    />
                  </div>

                  <div className={fieldClass("constitutionOfBusiness")}>
                    <SelectField
                      label="Constitution of Business"
                      required
                      options={CONSTITUTION_OPTIONS}
                      value={form.constitutionOfBusiness}
                      onChange={(v) => patch("constitutionOfBusiness", v)}
                    />
                  </div>
                  <div className={fieldClass("corporateIdentificationNo")}>
                    <InputField
                      label="Corporate Identification No."
                      required
                      value={form.corporateIdentificationNo}
                      onChange={(v) => patch("corporateIdentificationNo", v)}
                      placeholder="CIN"
                    />
                  </div>
                  <div className={fieldClass("dateOfIncorporation")}>
                    <DateField
                      label="Date of Incorporation"
                      required
                      type="date"
                      value={form.dateOfIncorporation}
                      onChange={(v) => patch("dateOfIncorporation", v)}
                    />
                  </div>
                  <div>
                    <SelectField
                      label="Nature of Business"
                      options={NATURE_OF_BUSINESS_OPTIONS}
                      value={form.natureOfBusiness}
                      onChange={(v) => patch("natureOfBusiness", v)}
                    />
                  </div>

                  <div className={fieldClass("typeOfIndustry")}>
                    <SelectField
                      label="Type of Industry"
                      required
                      options={INDUSTRY_TYPE_OPTIONS}
                      value={form.typeOfIndustry}
                      onChange={(v) => patch("typeOfIndustry", v)}
                    />
                  </div>
                  <div className={fieldClass("companyPan")}>
                    <InputField
                      label="Company PAN"
                      required
                      value={form.companyPan}
                      onChange={(v) => patch("companyPan", v)}
                      placeholder="PAN"
                    />
                  </div>
                  <div>
                    <InputField
                      label="TAN (Tax Deduction & Collection)"
                      value={form.tan}
                      onChange={(v) => patch("tan", v)}
                      placeholder="TAN"
                    />
                  </div>
                  <div>
                    <SelectField
                      label="MSME Classification"
                      options={MSME_OPTIONS}
                      value={form.msmeClassification}
                      onChange={(v) => patch("msmeClassification", v)}
                    />
                  </div>

                  <div>
                    <InputField
                      label="Udyam Registration No."
                      value={form.udyamRegistrationNo}
                      onChange={(v) => patch("udyamRegistrationNo", v)}
                      placeholder="Udyam no."
                    />
                  </div>
                  <div className={fieldClass("gstClassification")}>
                    <SelectField
                      label="GST Classification"
                      required
                      options={GST_CLASSIFICATION_OPTIONS}
                      value={form.gstClassification}
                      onChange={(v) => patch("gstClassification", v)}
                    />
                  </div>
                  <div>
                    <InputField
                      label="No. of Locations Served"
                      value={form.locationsServedCount}
                      onChange={(v) => patch("locationsServedCount", v.replace(/\D/g, ""))}
                      placeholder="Enter no. of locations served"
                      inputMode="numeric"
                    />
                  </div>
                  <div className={fieldClass("status")}>
                    <SelectField
                      label="Status"
                      required
                      options={STATUS_OPTIONS}
                      value={form.status}
                      onChange={(v) => patch("status", v)}
                    />
                  </div>
                </div>
              </div>

              <footer className={masterStyles.footer}>
                <div className={masterStyles.footerRight}>
                  <button
                    type="button"
                    className={masterStyles.btnAux}
                    onClick={handleReset}
                    disabled={saving || loading}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className={masterStyles.btnSave}
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </footer>
            </>
          )}
        </article>
      </section>
    </div>
  );
}
