import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import StatusField from "../subcomponents/StatusField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import { getNextPaymentTermsCodeRequest } from "../../services/api.js";
import {
  APPROVAL_STATUS_OPTIONS,
  EMPTY_PAYMENT_TERMS_MPBCDC,
  YES_NO_OPTIONS,
} from "../../config/mpbcdcMasterOptions.js";
import "../../styles/subcomponents.css";

function formatDateForInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function mapMpbcdcPaymentTerms(initialData) {
  const p = initialData?.mpbcdcPaymentTerms || {};
  return {
    approvalStatus: p.approvalStatus ?? "Draft",
    activeFrom: formatDateForInput(p.activeFrom),
    activeTo: formatDateForInput(p.activeTo),
    governmentApproved: p.governmentApproved ?? "",
  };
}

const STATUS_OPTS = ["Active", "Inactive"];

function createInitialForm(initialData, defaults = {}) {
  if (initialData) {
    return {
      paymentTermsCode: initialData.paymentTermsCode ?? "",
      order: String(initialData.order ?? initialData.displayOrder ?? 0),
      description: initialData.description ?? "",
      revNumber: initialData.revNumber ?? 0,
      status: initialData.status || "Active",
      mpbcdcPaymentTerms: mapMpbcdcPaymentTerms(initialData),
    };
  }
  return {
    paymentTermsCode: defaults.paymentTermsCode ?? "",
    order: String(defaults.order ?? ""),
    description: "",
    revNumber: 0,
    status: "Active",
    mpbcdcPaymentTerms: { ...EMPTY_PAYMENT_TERMS_MPBCDC },
  };
}

function buildDevFillForm(code = "PTS9999") {
  return {
    paymentTermsCode: code,
    order: "99",
    description: "Dev Test — Sample Payment Term",
    revNumber: 0,
    status: "Active",
    mpbcdcPaymentTerms: { ...EMPTY_PAYMENT_TERMS_MPBCDC },
  };
}

export default function PaymentTermsMasterModal({
  onClose,
  onSave,
  initialData,
  suggestedOrder = "",
}) {
  const toast = useToast();
  const isCreate = !initialData;
  const [form, setForm] = useState(() =>
    createInitialForm(initialData, {
      paymentTermsCode: "",
      order: suggestedOrder,
    })
  );
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setMpbcdc = (key, value) =>
    setForm((prev) => ({
      ...prev,
      mpbcdcPaymentTerms: { ...(prev.mpbcdcPaymentTerms || EMPTY_PAYMENT_TERMS_MPBCDC), [key]: value },
    }));

  useEffect(() => {
    if (!isCreate) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getNextPaymentTermsCodeRequest();
        if (cancelled) return;
        const code = res?.data?.paymentTermsCode ?? "";
        setForm((prev) => ({
          ...prev,
          paymentTermsCode: code || prev.paymentTermsCode,
          order: suggestedOrder !== "" ? String(suggestedOrder) : prev.order,
        }));
      } catch {
        /* keep empty defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCreate, suggestedOrder]);

  const handleReset = useCallback(() => {
    if (isCreate) {
      setForm(createInitialForm(null, { order: suggestedOrder }));
      getNextPaymentTermsCodeRequest()
        .then((res) => {
          const code = res?.data?.paymentTermsCode ?? "";
          setForm((prev) => ({ ...createInitialForm(null, { order: suggestedOrder }), paymentTermsCode: code }));
        })
        .catch(() => {});
    } else {
      setForm(createInitialForm(initialData));
    }
    toast.info("Form reset.");
  }, [isCreate, initialData, suggestedOrder, toast]);

  const fillDevData = useCallback(() => {
    setForm(buildDevFillForm(form.paymentTermsCode || "PTS9999"));
    toast.info("Sample data filled (Alt+F1). Click Save to create.");
  }, [toast, form.paymentTermsCode]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  async function handleSave() {
    if (saving) return;
    if (!form.paymentTermsCode.trim()) {
      toast.error("Payment Terms Code is required.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Payment Terms Description is required.");
      return;
    }
    const orderNum = Number(form.order);
    if (form.order === "" || Number.isNaN(orderNum) || orderNum < 0) {
      toast.error("Order must be a non-negative number.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave?.({
        paymentTermsCode: form.paymentTermsCode.trim().toUpperCase(),
        order: orderNum,
        description: form.description.trim(),
        revNumber: form.revNumber ?? 0,
        status: form.status,
        mpbcdcPaymentTerms: {
          approvalStatus: form.mpbcdcPaymentTerms?.approvalStatus || "Draft",
          activeFrom: form.mpbcdcPaymentTerms?.activeFrom || undefined,
          activeTo: form.mpbcdcPaymentTerms?.activeTo || undefined,
          governmentApproved: form.mpbcdcPaymentTerms?.governmentApproved || "",
        },
      });
      if (result?.deferred) return;
      toast.success(
        isCreate ? "Payment Terms record created." : "Payment Terms record updated."
      );
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save Payment Terms record");
    } finally {
      setSaving(false);
    }
  }

  const title = isCreate ? "Payment Terms (Create)" : "Payment Terms (Edit)";

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div
        ref={modalRef}
        className="sc-modal"
        style={{ ...modalStyle, width: "72vw", minWidth: "720px", maxWidth: "980px" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-terms-modal-title"
      >
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span id="payment-terms-modal-title" className="sc-modal-title">
            {title}
          </span>
          <button type="button" className="sc-modal-close" onClick={() => onClose()} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body" style={{ padding: "2.2vh 1.5vw 1.6vh" }}>
          <div className="sc-field-grid">
            <InputField
              label="Payment Terms Code"
              required
              placeholder="PTS0001"
              value={form.paymentTermsCode}
              onChange={(v) => set("paymentTermsCode", v.toUpperCase())}
              locked={!isCreate}
            />
            <InputField
              label="Order"
              required
              placeholder="1"
              value={form.order}
              onChange={(v) => set("order", v)}
              inputMode="numeric"
            />
            <InputField
              label="Payment Terms Description"
              required
              placeholder="Enter description"
              value={form.description}
              onChange={(v) => set("description", v)}
            />
            <StatusField
              label="Status"
              required
              options={STATUS_OPTS}
              value={form.status}
              onChange={(v) => set("status", v)}
            />
            <SelectField
              label="Approval Status"
              options={APPROVAL_STATUS_OPTIONS}
              value={form.mpbcdcPaymentTerms?.approvalStatus || "Draft"}
              onChange={(v) => setMpbcdc("approvalStatus", v)}
            />
            <DateField
              label="Active From"
              value={form.mpbcdcPaymentTerms?.activeFrom || ""}
              onChange={(v) => setMpbcdc("activeFrom", v)}
            />
            <DateField
              label="Active To"
              value={form.mpbcdcPaymentTerms?.activeTo || ""}
              onChange={(v) => setMpbcdc("activeTo", v)}
            />
            <SelectField
              label="Government Approved"
              options={YES_NO_OPTIONS}
              value={form.mpbcdcPaymentTerms?.governmentApproved || ""}
              onChange={(v) => setMpbcdc("governmentApproved", v)}
            />
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onSave={handleSave}
          onReset={handleReset}
          showReset
          saving={saving}
          showDevHint={isCreate}
        />
      </div>
    </div>,
    document.body
  );
}
