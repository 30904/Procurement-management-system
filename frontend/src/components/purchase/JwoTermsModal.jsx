import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import CloseBtnIcon from "../../assets/close-btn.svg";
import SelectField from "../subcomponents/SelectField.jsx";
import DateField from "../subcomponents/DateField.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import {
  listLocationsRequest,
  listLogisticsMasterRequest,
  listPaymentTermsMasterRequest,
} from "../../services/api.js";
import { emptyJwoTerms } from "../../utils/jobWorkOrderFormState.js";
import "../../styles/subcomponents.css";

function paymentTermsToOptions(rows) {
  return (rows || [])
    .filter((r) => String(r.status || "Active") === "Active")
    .sort(
      (a, b) =>
        (Number(a.displayOrder ?? a.order) || 0) - (Number(b.displayOrder ?? b.order) || 0) ||
        String(a.description ?? "").localeCompare(String(b.description ?? ""))
    )
    .map((r) => {
      const label = String(r.description ?? r.paymentTermsCode ?? "").trim();
      return { value: label, label };
    })
    .filter((o) => o.value);
}

export default function JwoTermsModal({ open, terms, onClose, onSave }) {
  const [draft, setDraft] = useState(emptyJwoTerms());
  const [locations, setLocations] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([]);
  const { options: transportOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.MODE_OF_TRANSPORT);
  const { options: freightOptions } = useMasterDataOptions(MASTER_DATA_CATEGORY.FREIGHT_TERMS);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  useEffect(() => {
    if (!open) return;
    setDraft({ ...emptyJwoTerms(), ...(terms || {}) });
  }, [open, terms]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [locRes, lspRes, ptRes] = await Promise.all([
          listLocationsRequest(),
          listLogisticsMasterRequest(),
          listPaymentTermsMasterRequest(),
        ]);
        if (!cancelled) {
          setLocations(Array.isArray(locRes?.data) ? locRes.data : []);
          setTransporters(Array.isArray(lspRes?.data) ? lspRes.data : []);
          setPaymentTermsOptions(paymentTermsToOptions(ptRes?.data));
        }
      } catch {
        if (!cancelled) {
          setLocations([]);
          setTransporters([]);
          setPaymentTermsOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const locationOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select Location" }];
    for (const loc of locations) {
      const id = String(loc._id || loc.id || "");
      const label = [loc.code, loc.name].filter(Boolean).join(" — ") || id;
      if (id) opts.push({ value: id, label });
    }
    return opts;
  }, [locations]);

  const transporterOptions = useMemo(() => {
    const opts = [{ value: "", label: "Select Transporter" }];
    for (const row of transporters) {
      if (String(row.isLspActive || "").toUpperCase() !== "A") continue;
      const id = String(row._id || row.id || "");
      const label = row.lspNameLegalEntity || row.lspNickName || id;
      if (id) opts.push({ value: id, label });
    }
    return opts;
  }, [transporters]);

  function patch(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleSave() {
    if (!draft.shipToLocationId) return;
    if (!draft.modeOfTransport || !draft.freightTerms || !draft.transporterId) return;
    if (!draft.paymentTerms || !draft.jwoValidity) return;
    onSave?.(draft);
    onClose?.();
  }

  if (!open) return null;

  const fieldArrow = { color: "var(--brand-primary)", marginRight: "0.35rem" };

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "52vw", minWidth: 480, maxWidth: 720 }}>
        <div className="sc-modal-bar" />
        <div className="sc-modal-header" onMouseDown={handleHeaderMouseDown} style={{ cursor: "grab" }}>
          <span className="sc-modal-title">JWO Terms</span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="" />
          </button>
        </div>
        <div className="sc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <SelectField
            label={
              <>
                <span style={fieldArrow}>→</span> Ship To (Location) <span style={{ color: "#dc2626" }}>*</span>
              </>
            }
            options={locationOptions}
            value={draft.shipToLocationId}
            onChange={(v) => {
              const loc = locations.find((row) => String(row._id || row.id) === v);
              patch({
                shipToLocationId: v,
                shipToLocationLabel: loc
                  ? [loc.code, loc.name].filter(Boolean).join(" — ")
                  : "",
              });
            }}
          />
          <SelectField
            label={
              <>
                <span style={fieldArrow}>→</span> Mode of Transport <span style={{ color: "#dc2626" }}>*</span>
              </>
            }
            options={[{ value: "", label: "Select Mode of Transport" }, ...transportOptions]}
            value={draft.modeOfTransport}
            onChange={(v) => patch({ modeOfTransport: v })}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "end" }}>
            <SelectField
              label={
                <>
                  <span style={fieldArrow}>→</span> Freight Terms <span style={{ color: "#dc2626" }}>*</span>
                </>
              }
              options={[{ value: "", label: "Select Freight Terms" }, ...freightOptions]}
              value={draft.freightTerms}
              onChange={(v) => patch({ freightTerms: v })}
            />
            <button
              type="button"
              className="sc-input"
              title="Refresh freight terms"
              style={{ width: "2.5rem", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => patch({ freightTerms: "" })}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <SelectField
            label={
              <>
                <span style={fieldArrow}>→</span> Transporter <span style={{ color: "#dc2626" }}>*</span>
              </>
            }
            options={transporterOptions}
            value={draft.transporterId}
            onChange={(v) => {
              const row = transporters.find((r) => String(r._id || r.id) === v);
              patch({
                transporterId: v,
                transporterName: row?.lspNameLegalEntity || row?.lspNickName || "",
              });
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "end" }}>
            <SelectField
              label={
                <>
                  <span style={fieldArrow}>→</span> Payment Terms <span style={{ color: "#dc2626" }}>*</span>
                </>
              }
              options={[{ value: "", label: "Select Payment Terms" }, ...paymentTermsOptions]}
              value={draft.paymentTerms}
              onChange={(v) => patch({ paymentTerms: v })}
            />
            <button
              type="button"
              className="sc-input"
              title="Clear payment terms"
              style={{ width: "2.5rem", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => patch({ paymentTerms: "" })}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <DateField
            label={
              <>
                <span style={fieldArrow}>→</span> JWO Validity <span style={{ color: "#dc2626" }}>*</span>
              </>
            }
            value={draft.jwoValidity}
            onChange={(v) => patch({ jwoValidity: v })}
          />
        </div>
        <div className="sc-modal-footer">
          <button type="button" className="sc-input" onClick={onClose} style={{ cursor: "pointer" }}>
            Cancel
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
            onClick={handleSave}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
