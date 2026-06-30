import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, trim: true, required: true },
    body: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "system"],
      default: "info",
    },
    category: { type: String, trim: true, default: "general" },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    link: { type: String, trim: true, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "Notification" }
);

notificationSchema.index({ company: 1, recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ company: 1, recipient: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
