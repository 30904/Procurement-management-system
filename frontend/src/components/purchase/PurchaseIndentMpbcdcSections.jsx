import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import {
  BUDGET_VERIFICATION_STATUS_OPTIONS,
  FUNDING_SOURCE_OPTIONS,
  PROCUREMENT_CATEGORY_OPTIONS,
  REQUISITION_APPROVAL_STATUS_OPTIONS,
  REQUISITION_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/purchaseIndentMpbcdcOptions.js";
import styles from "../../pages/purchase/PurchaseIndentForm.module.css";

function patchNested(setForm, key, field, value) {
  setForm((prev) => ({
    ...prev,
    [key]: { ...(prev[key] || {}), [field]: value },
  }));
}

function Section({ title, subtitle, children }) {
  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {subtitle ? <p className={styles.sectionSubtitle}>{subtitle}</p> : null}
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export default function PurchaseIndentMpbcdcSections({
  form,
  setForm,
  costCenterOptions = [],
  costCenterLoading = false,
}) {
  const proc = form.procurementInfo || {};
  const budget = form.budgetInfo || {};
  const gov = form.governanceInfo || {};
  const tracking = form.approvalTracking || {};

  const setProc = (field, value) => patchNested(setForm, "procurementInfo", field, value);
  const setBudget = (field, value) => patchNested(setForm, "budgetInfo", field, value);
  const setGov = (field, value) => patchNested(setForm, "governanceInfo", field, value);
  const setTracking = (field, value) => patchNested(setForm, "approvalTracking", field, value);

  return (
    <>
      <Section title="Requisition Information" subtitle="Government procurement classification">
        <div className="sc-field-grid">
          <SelectField
            label="Requisition Type"
            options={REQUISITION_TYPE_OPTIONS}
            value={proc.requisitionType || ""}
            onChange={(v) => setProc("requisitionType", v)}
            placeholder="Select type"
          />
          <SelectField
            label="Procurement Category"
            options={PROCUREMENT_CATEGORY_OPTIONS}
            value={proc.procurementCategory || ""}
            onChange={(v) => setProc("procurementCategory", v)}
            placeholder="Select category"
          />
          {costCenterOptions.length ? (
            <SelectField
              label="Cost Center"
              options={costCenterOptions}
              value={proc.costCenter || ""}
              onChange={(v) => setProc("costCenter", v)}
              disabled={costCenterLoading}
              placeholder="Select cost center"
            />
          ) : (
            <InputField
              label="Cost Center"
              value={proc.costCenter || ""}
              onChange={(v) => setProc("costCenter", v)}
              placeholder="Cost center"
            />
          )}
        </div>
      </Section>

      <Section title="Budget Information" subtitle="Funding and budget verification">
        <div className="sc-field-grid">
          <InputField
            label="Budget Head"
            value={budget.budgetHead || ""}
            onChange={(v) => setBudget("budgetHead", v)}
            placeholder="Budget head"
          />
          <InputField
            label="Estimated Procurement Value"
            type="number"
            min={0}
            step="0.01"
            value={budget.estimatedProcurementValue ?? ""}
            onChange={(v) => setBudget("estimatedProcurementValue", v)}
            placeholder="0.00"
          />
          <SelectField
            label="Budget Available"
            options={YES_NO_OPTIONS}
            value={budget.budgetAvailable || ""}
            onChange={(v) => setBudget("budgetAvailable", v)}
          />
          <SelectField
            label="Funding Source"
            options={FUNDING_SOURCE_OPTIONS}
            value={budget.fundingSource || ""}
            onChange={(v) => setBudget("fundingSource", v)}
          />
          <InputField
            label="Financial Year"
            value={budget.financialYear || ""}
            onChange={(v) => setBudget("financialYear", v)}
            placeholder="e.g. 2025-26"
          />
          <InputField
            label="Budget Reference"
            value={budget.budgetReference || ""}
            onChange={(v) => setBudget("budgetReference", v)}
            placeholder="Reference no."
          />
          <InputField
            label="Budget Remarks"
            value={budget.budgetRemarks || ""}
            onChange={(v) => setBudget("budgetRemarks", v)}
            placeholder="Optional remarks"
          />
          <SelectField
            label="Budget Verification Status"
            options={BUDGET_VERIFICATION_STATUS_OPTIONS}
            value={budget.budgetVerificationStatus || ""}
            onChange={(v) => setBudget("budgetVerificationStatus", v)}
          />
        </div>
      </Section>

      <Section title="Procurement Governance" subtitle="GeM, tender, and approval requirements">
        <div className="sc-field-grid">
          <SelectField
            label="GeM Applicable"
            options={YES_NO_OPTIONS}
            value={gov.gemApplicable || ""}
            onChange={(v) => setGov("gemApplicable", v)}
          />
          <SelectField
            label="Tender Required"
            options={YES_NO_OPTIONS}
            value={gov.tenderRequired || ""}
            onChange={(v) => setGov("tenderRequired", v)}
          />
          <SelectField
            label="Emergency Procurement"
            options={YES_NO_OPTIONS}
            value={gov.emergencyProcurement || ""}
            onChange={(v) => setGov("emergencyProcurement", v)}
          />
          <SelectField
            label="Board Approval Required"
            options={YES_NO_OPTIONS}
            value={gov.boardApprovalRequired || ""}
            onChange={(v) => setGov("boardApprovalRequired", v)}
          />
          <InputField
            label="Procurement Justification"
            value={gov.procurementJustification || ""}
            onChange={(v) => setGov("procurementJustification", v)}
            placeholder="Justification"
          />
          <InputField
            label="Special Approval Notes"
            value={gov.specialApprovalNotes || ""}
            onChange={(v) => setGov("specialApprovalNotes", v)}
            placeholder="Notes"
          />
        </div>
      </Section>

      <Section title="Approval Tracking" subtitle="Internal review status (optional)">
        <div className="sc-field-grid">
          <SelectField
            label="Approval Status"
            options={REQUISITION_APPROVAL_STATUS_OPTIONS}
            value={tracking.approvalStatus || ""}
            onChange={(v) => setTracking("approvalStatus", v)}
          />
          <InputField
            label="Approved By"
            value={tracking.approvedBy || ""}
            onChange={(v) => setTracking("approvedBy", v)}
            placeholder="Approver name"
          />
          <DateField
            label="Approval Date"
            type="date"
            value={tracking.approvalDate || ""}
            onChange={(v) => setTracking("approvalDate", v)}
          />
          <InputField
            label="Approval Remarks"
            value={tracking.approvalRemarks || ""}
            onChange={(v) => setTracking("approvalRemarks", v)}
            placeholder="Optional remarks"
          />
        </div>
      </Section>
    </>
  );
}
