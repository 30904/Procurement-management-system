import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import {
  APPROVAL_STATUS_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  PROCUREMENT_CATEGORY_OPTIONS,
  STOCK_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/mpbcdcMasterOptions.js";
import styles from "../../pages/masters/SupplierCreatePage.module.css";

export default function MpbcdcItemSections({ procurementInfo, governance, onProcurementChange, onGovernanceChange }) {
  const proc = procurementInfo || {};
  const gov = governance || {};

  return (
    <>
      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Procurement Information</h2>
      <div className="sc-field-grid">
        <SelectField
          label="Material Type"
          options={MATERIAL_TYPE_OPTIONS}
          value={proc.materialType || ""}
          onChange={(v) => onProcurementChange("materialType", v)}
        />
        <SelectField
          label="Procurement Category"
          options={PROCUREMENT_CATEGORY_OPTIONS}
          value={proc.procurementCategory || ""}
          onChange={(v) => onProcurementChange("procurementCategory", v)}
        />
        <SelectField
          label="Stock Type"
          options={STOCK_TYPE_OPTIONS}
          value={proc.stockType || ""}
          onChange={(v) => onProcurementChange("stockType", v)}
        />
        <SelectField
          label="GeM Applicable"
          options={YES_NO_OPTIONS}
          value={proc.gemApplicable || ""}
          onChange={(v) => onProcurementChange("gemApplicable", v)}
        />
      </div>

      <hr className={styles.sectionRule} />
      <h2 className={styles.sectionTitle}>Governance</h2>
      <div className="sc-field-grid">
        <SelectField
          label="Approval Status"
          options={APPROVAL_STATUS_OPTIONS}
          value={gov.approvalStatus || "Draft"}
          onChange={(v) => onGovernanceChange("approvalStatus", v)}
        />
        <InputField
          label="Approved By"
          value={gov.approvedBy || ""}
          onChange={(v) => onGovernanceChange("approvedBy", v)}
          placeholder="Approver name"
        />
        <DateField
          label="Approval Date"
          value={gov.approvalDate || ""}
          onChange={(v) => onGovernanceChange("approvalDate", v)}
        />
        <InputField
          label="Remarks"
          value={gov.remarks || ""}
          onChange={(v) => onGovernanceChange("remarks", v)}
          placeholder="Optional remarks"
        />
      </div>
    </>
  );
}
