import mongoose from "mongoose";

const paymentTermsRevisionSchema = new mongoose.Schema(
  {
    revisionNo: { type: Number, required: true, min: 1 },
    revisionDate: { type: Date, required: true },
    reason: { type: String, trim: true, required: true },
    proposedBy: { type: String, trim: true, required: true },
    approvedBy: { type: String, trim: true, required: true },
    changedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true, default: "" },
      userName: { type: String, trim: true, default: "" },
      userEmail: { type: String, trim: true, default: "" },
    },
    changedAt: { type: Date, default: Date.now },
    changes: [
      {
        field: { type: String, required: true },
        from: { type: mongoose.Schema.Types.Mixed },
        to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const paymentTermsMasterSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    paymentTermsCode: { type: String, trim: true, required: true },
    displayOrder: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
    revNumber: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    mpbcdcPaymentTerms: {
      approvalStatus: { type: String, trim: true, default: "Draft" },
      activeFrom: { type: Date, default: null },
      activeTo: { type: Date, default: null },
      governmentApproved: { type: String, trim: true, default: "" },
    },
    revisionHistory: { type: [paymentTermsRevisionSchema], default: [] },
  },
  { timestamps: true, collection: "PaymentTermsMaster" }
);

paymentTermsMasterSchema.index({ company: 1, paymentTermsCode: 1 }, { unique: true });
paymentTermsMasterSchema.index({ company: 1, displayOrder: 1 });

export const PaymentTermsMaster =
  mongoose.models.PaymentTermsMaster ||
  mongoose.model("PaymentTermsMaster", paymentTermsMasterSchema);
