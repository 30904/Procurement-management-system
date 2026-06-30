/** Fallback when PO Type master data is not seeded yet. */
export const FALLBACK_PO_TYPE_OPTIONS = [
  { value: "Standard PO", label: "Standard PO" },
  { value: "Planned PO", label: "Planned PO" },
  { value: "Blanket PO", label: "Blanket PO" },
];

export const TRANSPORT_MODE_OPTIONS = [
  { value: "Road", label: "Road" },
  { value: "Rail", label: "Rail" },
  { value: "Air", label: "Air" },
  { value: "Sea", label: "Sea" },
];

export const FREIGHT_TERMS_OPTIONS = [
  { value: "FOB – Free On Board", label: "FOB – Free On Board" },
  { value: "CIF – Cost Insurance Freight", label: "CIF – Cost Insurance Freight" },
  { value: "EXW – Ex Works", label: "EXW – Ex Works" },
  { value: "DDP – Delivered Duty Paid", label: "DDP – Delivered Duty Paid" },
];

/** Fallback when Incidental Expenses master data is not seeded yet. */
export const FALLBACK_INCIDENTAL_EXPENSE_ROWS = [
  { description: "Freight & Forwarding Charges", amount: "" },
  { description: "Loading & Unloading", amount: "" },
  { description: "Packing", amount: "" },
  { description: "Insurance", amount: "" },
];
