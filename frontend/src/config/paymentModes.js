/** Payment journal modes (selector UI to be added later). */
export const PAYMENT_MODES = {
  SUPPLIER_INVOICE: 1,
  PROFORMA: 2,
  EXPENSE: 3,
  PROVISIONS: 4,
};

export const PAYMENT_MODE_REF_LABELS = {
  [PAYMENT_MODES.SUPPLIER_INVOICE]: {
    no: "Supplier Invoice No.",
    date: "Supplier Invoice Date",
  },
  [PAYMENT_MODES.PROFORMA]: {
    no: "Proforma Invoice No.",
    date: "Proforma Invoice Date",
  },
  [PAYMENT_MODES.EXPENSE]: {
    no: "Doc Reference No.",
    date: "Doc Reference Date",
  },
  [PAYMENT_MODES.PROVISIONS]: {
    no: "Supplier Invoice No.",
    date: "Supplier Invoice Date",
  },
};

export function opensSupplierPaymentModal(mode) {
  return mode === PAYMENT_MODES.SUPPLIER_INVOICE;
}

export function opensExpensePaymentModal(mode) {
  return mode === PAYMENT_MODES.EXPENSE;
}

/** Opens invoice/voucher allocation modal (purchase or expense register). */
export function opensRegisterPaymentModal(mode) {
  return opensSupplierPaymentModal(mode) || opensExpensePaymentModal(mode);
}

export function getPaymentRefLabels(mode) {
  return (
    PAYMENT_MODE_REF_LABELS[mode] ??
    PAYMENT_MODE_REF_LABELS[PAYMENT_MODES.SUPPLIER_INVOICE]
  );
}

export const PAYMENT_MODE_OPTIONS = [
  {
    value: PAYMENT_MODES.SUPPLIER_INVOICE,
    label: "Payment Against Supplier Invoice",
  },
  {
    value: PAYMENT_MODES.PROFORMA,
    label: "Payment Against Proforma Invoice",
  },
  {
    value: PAYMENT_MODES.EXPENSE,
    label: "Payment Against Expense",
  },
  {
    value: PAYMENT_MODES.PROVISIONS,
    label: "Payment Against Provisions",
  },
];

export function paymentCategoryLabelForMode(mode) {
  if (mode === "" || mode == null) return "";
  const opt = PAYMENT_MODE_OPTIONS.find((o) => o.value === mode);
  return opt?.label ?? "";
}

/** Reads stored category label (`paymentCategory` or legacy `refNo`). */
export function paymentModeFromCategory(stored) {
  const raw = String(stored ?? "").trim();
  if (!raw) return "";
  const byLabel = PAYMENT_MODE_OPTIONS.find((o) => o.label === raw);
  if (byLabel) return byLabel.value;
  const asNum = Number(raw);
  if (Number.isFinite(asNum)) {
    const byValue = PAYMENT_MODE_OPTIONS.find((o) => o.value === asNum);
    if (byValue) return byValue.value;
  }
  return "";
}

/** @deprecated use paymentModeFromCategory */
export function paymentModeFromRefNo(refNo) {
  return paymentModeFromCategory(refNo);
}
