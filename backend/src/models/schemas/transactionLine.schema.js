import mongoose from "mongoose";

export const transactionLineSchema = new mongoose.Schema(
  {
    lineNo: { type: Number, required: true, min: 1 },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "ItemMaster" },
    itemNo: { type: String, trim: true, default: "" },
    itemName: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    tag: { type: String, trim: true, default: "" },
    vbp: { type: Number, default: 0, min: 0 },
    edd: { type: String, trim: true, default: "" },
    eqt: { type: String, trim: true, default: "" },
    uom: { type: String, trim: true, default: "" },
    qty: { type: Number, required: true, min: 0 },
    /** Cumulative qty received via posted GRN (PO lines only). */
    receivedQty: { type: Number, default: 0, min: 0 },
    /** Qty short-closed / cancelled on PO line. */
    cancelledQty: { type: Number, default: 0, min: 0 },
    /** Remaining open qty: qty - receivedQty - cancelledQty. */
    balanceQty: { type: Number, default: 0, min: 0 },
    /** Open | Partial | Complete | Short Closed (PO lines only). */
    lineGrnStatus: { type: String, trim: true, default: "Open" },
    rate: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    hsnCode: { type: String, trim: true, default: "" },
    gstRate: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0, min: 0 },
    igstRate: { type: Number, default: 0, min: 0 },
    igstAmt: { type: Number, default: 0, min: 0 },
    cgstRate: { type: Number, default: 0, min: 0 },
    cgstAmt: { type: Number, default: 0, min: 0 },
    sgstRate: { type: Number, default: 0, min: 0 },
    sgstAmt: { type: Number, default: 0, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);
