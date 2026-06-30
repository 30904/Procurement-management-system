import { Minus, Plus } from "lucide-react";
import InputField from "../subcomponents/InputField.jsx";
import styles from "./SupplierAddressTabs.module.css";

export function emptySupplierAddress() {
  return {
    line1: "",
    line2: "",
    line3: "",
    line4: "",
    state: "",
    city: "",
    district: "",
    pinCode: "",
    country: "",
    zone: "",
  };
}

export function isSupplierAddressEmpty(addr) {
  if (!addr) return true;
  return ![
    addr.line1,
    addr.line2,
    addr.line3,
    addr.line4,
    addr.state,
    addr.city,
    addr.district,
    addr.pinCode,
    addr.country,
    addr.zone,
  ].some((v) => String(v ?? "").trim());
}

export function validateSupplierAddress(addr, label) {
  const errors = [];
  if (!addr?.country?.trim()) errors.push(`${label}: Country is required.`);
  if (!addr?.state?.trim()) errors.push(`${label}: State/Province is required.`);
  if (!addr?.city?.trim()) errors.push(`${label}: City/District is required.`);
  if (!addr?.pinCode?.trim()) errors.push(`${label}: Pin Code is required.`);
  if (!addr?.line1?.trim()) errors.push(`${label}: Address Line 1 is required.`);
  if (!addr?.line2?.trim()) errors.push(`${label}: Address Line 2 is required.`);
  if (!addr?.line3?.trim()) errors.push(`${label}: Address Line 3 is required.`);
  return errors;
}

/**
 * Tab 0 = billing (Primary Address). Tabs 1..n = shipping Address 2, 3, …
 */
export default function SupplierAddressTabs({
  billingAddress,
  shippingAddresses = [],
  activeTab,
  onActiveTabChange,
  onBillingChange,
  onShippingChange,
  onAddShipping,
  onRemoveShipping,
  billingOnly = false,
}) {
  const shipping = Array.isArray(shippingAddresses) ? shippingAddresses : [];
  const isBilling = activeTab === 0;
  const shippingIndex = activeTab - 1;
  const current = isBilling ? billingAddress : shipping[shippingIndex] || emptySupplierAddress();

  function patch(key, value) {
    if (isBilling) onBillingChange?.(key, value);
    else onShippingChange?.(shippingIndex, key, value);
  }

  function tabLabel(index) {
    if (index === 0) return "Primary Address";
    return `Address ${index + 1}`;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.tabRow}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab}${activeTab === 0 ? ` ${styles.tabActive}` : ""}`}
            onClick={() => onActiveTabChange?.(0)}
          >
            <span className={styles.tabLabel}>{tabLabel(0)}</span>
            <span className={styles.tabBadge}>Billing</span>
          </button>

          {!billingOnly &&
            shipping.map((_, idx) => {
            const tabIndex = idx + 1;
            return (
              <button
                key={`ship-tab-${tabIndex}`}
                type="button"
                className={`${styles.tab}${activeTab === tabIndex ? ` ${styles.tabActive}` : ""}`}
                onClick={() => onActiveTabChange?.(tabIndex)}
              >
                <span className={styles.tabLabel}>{tabLabel(tabIndex)}</span>
                <span className={styles.tabBadge}>Shipping</span>
                <span
                  className={styles.tabRemove}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${tabLabel(tabIndex)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveShipping?.(idx);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveShipping?.(idx);
                    }
                  }}
                >
                  <Minus size={12} strokeWidth={2.5} />
                </span>
              </button>
            );
            })}
        </div>

        {!billingOnly ? (
          <button
            type="button"
            className={styles.btnAdd}
            onClick={() => onAddShipping?.()}
            aria-label="Add shipping address"
            title="Add shipping address"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>

      <p className={styles.hint}>
        {billingOnly || isBilling
          ? "Primary address is saved as the supplier billing address."
          : `Shipping address ${shippingIndex + 1} — optional duplicate of billing or alternate delivery location.`}
      </p>

      <div className="sc-field-grid">
        <InputField
          label="Country"
          required
          value={current.country}
          onChange={(v) => patch("country", v)}
          placeholder="Enter country"
        />
        <InputField
          label="State/Province"
          required
          value={current.state}
          onChange={(v) => patch("state", v)}
          placeholder="Enter state or province"
        />
        <InputField
          label="City/District"
          required
          value={current.city}
          onChange={(v) => patch("city", v)}
          placeholder="Enter city or district"
        />
        <InputField
          label="Pin Code"
          required
          value={current.pinCode}
          onChange={(v) => patch("pinCode", v)}
          placeholder="Enter pin code"
          inputMode="numeric"
        />

        <InputField
          label="Address Line 1"
          required
          value={current.line1}
          onChange={(v) => patch("line1", v)}
          placeholder="Building, street"
        />
        <InputField
          label="Address Line 2"
          required
          value={current.line2}
          onChange={(v) => patch("line2", v)}
          placeholder="Area, landmark"
        />
        <InputField
          label="Address Line 3"
          required
          value={current.line3}
          onChange={(v) => patch("line3", v)}
          placeholder="Additional address line"
        />
        <InputField
          label="Address Line 4"
          value={current.line4}
          onChange={(v) => patch("line4", v)}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}
