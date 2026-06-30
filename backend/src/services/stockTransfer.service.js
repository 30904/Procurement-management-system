import { StockTransfer } from "../models/StockTransfer.model.js";
import { AppError } from "../utils/AppError.js";
import { adjustStock } from "./stock.service.js";
import {
  normalizeLines,
  scopedListFilter,
  nextDocNo,
  assertLocationAccess,
  resolveTxnContext,
} from "./transactionBase.service.js";
import { validateTransactionContext } from "../utils/locationGovernance.js";
import { toObjectId } from "../utils/locationScope.js";

function transferListFilter(companyId, scope) {
  const base = { company: companyId };
  if (!scope || scope.mode === "all") {
    if (scope?.activeLocationId) {
      const oid = toObjectId(scope.activeLocationId);
      if (oid) {
        return {
          ...base,
          $or: [{ fromLocationId: oid }, { toLocationId: oid }],
        };
      }
    }
    return base;
  }
  const ids = (scope.locationIds || []).map(toObjectId).filter(Boolean);
  if (!ids.length) return { ...base, fromLocationId: { $in: [] } };
  return {
    ...base,
    $or: [{ fromLocationId: { $in: ids } }, { toLocationId: { $in: ids } }],
  };
}

export async function listStockTransfers(companyId, scope) {
  return StockTransfer.find(transferListFilter(companyId, scope))
    .sort({ transferDate: -1, transferNo: -1 })
    .lean();
}

export async function getStockTransfer(companyId, id, scope) {
  const filter = transferListFilter(companyId, scope);
  filter._id = id;
  const doc = await StockTransfer.findOne(filter).lean();
  if (!doc) throw new AppError("Stock transfer not found", 404, "NOT_FOUND");
  return doc;
}

export async function createStockTransfer(companyId, body, scope, userId) {
  const fromLocationId = assertLocationAccess(scope, body.fromLocationId);
  const toLocationId = assertLocationAccess(scope, body.toLocationId);
  const fromStoreId = toObjectId(body.fromStoreId);
  const toStoreId = toObjectId(body.toStoreId);
  if (!fromStoreId || !toStoreId) {
    throw new AppError("From and to stores are required", 400, "VALIDATION_ERROR");
  }
  const lines = normalizeLines(body.lines);
  validateTransactionContext({ locationId: body.fromLocationId }, scope);
  const transferNo =
    body.transferNo?.trim() || (await nextDocNo(companyId, "ST", "ST", fromLocationId));

  const doc = await StockTransfer.create({
    company: companyId,
    transferNo,
    transferDate: body.transferDate ? new Date(body.transferDate) : new Date(),
    fromLocationId,
    fromStoreId,
    toLocationId,
    toStoreId,
    status: "Draft",
    lines,
    remarks: String(body.remarks ?? "").trim(),
    createdBy: userId,
    updatedBy: userId,
  });
  return doc.toObject();
}

export async function completeStockTransfer(companyId, id, scope, userId) {
  const filter = transferListFilter(companyId, scope);
  filter._id = id;
  const doc = await StockTransfer.findOne(filter);
  if (!doc) throw new AppError("Stock transfer not found", 404, "NOT_FOUND");
  if (doc.status === "Completed") throw new AppError("Transfer already completed", 400, "INVALID_STATUS");

  for (const line of doc.lines) {
    if (!line.itemId || !line.qty) continue;
    await adjustStock(companyId, {
      locationId: doc.fromLocationId,
      inventoryStoreId: doc.fromStoreId,
      itemId: line.itemId,
      itemNo: line.itemNo,
      uom: line.uom,
      qtyDelta: -line.qty,
    });
    await adjustStock(companyId, {
      locationId: doc.toLocationId,
      inventoryStoreId: doc.toStoreId,
      itemId: line.itemId,
      itemNo: line.itemNo,
      uom: line.uom,
      qtyDelta: line.qty,
    });
  }

  doc.status = "Completed";
  doc.updatedBy = userId;
  await doc.save();
  return doc.toObject();
}

export async function deleteStockTransfer(companyId, id, scope) {
  const filter = transferListFilter(companyId, scope);
  filter._id = id;
  filter.status = "Draft";
  const doc = await StockTransfer.findOneAndDelete(filter);
  if (!doc) throw new AppError("Transfer not found or not in Draft", 404, "NOT_FOUND");
  return { deleted: true };
}
