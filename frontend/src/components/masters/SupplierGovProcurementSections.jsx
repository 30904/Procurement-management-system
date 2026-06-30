import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import {
  GOV_VENDOR_CLASSIFICATION_OPTIONS,
  GOV_VENDOR_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/supplierGovProcurementOptions.js";
import styles from "../../pages/masters/SupplierCreatePage.module.css";

export default function SupplierGovProcurementSections({
  govProcurement,
  vendorCompliance,
  vendorPerformance,
  onGovChange,
  onComplianceChange,
}) {
  const gov = govProcurement || {};
  const compliance = vendorCompliance || {};
  const performance = vendorPerformance || {};

  return (
    <>
      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Government Procurement Information</h2>
      <div className="sc-field-grid">
        <SelectField
          label="Vendor Type"
          options={GOV_VENDOR_TYPE_OPTIONS}
          value={gov.vendorType || ""}
          onChange={(v) => onGovChange("vendorType", v)}
        />
        <SelectField
          label="GeM Registered"
          options={YES_NO_OPTIONS}
          value={gov.gemRegistered || ""}
          onChange={(v) => onGovChange("gemRegistered", v)}
        />
        <InputField
          label="GeM Registration Number"
          value={gov.gemRegistrationNumber || ""}
          onChange={(v) => onGovChange("gemRegistrationNumber", v)}
          placeholder="GeM registration number"
        />
        <DateField
          label="Vendor Registration Date"
          value={gov.vendorRegistrationDate || ""}
          onChange={(v) => onGovChange("vendorRegistrationDate", v)}
        />

        <SelectField
          label="Vendor Classification"
          options={GOV_VENDOR_CLASSIFICATION_OPTIONS}
          value={gov.vendorClassification || ""}
          onChange={(v) => onGovChange("vendorClassification", v)}
        />
        <SelectField
          label="Women Owned Enterprise"
          options={YES_NO_OPTIONS}
          value={gov.womenOwnedEnterprise || ""}
          onChange={(v) => onGovChange("womenOwnedEnterprise", v)}
        />
        <SelectField
          label="Startup Registered"
          options={YES_NO_OPTIONS}
          value={gov.startupRegistered || ""}
          onChange={(v) => onGovChange("startupRegistered", v)}
        />
      </div>

      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Compliance Information</h2>
      <div className="sc-field-grid">
        <SelectField
          label="PAN Verified"
          options={YES_NO_OPTIONS}
          value={compliance.panVerified || ""}
          onChange={(v) => onComplianceChange("panVerified", v)}
        />
        <SelectField
          label="GST Verified"
          options={YES_NO_OPTIONS}
          value={compliance.gstVerified || ""}
          onChange={(v) => onComplianceChange("gstVerified", v)}
        />
        <SelectField
          label="Bank Verified"
          options={YES_NO_OPTIONS}
          value={compliance.bankVerified || ""}
          onChange={(v) => onComplianceChange("bankVerified", v)}
        />
        <DateField
          label="Last Compliance Review"
          value={compliance.lastComplianceReview || ""}
          onChange={(v) => onComplianceChange("lastComplianceReview", v)}
        />

        <DateField
          label="Review Due Date"
          value={compliance.reviewDueDate || ""}
          onChange={(v) => onComplianceChange("reviewDueDate", v)}
        />
        <InputField
          label="Approved By"
          value={compliance.approvedBy || ""}
          onChange={(v) => onComplianceChange("approvedBy", v)}
          placeholder="Approver name"
        />
        <DateField
          label="Approval Date"
          value={compliance.approvalDate || ""}
          onChange={(v) => onComplianceChange("approvalDate", v)}
        />
      </div>

      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Vendor Performance</h2>
      <div className="sc-field-grid">
        <InputField
          label="Vendor Score"
          value={String(performance.vendorScore ?? 0)}
          locked
        />
        <InputField
          label="Delivery Rating"
          value={String(performance.deliveryRating ?? 0)}
          locked
        />
        <InputField
          label="Quality Rating"
          value={String(performance.qualityRating ?? 0)}
          locked
        />
        <InputField
          label="Overall Rating"
          value={String(performance.overallRating ?? 0)}
          locked
        />
      </div>
    </>
  );
}
