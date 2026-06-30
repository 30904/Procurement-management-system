import { StockBalance } from "../models/StockBalance.model.js";
import { AppError } from "../utils/AppError.js";
import { toObjectId } from "../utils/locationScope.js";

export async function adjustStock(
  companyId,
  { locationId, inventoryStoreId, itemId, itemNo, uom, qtyDelta }
) {
  const loc = toObjectId(locationId);
  const store = toObjectId(inventoryStoreId);
  const item = toObjectId(itemId);
  if (!loc || !store || !item) {
    throw new AppError("Invalid stock adjustment reference", 400, "VALIDATION_ERROR");
  }

  const delta = Number(qtyDelta);
  if (!Number.isFinite(delta) || delta === 0) return null;

  const existing = await StockBalance.findOne({
    company: companyId,
    locationId: loc,
    inventoryStoreId: store,
    itemId: item,
  });

  if (!existing && delta < 0) {
    throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
  }

  const nextQty = (existing?.qtyOnHand ?? 0) + delta;
  if (nextQty < 0) {
    throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
  }

  return StockBalance.findOneAndUpdate(
    { company: companyId, locationId: loc, inventoryStoreId: store, itemId: item },
    {
      $set: {
        company: companyId,
        locationId: loc,
        inventoryStoreId: store,
        itemId: item,
        itemNo: itemNo || existing?.itemNo || "",
        uom: uom || existing?.uom || "",
        qtyOnHand: nextQty,
      },
    },
    { upsert: true, new: true }
  );
}

export async function listStockBalances(companyId, filter) {
  return StockBalance.find({ company: companyId, ...filter })
    .sort({ itemNo: 1 })
    .lean();
}
