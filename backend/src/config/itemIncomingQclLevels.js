/** Master Data category + default levels for Item Incoming QCL. */
export const ITEM_INCOMING_QCL_CATEGORY = "Item Incoming QCL";

export const DEFAULT_ITEM_INCOMING_QCL_LEVELS = [
  {
    label: "L1 - Green Channel",
    value: "L1 - Green Channel",
    description: "Green channel — minimal inspection",
    sequence: 1,
  },
  {
    label: "L2 - Verification of TC/COA",
    value: "L2 - Verification of TC/COA",
    description: "Verify test certificate / certificate of analysis",
    sequence: 2,
  },
  {
    label: "L3 - Inspection of Material",
    value: "L3 - Inspection of Material",
    description: "Full incoming material inspection",
    sequence: 3,
  },
];
