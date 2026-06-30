import { ItemMaster } from "../models/ItemMaster.model.js";
import { AppError } from "../utils/AppError.js";

function mapSummaryRow(doc) {
  const qcl = doc.incomingQcl && typeof doc.incomingQcl === "object" ? doc.incomingQcl : {};
  return {
    id: String(doc._id),
    _id: String(doc._id),
    itemNo: doc.itemNo,
    itemName: doc.itemName,
    itemDescription: doc.itemDescription,
    uom: doc.uom,
    itemCategory: doc.itemCategory,
    hsnCode: doc.hsnCode,
    inventoryStore: doc.inventoryStore,
    status: doc.status || "Active",
    itemQcl: qcl.qclLevel || "",
    shelfLifeMonths: qcl.shelfLifeMonths != null ? Number(qcl.shelfLifeMonths) : null,
    qclConfigured: Boolean(qcl.configured),
  };
}

export async function listActiveItemsIncomingQcl(companyId) {
  const docs = await ItemMaster.find({ company: companyId, status: "Active" })
    .sort({ itemNo: 1 })
    .lean();
  return docs.map(mapSummaryRow);
}

export async function getItemIncomingQcl(companyId, itemId) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId, status: "Active" }).lean();
  if (!doc) throw new AppError("Active item not found", 404, "NOT_FOUND");
  const qcl = doc.incomingQcl && typeof doc.incomingQcl === "object" ? doc.incomingQcl : {};
  return {
    id: String(doc._id),
    itemNo: doc.itemNo,
    itemCategory: doc.itemCategory,
    itemName: doc.itemName,
    itemDescription: doc.itemDescription,
    uom: doc.uom,
    hsnCode: doc.hsnCode,
    inventoryStore: doc.inventoryStore,
    status: doc.status,
    incomingQcl: {
      qclLevel: qcl.qclLevel || "",
      shelfLifeMonths: qcl.shelfLifeMonths != null ? Number(qcl.shelfLifeMonths) : "",
      configured: Boolean(qcl.configured),
    },
  };
}

export async function saveItemIncomingQcl(companyId, itemId, body, userId) {
  const doc = await ItemMaster.findOne({ _id: itemId, company: companyId, status: "Active" });
  if (!doc) throw new AppError("Active item not found", 404, "NOT_FOUND");

  const qclLevel = String(body?.qclLevel ?? "").trim();
  if (!qclLevel) {
    throw new AppError("Incoming QCL level is required", 400, "VALIDATION_ERROR");
  }

  let shelfLifeMonths = body?.shelfLifeMonths;
  if (shelfLifeMonths === "" || shelfLifeMonths === null || shelfLifeMonths === undefined) {
    shelfLifeMonths = undefined;
  } else {
    const n = Number(shelfLifeMonths);
    if (Number.isNaN(n) || n < 0) {
      throw new AppError("Shelf life must be zero or greater", 400, "VALIDATION_ERROR");
    }
    shelfLifeMonths = Math.round(n * 100) / 100;
  }

  doc.incomingQcl = {
    qclLevel,
    shelfLifeMonths,
    configured: true,
    updatedAt: new Date(),
    updatedBy: userId,
  };
  doc.updatedBy = userId;
  await doc.save();
  return getItemIncomingQcl(companyId, itemId);
}
