import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import PoGenericLookupModal from "./PoGenericLookupModal.jsx";
import {
  listApprovedPurchaseIndentsRequest,
  listAssetMasterRequest,
  listSourceListMasterRequest,
  listUsersRequest,
  listVendorEvaluationMasterRequest,
} from "../../services/api.js";
import {
  GRN_PURCHASE_TYPE_OPTIONS,
  GRN_QC_STATUS_OPTIONS,
  GRN_RECEIPT_STATUS_OPTIONS,
  GRN_RECEIPT_TYPE_OPTIONS,
  PROCUREMENT_CATEGORY_OPTIONS,
  YES_NO_OPTIONS,
} from "../../config/goodsReceiptMpbcdcOptions.js";
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

export default function GoodsReceiptMpbcdcSections({ form, setForm, poNo = "" }) {
  const proc = form.procurementReference || {};
  const receipt = form.receiptInformation || {};
  const gov = form.governmentProcurement || {};
  const cap = form.capitalProcurement || {};
  const auth = form.receivingAuthority || {};

  const showCapital = proc.purchaseType === "Capital Goods";

  const [indentRows, setIndentRows] = useState([]);
  const [sourceListRows, setSourceListRows] = useState([]);
  const [vendorEvalRows, setVendorEvalRows] = useState([]);
  const [assetRows, setAssetRows] = useState([]);
  const [userRows, setUserRows] = useState([]);

  const [indentOpen, setIndentOpen] = useState(false);
  const [sourceListOpen, setSourceListOpen] = useState(false);
  const [vendorEvalOpen, setVendorEvalOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [receivedByOpen, setReceivedByOpen] = useState(false);
  const [verifiedByOpen, setVerifiedByOpen] = useState(false);

  const setProc = (field, value) => patchNested(setForm, "procurementReference", field, value);
  const setReceipt = (field, value) => patchNested(setForm, "receiptInformation", field, value);
  const setGov = (field, value) => patchNested(setForm, "governmentProcurement", field, value);
  const setCap = (field, value) => patchNested(setForm, "capitalProcurement", field, value);
  const setAuth = (field, value) => patchNested(setForm, "receivingAuthority", field, value);

  const loadLookups = useCallback(async () => {
    try {
      const [indentsRes, sourceRes, evalRes, assetRes, usersRes] = await Promise.all([
        listApprovedPurchaseIndentsRequest().catch(() => ({ data: [] })),
        listSourceListMasterRequest().catch(() => ({ data: [] })),
        listVendorEvaluationMasterRequest().catch(() => ({ data: [] })),
        listAssetMasterRequest().catch(() => ({ data: [] })),
        listUsersRequest().catch(() => ({ data: [] })),
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
      setAssetRows(
        (Array.isArray(assetRes?.data) ? assetRes.data : []).filter(
          (r) => String(r.status || "Active") === "Active"
        )
      );
      setUserRows(Array.isArray(usersRes?.data) ? usersRes.data : []);
    } catch {
      /* optional lookups */
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const indentDisplayRows = useMemo(
    () =>
      indentRows.map((row) => ({
        ...row,
        id: String(row._id || row.id),
        indentNo: row.indentNo || "",
        department: row.department || row.procurementInfo?.costCenter || "",
      })),
    [indentRows]
  );

  const userDisplayRows = useMemo(
    () =>
      userRows.map((row) => ({
        ...row,
        id: String(row._id || row.id),
        displayName: row.name || row.fullName || row.username || row.email || "",
        email: row.email || "",
      })),
    [userRows]
  );

  return (
    <>
      <Section title="Procurement Reference" subtitle="Requisition and contract references">
        <div className="sc-field-grid">
          <LookupField
            label="Purchase Requisition"
            value={proc.purchaseRequisitionNo}
            placeholder="Select requisition"
            onOpen={() => setIndentOpen(true)}
            onClear={() => {
              setProc("purchaseRequisitionId", "");
              setProc("purchaseRequisitionNo", "");
            }}
          />
          <SelectField
            label="Procurement Category"
            options={PROCUREMENT_CATEGORY_OPTIONS}
            value={proc.procurementCategory || ""}
            onChange={(v) => setProc("procurementCategory", v)}
            placeholder="Select category"
          />
          <SelectField
            label="Purchase Type"
            options={GRN_PURCHASE_TYPE_OPTIONS}
            value={proc.purchaseType || ""}
            onChange={(v) => setProc("purchaseType", v)}
            placeholder="Select type"
          />
          <InputField label="Purchase Order Reference" value={poNo || form.poNo || ""} locked />
        </div>
        <div className="sc-field-grid">
          <LookupField
            label="Source List Reference"
            value={proc.sourceListLabel || proc.sourceListCode}
            placeholder="Select source list"
            onOpen={() => setSourceListOpen(true)}
            onClear={() => {
              setProc("sourceListId", "");
              setProc("sourceListCode", "");
              setProc("sourceListLabel", "");
            }}
          />
          <LookupField
            label="Vendor Evaluation Reference"
            value={proc.vendorEvaluationLabel || proc.vendorEvaluationCode}
            placeholder="Select evaluation"
            onOpen={() => setVendorEvalOpen(true)}
            onClear={() => {
              setProc("vendorEvaluationId", "");
              setProc("vendorEvaluationCode", "");
              setProc("vendorEvaluationLabel", "");
            }}
          />
          <InputField
            label="Contract Reference"
            value={proc.contractReference || ""}
            onChange={(v) => setProc("contractReference", v)}
            placeholder="Contract reference"
          />
          <InputField
            label="Budget Reference"
            value={proc.budgetReference || ""}
            onChange={(v) => setProc("budgetReference", v)}
            placeholder="Budget reference"
          />
        </div>
      </Section>

      <Section title="Receipt Information" subtitle="Inspection and quantity summary">
        <div className="sc-field-grid">
          <SelectField
            label="Receipt Type"
            options={GRN_RECEIPT_TYPE_OPTIONS}
            value={receipt.receiptType || ""}
            onChange={(v) => setReceipt("receiptType", v)}
            placeholder="Select type"
          />
          <SelectField
            label="Receipt Status"
            options={GRN_RECEIPT_STATUS_OPTIONS}
            value={receipt.receiptStatus || ""}
            onChange={(v) => setReceipt("receiptStatus", v)}
            placeholder="Select status"
          />
          <SelectField
            label="Inspection Required"
            options={YES_NO_OPTIONS}
            value={receipt.inspectionRequired || ""}
            onChange={(v) => setReceipt("inspectionRequired", v)}
          />
          <SelectField
            label="QC Status"
            options={GRN_QC_STATUS_OPTIONS}
            value={receipt.qcStatus || ""}
            onChange={(v) => setReceipt("qcStatus", v)}
            placeholder="Select QC status"
          />
        </div>
        <div className="sc-field-grid">
          <InputField
            label="Accepted Quantity"
            type="number"
            min={0}
            value={receipt.acceptedQuantity ?? ""}
            locked
            placeholder="Auto-calculated"
          />
          <InputField
            label="Rejected Quantity"
            type="number"
            min={0}
            value={receipt.rejectedQuantity ?? ""}
            onChange={(v) => setReceipt("rejectedQuantity", v)}
            placeholder="0"
          />
          <InputField
            label="Short Quantity"
            type="number"
            min={0}
            value={receipt.shortQuantity ?? ""}
            locked
            placeholder="Auto-calculated"
          />
          <InputField
            label="Excess Quantity"
            type="number"
            min={0}
            value={receipt.excessQuantity ?? ""}
            locked
            placeholder="Auto-calculated"
          />
        </div>
      </Section>

      <Section title="Government Procurement" subtitle="GeM, tender, and inspection details">
        <div className="sc-field-grid">
          <SelectField
            label="GeM Procurement"
            options={YES_NO_OPTIONS}
            value={gov.gemProcurement || ""}
            onChange={(v) => setGov("gemProcurement", v)}
          />
          <SelectField
            label="Tender Procurement"
            options={YES_NO_OPTIONS}
            value={gov.tenderProcurement || ""}
            onChange={(v) => setGov("tenderProcurement", v)}
          />
          <SelectField
            label="Inspection Certificate Available"
            options={YES_NO_OPTIONS}
            value={gov.inspectionCertificateAvailable || ""}
            onChange={(v) => setGov("inspectionCertificateAvailable", v)}
          />
          <SelectField
            label="Government Inspection Required"
            options={YES_NO_OPTIONS}
            value={gov.governmentInspectionRequired || ""}
            onChange={(v) => setGov("governmentInspectionRequired", v)}
          />
        </div>
        <div className="sc-field-grid">
          <InputField
            label="Inspection Certificate Number"
            value={gov.inspectionCertificateNumber || ""}
            onChange={(v) => setGov("inspectionCertificateNumber", v)}
            placeholder="Certificate number"
          />
          <InputField
            label="Inspection Agency"
            value={gov.inspectionAgency || ""}
            onChange={(v) => setGov("inspectionAgency", v)}
            placeholder="Agency name"
          />
          <DateField
            label="Inspection Date"
            value={gov.inspectionDate || ""}
            onChange={(v) => setGov("inspectionDate", v)}
          />
          <InputField
            label="Government Remarks"
            value={gov.governmentRemarks || ""}
            onChange={(v) => setGov("governmentRemarks", v)}
            placeholder="Remarks"
          />
        </div>
      </Section>

      {showCapital ? (
        <Section title="Capital Goods" subtitle="Asset creation and capitalization">
          <div className="sc-field-grid">
            <SelectField
              label="Asset Creation Required"
              options={YES_NO_OPTIONS}
              value={cap.assetCreationRequired || ""}
              onChange={(v) => setCap("assetCreationRequired", v)}
            />
            <LookupField
              label="Asset Reference"
              value={cap.assetName || cap.assetCode}
              placeholder="Select asset"
              onOpen={() => setAssetOpen(true)}
              onClear={() => {
                setCap("assetId", "");
                setCap("assetCode", "");
                setCap("assetName", "");
              }}
            />
            <SelectField
              label="Capitalization Pending"
              options={YES_NO_OPTIONS}
              value={cap.capitalizationPending || ""}
              onChange={(v) => setCap("capitalizationPending", v)}
            />
            <InputField
              label="Asset Tag Number"
              value={cap.assetTagNumber || ""}
              onChange={(v) => setCap("assetTagNumber", v)}
              placeholder="Tag number"
            />
          </div>
        </Section>
      ) : null}

      <Section title="Receiving Authority" subtitle="Receipt verification details">
        <div className="sc-field-grid">
          <LookupField
            label="Received By"
            value={auth.receivedByName}
            placeholder="Select user"
            onOpen={() => setReceivedByOpen(true)}
            onClear={() => {
              setAuth("receivedById", "");
              setAuth("receivedByName", "");
            }}
          />
          <LookupField
            label="Verified By"
            value={auth.verifiedByName}
            placeholder="Select user"
            onOpen={() => setVerifiedByOpen(true)}
            onClear={() => {
              setAuth("verifiedById", "");
              setAuth("verifiedByName", "");
            }}
          />
          <DateField
            label="Verified Date"
            value={auth.verifiedDate || ""}
            onChange={(v) => setAuth("verifiedDate", v)}
          />
          <InputField
            label="Receiving Remarks"
            value={auth.receivingRemarks || ""}
            onChange={(v) => setAuth("receivingRemarks", v)}
            placeholder="Receiving remarks"
          />
        </div>
      </Section>

      <PoGenericLookupModal
        open={indentOpen}
        title="Purchase Requisition"
        searchPlaceholder="Search requisition no…"
        columns={[
          { key: "indentNo", label: "Requisition No" },
          { key: "department", label: "Department" },
        ]}
        rows={indentDisplayRows}
        selectedId={proc.purchaseRequisitionId}
        onClose={() => setIndentOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setProc("purchaseRequisitionId", String(row._id || row.id));
          setProc("purchaseRequisitionNo", row.indentNo || "");
          setIndentOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={sourceListOpen}
        title="Source List Reference"
        searchPlaceholder="Search source list…"
        columns={[
          { key: "sourceListCode", label: "Code" },
          { key: "sourceListName", label: "Name" },
        ]}
        rows={sourceListRows.map((row) => ({
          ...row,
          id: String(row._id || row.id),
          sourceListCode: row.sourceListCode || row.code || "",
          sourceListName: row.sourceListName || row.name || "",
        }))}
        selectedId={proc.sourceListId}
        onClose={() => setSourceListOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setProc("sourceListId", String(row._id || row.id));
          setProc("sourceListCode", row.sourceListCode || row.code || "");
          setProc("sourceListLabel", row.sourceListName || row.name || "");
          setSourceListOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={vendorEvalOpen}
        title="Vendor Evaluation Reference"
        searchPlaceholder="Search evaluation…"
        columns={[
          { key: "evaluationCode", label: "Code" },
          { key: "vendorName", label: "Vendor" },
        ]}
        rows={vendorEvalRows.map((row) => ({
          ...row,
          id: String(row._id || row.id),
          evaluationCode: row.evaluationCode || row.code || "",
          vendorName: row.vendorName || row.supplierName || "",
        }))}
        selectedId={proc.vendorEvaluationId}
        onClose={() => setVendorEvalOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setProc("vendorEvaluationId", String(row._id || row.id));
          setProc("vendorEvaluationCode", row.evaluationCode || row.code || "");
          setProc("vendorEvaluationLabel", row.vendorName || row.supplierName || "");
          setVendorEvalOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={assetOpen}
        title="Asset Master"
        searchPlaceholder="Search asset…"
        columns={[
          { key: "assetCode", label: "Code" },
          { key: "assetName", label: "Name" },
        ]}
        rows={assetRows.map((row) => ({
          ...row,
          id: String(row._id || row.id),
          assetCode: row.assetCode || row.code || "",
          assetName: row.assetName || row.name || "",
        }))}
        selectedId={cap.assetId}
        onClose={() => setAssetOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setCap("assetId", String(row._id || row.id));
          setCap("assetCode", row.assetCode || row.code || "");
          setCap("assetName", row.assetName || row.name || "");
          setAssetOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={receivedByOpen}
        title="Received By"
        searchPlaceholder="Search user…"
        columns={[
          { key: "displayName", label: "Name" },
          { key: "email", label: "Email" },
        ]}
        rows={userDisplayRows}
        selectedId={auth.receivedById}
        onClose={() => setReceivedByOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setAuth("receivedById", String(row._id || row.id));
          setAuth("receivedByName", row.displayName || row.name || "");
          setReceivedByOpen(false);
        }}
      />

      <PoGenericLookupModal
        open={verifiedByOpen}
        title="Verified By"
        searchPlaceholder="Search user…"
        columns={[
          { key: "displayName", label: "Name" },
          { key: "email", label: "Email" },
        ]}
        rows={userDisplayRows}
        selectedId={auth.verifiedById}
        onClose={() => setVerifiedByOpen(false)}
        onApply={(row) => {
          if (!row) return;
          setAuth("verifiedById", String(row._id || row.id));
          setAuth("verifiedByName", row.displayName || row.name || "");
          setVerifiedByOpen(false);
        }}
      />
    </>
  );
}
