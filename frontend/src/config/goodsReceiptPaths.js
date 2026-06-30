const STORES_PREFIX = "stores/grn";
const PURCHASE_PREFIX = "purchase/goods-receipt";

export function resolveGoodsReceiptPaths(pathname = "") {
  const fromPurchase = String(pathname || "").includes("purchase/goods-receipt");
  const base = fromPurchase ? PURCHASE_PREFIX : STORES_PREFIX;
  return {
    hubSegment: fromPurchase ? "purchase" : "stores",
    listPath: base,
    newPath: `${base}/new`,
    editPath: (id) => `${base}/${id}/edit`,
    detailPath: (id) => `${base}/${id}`,
    printPath: (id) => `${base}/${id}/print`,
    title: "Goods Receipt",
  };
}

export const GOODS_RECEIPT_STORES_PATHS = resolveGoodsReceiptPaths(`/${STORES_PREFIX}`);
export const GOODS_RECEIPT_PURCHASE_PATHS = resolveGoodsReceiptPaths(`/${PURCHASE_PREFIX}`);
