import mongoose from "mongoose";

const fileUploadSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    uploaderName: { type: String, trim: true, default: "" },
    originalName: { type: String, trim: true, required: true },
    storedName: { type: String, trim: true, required: true },
    mimeType: { type: String, trim: true, required: true },
    size: { type: Number, required: true },
    category: { type: String, trim: true, default: "general", index: true },
    description: { type: String, trim: true, default: "" },
    path: { type: String, trim: true, required: true },
    url: { type: String, trim: true, default: "" },
    entityType: { type: String, trim: true, default: "" },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    documentTypeCode: { type: String, trim: true, default: "", index: true },
  },
  { timestamps: true, collection: "FileUpload" }
);

fileUploadSchema.index({ company: 1, category: 1, createdAt: -1 });
fileUploadSchema.index({ entityType: 1, entityId: 1 });

export const FileUpload =
  mongoose.models.FileUpload || mongoose.model("FileUpload", fileUploadSchema);
