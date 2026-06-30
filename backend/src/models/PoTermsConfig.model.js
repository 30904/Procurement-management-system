import mongoose from "mongoose";

/**
 * Per-company default PO terms appended to supplier PO copy.
 * openingLineHtml — short salutation / one-line attachment
 * termsBodyHtml — full terms and conditions block
 */
const poTermsConfigSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    openingLineHtml: { type: String, default: "" },
    termsBodyHtml: { type: String, default: "" },
    poPrintFormats: {
      type: [
        {
          key: { type: String, trim: true, default: "" },
          name: { type: String, trim: true, default: "" },
          templateKey: { type: String, trim: true, default: "traditional" },
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    defaultPoPrintFormatKey: { type: String, trim: true, default: "traditional" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "PoTermsConfig" }
);

export const PoTermsConfig =
  mongoose.models.PoTermsConfig || mongoose.model("PoTermsConfig", poTermsConfigSchema);
