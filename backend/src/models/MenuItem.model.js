import mongoose from "mongoose";

/**
 * Database-driven navigation catalog for procurement applications.
 * Supports sidebar items, landing hub cards, ordering, and visibility flags.
 */
const menuItemSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    code: { type: String, trim: true, required: true },
    label: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: "" },
    segment: { type: String, trim: true, default: "" },
    parentCode: { type: String, trim: true, default: null },
    menuType: {
      type: String,
      enum: [
        "sidebar_main",
        "sidebar_bottom",
        "flyout_item",
        "landing_card",
        "card_group",
        "page",
      ],
      required: true,
    },
    sequence: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false },
    iconKey: { type: String, trim: true, default: "" },
    activeIconKey: { type: String, trim: true, default: "" },
    isEssential: { type: Boolean, default: false },
    requiresAdmin: { type: Boolean, default: false },
    requiresSuperAdmin: { type: Boolean, default: false },
    variant: { type: String, trim: true, default: "" },
    disabled: { type: Boolean, default: false },
    disabledHint: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "MenuItem" }
);

menuItemSchema.index({ company: 1, code: 1 }, { unique: true });
menuItemSchema.index({ company: 1, parentCode: 1, menuType: 1, sequence: 1 });
menuItemSchema.index({ company: 1, menuType: 1, isActive: 1, isHidden: 1 });

export const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
