import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import PoGenericLookupModal from "./PoGenericLookupModal.jsx";
import {
  listApprovedPurchaseIndentsRequest,
  listAssetMasterRequest,
  listSourceListMasterRequest,
  listVendorEvaluationMasterRequest,
} from "../../services/api.js";
import {
  PO_PROCUREMENT_APPROVAL_STATUS_OPTIONS,
  PO_PURCHASE_TYPE_OPTIONS,
  PROCUREMENT_CATEGORY_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/purchaseOrderMpbcdcOptions.js";
import styles from "../../pages/purchase/PurchaseIndentForm.module.css";
import fieldStyles from "../../pages/purchase/PurchaseOrderCreatePage.module.css";

function patchNested(setForm, key, field, value) {
  setForm((prev) => ({
    ...prev,
    [key]: { ...(prev[key] || {}), [field]: value },
  }));
}

function LookupField({ label, value, placeholder, onOpen, onClear }) {
  const hasValue = Boolean(String(value ?? "").trim());
  return (
    <div className={fieldStyles.fieldWithBtn}>
      <InputField label={label} value={value} placeholder={placeholder} locked />
      <div className={fieldStyles.lookupAdjuncts}>
        {hasValue ? (
          <button
            type="button"
            className={`sc-field-adjunct-btn ${fieldStyles.lookupClearBtn}`}
            aria-label={`Clear ${label}`}
            title={`Clear ${label}`}
            onClick={onClear}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        ) : null}
        <button
          type="button"
          className="sc-field-adjunct-btn"
          aria-label={`Select ${label}`}
          title={`Select ${label}`}
          onClick={onOpen}
        >
          <Search size={16} />
        </button>
      </div>
    </div>
  );
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

export default function PurchaseOrderMpbcdcSections({ form, setForm, onIndentLinked }) {
  const proc = form.procurementReference || {};
  const gov = form.governmentProcurement || {};
  const cap = form.capitalProcurement || {};
  const tracking = form.approvalTracking || {};

  const [indentRows, setIndentRows] = useState([]);
  const [sourceListRows, setSourceListRows] = useState([]);
  const [vendorEvalRows, setVendorEvalRows] = useState([]);
  const [assetRows, setAssetRows] = useState([]);

  const [indentOpen, setIndentOpen] = useState(false);
  const [sourceListOpen, setSourceListOpen] = useState(false);
  const [vendorEvalOpen, setVendorEvalOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [indentsRes, sourceRes, evalRes, assetRes] = await Promise.all([
        listApprovedPurchaseIndentsRequest().catch(() => ({ data: [] })),
        listSourceListMasterRequest().catch(() => ({ data: [] })),
        listVendorEvaluationMasterRequest().catch(() => ({ data: [] })),
        listAssetMasterRequest().catch(() => ({ data: [] })),
      ]);
      setIndentRows(Array.isArray(indentsRes?.data) ? indentsRes.data : []);
      setSourceListRows(
        (Array.isArray(sourceRes?.data) ? sourceRes.data : []).filter(
          (r) => String(r.status || "Active") === "Active"
        )
      );
      setVendorEvalRows(
        (Array.isArray(evalRes?.data) ? evalRes.data : []).filter(
          (r) => String(r.status || "Active") === "Active"
        )
      );
      setAssetRows(Array.isArray(assetRes?.data) ? assetRes.data : []);
    } catch {
      setIndentRows([]);
      setSourceListRows([]);
      setVendorEvalRows([]);
      setAssetRows([]);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const setProc = (field, value) => patchNested(setForm, "procurementReference", field, value);
  const setGov = (field, value) => patchNested(setForm, "governmentProcurement", field, value);
  const setCap = (field, value) => patchNested(setForm, "capitalProcurement", field, value);
  const setTracking = (field, value) => patchNested(setForm, "approvalTracking", field, value);

  const indentDisplay =
    (form.sourceIndentNos || []).filter(Boolean).join(", ") ||
    (form.sourceIndentIds || []).length
      ? `${(form.sourceIndentIds || []).length} requisition(s) linked`
      : "";

  return (
    <>
      <Section title="Procurement Reference" subtitle="Requisition, source list, and contract references">
        <div className="sc-field-grid">
          <div className={fieldStyles.fieldStack}>
            <LookupField
              label="Purchase Requisition"
              value={indentDisplay}
              placeholder="Select approved requisition"
              onOpen={() => setIndentOpen(true)}
              onClear={() =>
                setForm((prev) => ({
                  ...prev,
                  sourceIndentIds: [],
                  sourceIndentNos: [],
                }))
              }
            />
            <p className={styles.requisitionHint}>
              Links demand for audit. One PO = one vendor — select vendor first to auto-load matching
              materials, or use Material Purchase Planning for multi-vendor splits.
            </p>
          </div>
          <SelectField
            label="Procurement Category"
            options={PROCUREMENT_CATEGORY_OPTIONS}
            value={proc.procurementCategory || ""}
            onChange={(v) => setProc("procurementCategory", v)}
            placeholder="Select category"
          />
          <SelectField
            label="Purchase Type"
            options={PO_PURCHASE_TYPE_OPTIONS}
            value={proc.purchaseType || ""}
            onChange={(v) => setProc("purchaseType", v)}
            placeholder="Select type"
          />
          <LookupField
            label="Source List Reference"
            value={proc.sourceListLabel || proc.sourceListCode || ""}
            placeholder="Select source list"
            onOpen={() => setSourceListOpen(true)}
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                procurementReference: {
                  ...(prev.procurementReference || {}),
                  sourceListId: "",
                  sourceListCode: "",
                  sourceListLabel: "",
                },
              }))
            }
          />
          <LookupField
            label="Vendor Evaluation Reference"
            value={proc.vendorEvaluationLabel || proc.vendorEvaluationCode || ""}
            placeholder="Select vendor evaluation"
            onOpen={() => setVendorEvalOpen(true)}
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                procurementReference: {
                  ...(prev.procurementReference || {}),
                  vendorEvaluationId: "",
                  vendorEvaluationCode: "",
                  vendorEvaluationLabel: "",
                },
              }))
            }
          />
          <InputField
            label="Rate Contract Reference"
            value={proc.rateContractReference || ""}
            onChange={(v) => setProc("rateContractReference", v)}
            placeholder="Rate contract ref."
          />
          <InputField
            label="Contract Reference"
            value={proc.contractReference || ""}
            onChange={(v) => setProc("contractReference", v)}
            placeholder="Contract ref."
          />
          <InputField
            label="Budget Reference"
            value={proc.budgetReference || ""}
            onChange={(v) => setProc("budgetReference", v)}
            placeholder="Budget ref."
          />
        </div>
      </Section>

      <Section title="Government Procurement" subtitle="GeM, tender, and government approval details">
        <div className="sc-field-grid">
          <SelectField
            label="GeM Purchase"
            options={YES_NO_OPTIONS}
            value={gov.gemPurchase || ""}
            onChange={(v) => setGov("gemPurchase", v)}
          />
          <SelectField
            label="Tender Purchase"
            options={YES_NO_OPTIONS}
            value={gov.tenderPurchase || ""}
            onChange={(v) => setGov("tenderPurchase", v)}
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
            label="Tender Number"
            value={gov.tenderNumber || ""}
            onChange={(v) => setGov("tenderNumber", v)}
            placeholder="Tender no."
          />
          <InputField
            label="GeM Bid Number"
            value={gov.gemBidNumber || ""}
            onChange={(v) => setGov("gemBidNumber", v)}
            placeholder="GeM bid no."
          />
          <InputField
            label="Government Approval Number"
            value={gov.governmentApprovalNumber || ""}
            onChange={(v) => setGov("governmentApprovalNumber", v)}
            placeholder="Approval no."
          />
          <InputField
            label="Government Reference"
            value={gov.governmentReference || ""}
            onChange={(v) => setGov("governmentReference", v)}
            placeholder="Government ref."
          />
        </div>
      </Section>

      <Section
        title="Capital Procurement"
        subtitle="Optional — applicable for capital goods purchase orders"
      >
        <div className="sc-field-grid">
          <SelectField
            label="Asset Procurement"
            options={YES_NO_OPTIONS}
            value={cap.assetProcurement || ""}
            onChange={(v) => setCap("assetProcurement", v)}
          />
          <LookupField
            label="Asset Reference"
            value={cap.assetName || cap.assetCode || ""}
            placeholder="Select asset"
            onOpen={() => setAssetOpen(true)}
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                capitalProcurement: {
                  ...(prev.capitalProcurement || {}),
                  assetId: "",
                  assetCode: "",
                  assetName: "",
                },
              }))
            }
          />
          <SelectField
            label="Capitalization Required"
            options={YES_NO_OPTIONS}
            value={cap.capitalizationRequired || ""}
            onChange={(v) => setCap("capitalizationRequired", v)}
          />
          <InputField
            label="Capital Budget Code"
            value={cap.capitalBudgetCode || ""}
            onChange={(v) => setCap("capitalBudgetCode", v)}
            placeholder="Budget code"
          />
        </div>
      </Section>

      <Section title="Approval Information" subtitle="Internal procurement approval tracking (optional)">
        <div className="sc-field-grid">
          <SelectField
            label="Approval Status"
            options={PO_PROCUREMENT_APPROVAL_STATUS_OPTIONS}
            value={tracking.approvalStatus || ""}
            onChange={(v) => setTracking("approvalStatus", v)}
          />
          <InputField
            label="Approval Authority"
            value={tracking.approvalAuthority || ""}
            onChange={(v) => setTracking("approvalAuthority", v)}
            placeholder="Authority name"
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

      <PoGenericLookupModal
        open={indentOpen}
        title="Purchase Requisition"
        searchPlaceholder="Search indent no., department…"
        columns={[
          { key: "indentNo", label: "Indent No." },
          { key: "department", label: "Department" },
          { key: "requestedBy", label: "Requested By" },
        ]}
        rows={indentRows}
        selectedId={(form.sourceIndentIds || [])[0] || ""}
        onClose={() => setIndentOpen(false)}
        onApply={(row) => {
          setIndentOpen(false);
          onIndentLinked?.(row);
        }}
      />

      <PoGenericLookupModal
        open={sourceListOpen}
        title="Source List"
        searchPlaceholder="Search code, material, vendor…"
        columns={[
          { key: "sourceListCode", label: "Code" },
          { key: "itemName", label: "Material/Service" },
          { key: "supplierName", label: "Vendor" },
        ]}
        rows={sourceListRows}
        selectedId={proc.sourceListId || ""}
        onClose={() => setSourceListOpen(false)}
        onApply={(row) => {
          const id = String(row._id || row.id);
          const code = row.sourceListCode || "";
          const label = [code, row.itemName].filter(Boolean).join(" — ");
          setForm((prev) => ({
            ...prev,
            procurementReference: {
              ...(prev.procurementReference || {}),
              sourceListId: id,
              sourceListCode: code,
              sourceListLabel: label,
            },
          }));
          setSourceListOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={vendorEvalOpen}
        title="Vendor Evaluation"
        searchPlaceholder="Search evaluation code, vendor…"
        columns={[
          { key: "evaluationCode", label: "Evaluation Code" },
          { key: "supplierName", label: "Vendor" },
        ]}
        rows={vendorEvalRows}
        selectedId={proc.vendorEvaluationId || ""}
        onClose={() => setVendorEvalOpen(false)}
        onApply={(row) => {
          const id = String(row._id || row.id);
          const code = row.evaluationCode || "";
          const label = [code, row.supplierName].filter(Boolean).join(" — ");
          setForm((prev) => ({
            ...prev,
            procurementReference: {
              ...(prev.procurementReference || {}),
              vendorEvaluationId: id,
              vendorEvaluationCode: code,
              vendorEvaluationLabel: label,
            },
          }));
          setVendorEvalOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={assetOpen}
        title="Asset Master"
        searchPlaceholder="Search asset no., name…"
        columns={[
          { key: "assetNo", label: "Asset No." },
          { key: "assetName", label: "Asset Name" },
          { key: "assetCategory", label: "Category" },
        ]}
        rows={assetRows}
        selectedId={cap.assetId || ""}
        onClose={() => setAssetOpen(false)}
        onApply={(row) => {
          const id = String(row._id || row.id);
          setForm((prev) => ({
            ...prev,
            capitalProcurement: {
              ...(prev.capitalProcurement || {}),
              assetId: id,
              assetCode: row.assetNo || "",
              assetName: row.assetName || "",
            },
          }));
          setAssetOpen(false);
        }}
      />
    </>
  );
}
