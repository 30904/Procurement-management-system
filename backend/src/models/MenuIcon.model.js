import mongoose from "mongoose";

const menuIconSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    iconUrl: { type: String, trim: true, required: true },
    activeIconUrl: { type: String, trim: true, required: true },
  },
  { timestamps: true, collection: "MenuIcon" }
);

menuIconSchema.index({ company: 1, code: 1 }, { unique: true });

export const MenuIcon =
  mongoose.models.MenuIcon || mongoose.model("MenuIcon", menuIconSchema);
