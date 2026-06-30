import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import ModalFooterActions from "../modals/ModalFooterActions.jsx";
import PoShipToLocationLookupModal from "./PoShipToLocationLookupModal.jsx";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useToast } from "../../hooks/useToast.js";
import { defaultPoValidityDate } from "../../utils/purchaseOrderFormState.js";
import styles from "./PoModal.module.css";
import "../../styles/subcomponents.css";

const VALUE_FIELDS = [
  { key: "netGoodsValue", label: "Net Goods/Service Value" },
  { key: "totalIncidental", label: "Total Incidental Expenses" },
  { key: "totalPoValue", label: "Total Purchase Order Value" },
];

function MoneyRow({ label, value, currency, locked = true }) {
  return (
    <div className={styles.arrowRow}>
      <span className={styles.arrowLabel}>{label}</span>
      <span className={styles.arrow}>→</span>
      <div className={styles.currencyField}>
        <span className={styles.currencyPrefix}>{currency}</span>
        <InputField value={String(value ?? "0.00")} locked={locked} hideLabel />
      </div>
    </div>
  );
}

function TermsRow({ label, required, children }) {
  return (
    <div className={styles.arrowRow}>
      <span className={`${styles.arrowLabel}${required ? " sc-label-required" : ""}`}>{label}</span>
      <span className={styles.arrow}>→</span>
      <div className={styles.termsControl}>{children}</div>
    </div>
  );
}

function resolveDefaultOption(options, current) {
  if (current && options.some((o) => o.value === current)) return current;
  return options[0]?.value ?? "";
}

export default function PoValueTermsModal({
  open,
  poValue,
  poTerms,
  currency = "INR",
  locationRows = [],
  defaultLocationId = "",
  transportModeOptions = [],
  freightTermsOptions = [],
  transporterOptions = [],
  paymentTermsOptions = [],
  onClose,
  onSave,
  initialTab = "value",
}) {
  const [tab, setTab] = useState(initialTab);
  const [value, setValue] = useState({});
  const [terms, setTerms] = useState({});
  const [shipToOpen, setShipToOpen] = useState(false);
  const toast = useToast();
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const defaultShipTo = useMemo(() => {
    const match =
      locationRows.find((row) => String(row._id || row.id) === String(defaultLocationId)) ||
      locationRows.find((row) => row.isActive !== false);
    if (!match) return { id: "", label: "" };
    return {
      id: String(match._id || match.id),
      label: match.locationId || match.name || "",
    };
  }, [locationRows, defaultLocationId]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setValue({ ...(poValue || {}) });
    setTerms({
      shipToLocation: poTerms?.shipToLocation || defaultShipTo.label || "",
      shipToLocationId: poTerms?.shipToLocationId || defaultShipTo.id || "",
      modeOfTransport: resolveDefaultOption(transportModeOptions, poTerms?.modeOfTransport),
      freightTerms: resolveDefaultOption(freightTermsOptions, poTerms?.freightTerms),
      transporterName: poTerms?.transporterName || "",
      paymentTerms: resolveDefaultOption(paymentTermsOptions, poTerms?.paymentTerms),
      poValidity: poTerms?.poValidity || defaultPoValidityDate(),
      poRemarks: poTerms?.poRemarks || "",
    });
  }, [
    open,
    poValue,
    poTerms,
    initialTab,
    defaultShipTo,
    transportModeOptions,
    freightTermsOptions,
    paymentTermsOptions,
  ]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="sc-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
        style={overlayStyle}
      >
        <div
          ref={modalRef}
          className="sc-modal"
          style={{ ...modalStyle, width: "36vw", minWidth: 400, maxWidth: 520 }}
        >
          <div className="sc-modal-bar" />
          <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
            <span className="sc-modal-title">{tab === "value" ? "PO Value" : "PO Terms"}</span>
            <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
              <img src={CloseBtnIcon} alt="" />
            </button>
          </div>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab}${tab === "value" ? ` ${styles.tabActive}` : ""}`}
              onClick={() => setTab("value")}
            >
              PO Value
            </button>
            <button
              type="button"
              className={`${styles.tab}${tab === "terms" ? ` ${styles.tabActive}` : ""}`}
              onClick={() => setTab("terms")}
            >
              PO Terms
            </button>
          </div>
          <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
            {tab === "value" ? (
              VALUE_FIELDS.map((f) => (
                <MoneyRow
                  key={f.key}
                  label={f.label}
                  value={Number(value[f.key] ?? 0).toFixed(2)}
                  currency={currency}
                />
              ))
            ) : (
              <>
                <TermsRow label="Ship-To Location" required>
                  <div className={styles.termsControlWithBtn}>
                    <InputField value={terms.shipToLocation} locked hideLabel placeholder="Select location" />
                    <button
                      type="button"
                      className="sc-field-adjunct-btn"
                      aria-label="Select ship-to location"
                      onClick={() => setShipToOpen(true)}
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </TermsRow>
                <TermsRow label="Mode of Transport" required>
                  <SelectField
                    hideLabel
                    required
                    options={transportModeOptions}
                    value={terms.modeOfTransport}
                    onChange={(v) => setTerms((p) => ({ ...p, modeOfTransport: v }))}
                    disabled={!transportModeOptions.length}
                    placeholder="Select Mode of Transport"
                  />
                </TermsRow>
                <TermsRow label="Freight Terms" required>
                  <SelectField
                    hideLabel
                    required
                    options={freightTermsOptions}
                    value={terms.freightTerms}
                    onChange={(v) => setTerms((p) => ({ ...p, freightTerms: v }))}
                    disabled={!freightTermsOptions.length}
                    placeholder="Select Freight Terms"
                  />
                </TermsRow>
                <TermsRow label="Transporter Name">
                  <SelectField
                    hideLabel
                    options={transporterOptions}
                    value={terms.transporterName}
                    onChange={(v) => setTerms((p) => ({ ...p, transporterName: v }))}
                    disabled={!transporterOptions.length}
                    placeholder="Select Transporter"
                  />
                </TermsRow>
                <TermsRow label="Payment Terms" required>
                  <SelectField
                    hideLabel
                    required
                    options={paymentTermsOptions}
                    value={terms.paymentTerms}
                    onChange={(v) => setTerms((p) => ({ ...p, paymentTerms: v }))}
                    disabled={!paymentTermsOptions.length}
                    placeholder="Select Payment Terms"
                  />
                </TermsRow>
                <TermsRow label="PO Validity" required>
                  <DateField
                    hideLabel
                    required
                    type="date"
                    value={terms.poValidity}
                    onChange={(v) => setTerms((p) => ({ ...p, poValidity: v }))}
                  />
                </TermsRow>
                <TermsRow label="PO Remarks">
                  <textarea
                    className={`sc-input ${styles.termsTextarea}`}
                    rows={3}
                    value={terms.poRemarks}
                    onChange={(e) => setTerms((p) => ({ ...p, poRemarks: e.target.value }))}
                  />
                </TermsRow>
              </>
            )}
          </div>
          {tab === "value" ? (
            <div className="sc-modal-footer">
              <button type="button" className="sc-input" style={{ cursor: "pointer" }} onClick={onClose}>
                Back
              </button>
              <button
                type="button"
                className="sc-input"
                style={{
                  background: "var(--brand-primary)",
                  color: "#fff",
                  borderColor: "var(--brand-primary)",
                  cursor: "pointer",
                }}
                onClick={() => setTab("terms")}
              >
                Next
              </button>
            </div>
          ) : (
            <ModalFooterActions
              onCancel={onClose}
              onSave={() => {
                if (!terms.shipToLocation?.trim()) {
                  toast.error("Please select a Ship-To Location.");
                  return;
                }
                onSave?.({ poValue: value, poTerms: terms });
              }}
            />
          )}
        </div>
      </div>

      <PoShipToLocationLookupModal
        open={shipToOpen}
        locationRows={locationRows}
        selectedLocationId={terms.shipToLocationId}
        onClose={() => setShipToOpen(false)}
        onApply={(row) => {
          setTerms((p) => ({
            ...p,
            shipToLocationId: String(row.id),
            shipToLocation: row.locationId || row.name || "",
          }));
          setShipToOpen(false);
        }}
      />
    </>,
    document.body
  );
}
