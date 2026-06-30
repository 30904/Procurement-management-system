import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { GoodsReceipt } from "../models/GoodsReceipt.model.js";
import { StockBalance } from "../models/StockBalance.model.js";
import { Location } from "../models/Location.model.js";
import { toObjectId } from "../utils/locationScope.js";

export async function getDashboardLocationStats(companyId, locationId) {
  const locOid = toObjectId(locationId);
  const location = locOid
    ? await Location.findOne({ _id: locOid, company: companyId })
        .select({ locationId: 1, name: 1, isCentral: 1 })
        .lean()
    : null;

  const baseFilter = locOid ? { company: companyId, locationId: locOid } : { company: companyId };

  const [purchaseOrders, goodsReceipts, stockLines] = await Promise.all([
    PurchaseOrder.countDocuments(baseFilter),
    GoodsReceipt.countDocuments(baseFilter),
    StockBalance.find(baseFilter).select({ qtyOnHand: 1 }).lean(),
  ]);

  const inventoryQty = stockLines.reduce((s, r) => s + (Number(r.qtyOnHand) || 0), 0);

  return {
    location: location
      ? {
          _id: location._id,
          locationId: location.locationId,
          name: location.name || location.locationId,
          isCentral: !!location.isCentral,
        }
      : null,
    purchaseOrders,
    goodsReceipts,
    inventoryLineCount: stockLines.length,
    inventoryQtyOnHand: inventoryQty,
  };
}
