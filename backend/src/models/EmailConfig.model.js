import mongoose from "mongoose";

/**
 * Per-company SMTP / email configuration.
 * Passwords are stored encrypted in production — for the framework MVP we
 * store them as plain text (mark the field for future encryption).
 */
const emailConfigSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    smtpHost: { type: String, trim: true, default: "" },
    smtpPort: { type: Number, default: 465 },
    smtpSecure: { type: Boolean, default: true },
    smtpUser: { type: String, trim: true, default: "" },
    smtpPass: { type: String, default: "" },
    fromName: { type: String, trim: true, default: "" },
    fromEmail: { type: String, trim: true, default: "" },
    replyTo: { type: String, trim: true, default: "" },
    tlsRejectUnauthorized: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "EmailConfig" }
);

export const EmailConfig =
  mongoose.models.EmailConfig ||
  mongoose.model("EmailConfig", emailConfigSchema);
