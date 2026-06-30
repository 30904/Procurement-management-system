import { filterDomesticSuppliers, isDomesticSupplier } from "../utils/domesticSupplier.js";
import { filterImportSuppliers, isImportPoSupplier } from "../utils/importSupplier.js";

/** Stored on PO as poTerms.poChannel — same PurchaseOrder collection. */
export const PO_CHANNEL = {
  STANDARD: "standard",
  DOMESTIC: "domestic",
  IMPORT: "import",
};

const WORKSPACES = {
  "generate-po": {
    id: "generate-po",
    poChannel: PO_CHANNEL.STANDARD,
    title: "Purchase Orders",
    hubTitle: "Purchase Order",
    listPath: "purchase/purchase-order/generate-po",
    newPath: "purchase/purchase-order/generate-po/new",
    editPath: (id) => `purchase/purchase-order/generate-po/${id}/edit`,
    detailPath: (id) => `purchase/purchase-order/generate-po/${id}`,
    printPath: (id) => `purchase/purchase-order/generate-po/${id}/print`,
    parentHubPath: "purchase/purchase-order",
    purchaseHubPath: "purchase",
    menuCode: "purchase_purchase_order_generate_po",
    filterSuppliers: (rows) => rows,
    isSupplierAllowed: () => true,
    defaultCurrency: null,
    showDomesticInsight: false,
    showImportInsight: false,
    useCardsLayout: false,
    pageSubtitle: "Create and manage draft purchase orders.",
  },
  domestic: {
    id: "domestic",
    poChannel: PO_CHANNEL.DOMESTIC,
    title: "PO Domestic",
    hubTitle: "PO Domestic",
    listPath: "purchase/purchase-order-domestic",
    newPath: "purchase/purchase-order-domestic/new",
    editPath: (id) => `purchase/purchase-order-domestic/${id}/edit`,
    detailPath: (id) => `purchase/purchase-order-domestic/${id}`,
    printPath: (id) => `purchase/purchase-order-domestic/${id}/print`,
    parentHubPath: "purchase",
    purchaseHubPath: "purchase",
    menuCode: "purchase_purchase_order_domestic",
    filterSuppliers: filterDomesticSuppliers,
    isSupplierAllowed: isDomesticSupplier,
    defaultCurrency: "INR",
    showDomesticInsight: true,
    showImportInsight: false,
    useCardsLayout: true,
    pageSubtitle: "Domestic suppliers · INR · GST on print",
  },
  import: {
    id: "import",
    poChannel: PO_CHANNEL.IMPORT,
    title: "PO Imports",
    hubTitle: "PO Imports",
    listPath: "purchase/purchase-order-import",
    newPath: "purchase/purchase-order-import/new",
    editPath: (id) => `purchase/purchase-order-import/${id}/edit`,
    detailPath: (id) => `purchase/purchase-order-import/${id}`,
    printPath: (id) => `purchase/purchase-order-import/${id}/print`,
    parentHubPath: "purchase",
    purchaseHubPath: "purchase",
    menuCode: "purchase_purchase_order_import",
    filterSuppliers: filterImportSuppliers,
    isSupplierAllowed: isImportPoSupplier,
    defaultCurrency: "USD",
    showDomesticInsight: false,
    showImportInsight: true,
    useCardsLayout: true,
    pageSubtitle: "Import suppliers · landed cost · foreign currency",
  },
};

export function getPurchaseOrderWorkspace(workspaceId = "generate-po") {
  return WORKSPACES[workspaceId] || WORKSPACES["generate-po"];
}
