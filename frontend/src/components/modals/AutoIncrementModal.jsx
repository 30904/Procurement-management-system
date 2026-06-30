import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import CloseBtnIcon from "../../assets/close-btn.svg";
import InputField from "../subcomponents/InputField.jsx";
import SelectField from "../subcomponents/SelectField.jsx";
import ModalFooterActions from "./ModalFooterActions.jsx";
import { useToast } from "../../hooks/useToast.js";
import { useModalDrag } from "../../hooks/useModalDrag.js";
import { useCreateModalDevFill } from "../../hooks/useCreateModalDevFill.js";
import styles from "./AutoIncrementModal.module.css";
import "../../styles/subcomponents.css";

function formFromRecord(row) {
  return {
    moduleName: row.moduleName ?? "",
    module: row.module ?? "",
    modulePrefix: row.modulePrefix ?? "",
    autoIncrementValue:
      row.autoIncrementValue === undefined || row.autoIncrementValue === null
        ? "0"
        : String(row.autoIncrementValue),
    digit: row.digit === undefined || row.digit === null ? "4" : String(row.digit),
    allocationScope: row.allocationScope === "LOCATION" || row.locationId ? "LOCATION" : "CENTRAL",
    locationId: row.locationId ? String(row.locationId) : "",
  };
}

function createEmptyForm(defaultActiveLocationId = "") {
  const hasDefaultLoc = Boolean(defaultActiveLocationId);
  return {
    moduleName: "",
    module: "",
    modulePrefix: "",
    autoIncrementValue: "0",
    digit: "4",
    allocationScope: hasDefaultLoc ? "LOCATION" : "CENTRAL",
    locationId: hasDefaultLoc ? String(defaultActiveLocationId) : "",
  };
}

function createInitialForm(initialData, defaultActiveLocationId = "") {
  if (initialData) return formFromRecord(initialData);
  return createEmptyForm(defaultActiveLocationId);
}

export function findAutoIncrementRecord(allRows, { module, allocationScope, locationId }) {
  const mod = String(module || "")
    .trim()
    .toUpperCase();
  if (!mod) return null;

  if (allocationScope === "CENTRAL") {
    return (
      allRows.find(
        (r) =>
          String(r.module || "").toUpperCase() === mod &&
          (!r.locationId || r.allocationScope === "CENTRAL")
      ) ?? null
    );
  }

  const loc = String(locationId || "");
  if (!loc) return null;
  return (
    allRows.find(
      (r) => String(r.module || "").toUpperCase() === mod && String(r.locationId || "") === loc
    ) ?? null
  );
}

export default function AutoIncrementModal({
  onClose,
  onSave,
  initialData,
  locationOptions = [],
  allRows = [],
  defaultActiveLocationId = "",
}) {
  const toast = useToast();
  const isCreate = !initialData;
  const [recordId, setRecordId] = useState(() => initialData?._id || initialData?.id || null);
  const [form, setForm] = useState(() => createInitialForm(initialData, defaultActiveLocationId));
  const [locationHint, setLocationHint] = useState("");
  const [saving, setSaving] = useState(false);
  const { modalRef, overlayStyle, modalStyle, handleHeaderMouseDown } = useModalDrag();

  const applyScopeRecord = useCallback(
    (module, allocationScope, locationId) => {
      const row = findAutoIncrementRecord(allRows, { module, allocationScope, locationId });
      if (row) {
        setRecordId(row._id || row.id);
        setForm(formFromRecord(row));
        setLocationHint("");
        return;
      }
      setRecordId(null);
      setForm((prev) => ({
        ...prev,
        allocationScope,
        locationId: allocationScope === "LOCATION" ? locationId : "",
        modulePrefix: "",
        autoIncrementValue: "0",
      }));
      if (allocationScope === "LOCATION" && locationId) {
        const locLabel = locationOptions.find((o) => o.value === locationId)?.label || "this location";
        setLocationHint(
          `No numbering series for ${locLabel} (module ${module.trim().toUpperCase()}) yet. Set prefix and counter, then save to create one.`
        );
      } else if (allocationScope === "CENTRAL") {
        setLocationHint("No central series for this module yet. Set values and save to create one.");
      } else {
        setLocationHint("Select a location to load or configure its numbering series.");
      }
    },
    [allRows, locationOptions]
  );

  function set(key, val) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "module" && isCreate && !prev.modulePrefix) {
        next.modulePrefix = String(val ?? "").trim().toUpperCase();
      }
      return next;
    });
  }

  function handleAllocationScopeChange(scope) {
    const locationId = scope === "LOCATION" ? form.locationId : "";
    if (form.module?.trim()) {
      applyScopeRecord(form.module, scope, locationId);
    } else {
      setForm((prev) => ({
        ...prev,
        allocationScope: scope,
        locationId: scope === "LOCATION" ? prev.locationId : "",
      }));
      setLocationHint("");
    }
  }

  function handleLocationChange(locationId) {
    if (!form.module?.trim()) {
      set("locationId", locationId);
      return;
    }
    applyScopeRecord(form.module, "LOCATION", locationId);
  }

  const fillDevData = useCallback(() => {
    const suffix = String(Date.now()).slice(-2);
    setRecordId(null);
    setForm({
      moduleName: `Dev Module ${suffix}`,
      module: `DM${suffix}`,
      modulePrefix: `DM${suffix}`,
      autoIncrementValue: "0",
      digit: "4",
      allocationScope: "CENTRAL",
      locationId: "",
    });
    setLocationHint("");
    toast.info("Sample data filled (Alt+F1).");
  }, [toast]);

  useCreateModalDevFill({ enabled: isCreate, onFill: fillDevData });

  async function handleSave() {
    if (saving) return;
    if (!form.moduleName?.trim()) return toast.error("Module Name is required.");
    if (!form.module?.trim()) return toast.error("Module is required.");
    if (!form.modulePrefix?.trim()) return toast.error("Module Prefix is required.");
    if (form.allocationScope === "LOCATION" && !form.locationId) {
      return toast.error("Location is required for location-wise numbering.");
    }

    const payload = {
      moduleName: form.moduleName.trim(),
      module: form.module.trim().toUpperCase(),
      modulePrefix: form.modulePrefix.trim().toUpperCase(),
      autoIncrementValue: Number(form.autoIncrementValue) || 0,
      digit: Number(form.digit) || 4,
      allocationScope: form.allocationScope,
      locationId: form.allocationScope === "LOCATION" ? form.locationId : null,
    };

    setSaving(true);
    try {
      await onSave?.(payload, recordId);
      toast.success(recordId ? "Entry updated." : "Entry created.");
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const previewNum = (Number(form.autoIncrementValue) || 0) + 1;
  const previewCode = form.modulePrefix?.trim()
    ? `${form.modulePrefix.trim().toUpperCase()}/${String(previewNum).padStart(Number(form.digit) || 4, "0")}`
    : "—";

  const canSwitchByLocation = Boolean(form.module?.trim()) && form.allocationScope === "LOCATION";

  return createPortal(
    <div
      className="sc-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={overlayStyle}
    >
      <div ref={modalRef} className="sc-modal" style={{ ...modalStyle, width: "78vw", maxWidth: "1100px" }}>
        <div className="sc-modal-bar" />
        <div
          className="sc-modal-header"
          onMouseDown={handleHeaderMouseDown}
          style={{ cursor: "grab" }}
        >
          <span className="sc-modal-title">
            {initialData ? "Edit Auto Increment" : "Auto Increment Module"}
          </span>
          <button type="button" className="sc-modal-close" onClick={onClose} aria-label="Close">
            <img src={CloseBtnIcon} alt="Close" />
          </button>
        </div>

        <div className="sc-modal-body">
          {canSwitchByLocation ? (
            <p className={styles.scopeHint}>
              Each location has its own prefix and counter for module <strong>{form.module}</strong>. Change
              location to view or edit that site&apos;s series.
            </p>
          ) : null}
          <div className={styles.fieldRow}>
            <InputField
              label="Module Name"
              required
              value={form.moduleName}
              onChange={(v) => set("moduleName", v)}
              placeholder="e.g. Domestic Goods Manufacturer"
            />
            <InputField
              label="Module"
              required
              value={form.module}
              onChange={(v) => set("module", v.toUpperCase())}
              placeholder="e.g. DGM"
              locked={!isCreate}
            />
            <InputField
              label="Module Prefix"
              required
              value={form.modulePrefix}
              onChange={(v) => set("modulePrefix", v.toUpperCase())}
              placeholder="e.g. DGM"
            />
            <InputField
              label="Auto Increment value"
              required
              value={form.autoIncrementValue}
              onChange={(v) => set("autoIncrementValue", v.replace(/\D/g, ""))}
              placeholder="Last assigned number"
              inputMode="numeric"
            />
            <InputField
              label="Digit"
              required
              value={form.digit}
              onChange={(v) => set("digit", v.replace(/\D/g, ""))}
              placeholder="4"
              inputMode="numeric"
            />
            <SelectField
              label="Numbering Scope"
              required
              value={form.allocationScope}
              options={[
                { value: "CENTRAL", label: "Central (company-wide)" },
                { value: "LOCATION", label: "Location wise" },
              ]}
              onChange={handleAllocationScopeChange}
            />
            <SelectField
              label="Location"
              value={form.locationId}
              options={[{ value: "", label: "Select location" }, ...locationOptions]}
              onChange={handleLocationChange}
              disabled={form.allocationScope !== "LOCATION"}
              required={form.allocationScope === "LOCATION"}
            />
          </div>
          {locationHint ? <p className={styles.locationHint}>{locationHint}</p> : null}
          <p className={styles.previewHint}>
            Next code preview (not incremented until a record is saved):{" "}
            <strong>{previewCode}</strong>
          </p>
        </div>

        <ModalFooterActions onCancel={onClose} onSave={handleSave} saving={saving} showDevHint={isCreate} />
      </div>
    </div>,
    document.body
  );
}
