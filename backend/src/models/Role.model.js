import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId },
    businessFunction: { type: String, trim: true },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    view: { type: Boolean, default: true },
    approve: { type: Boolean, default: false },
    cancel: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    reportGenerated: { type: Boolean, default: false },
    acknowledgment: { type: Boolean, default: false },
    download: { type: Boolean, default: false },
  },
  { _id: true }
);

const roleSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    roleCode: { type: String, trim: true, required: true },
    roleName: { type: String, trim: true, required: true },
    displayRoleName: { type: String, trim: true, required: true },
    redirectTo: { type: String, trim: true, default: "/app/dashboard" },
    /** Dashboard variant key — see config/dashboardCatalog.js */
    dashboardKey: { type: String, trim: true, default: "default" },
    permissions: { type: [rolePermissionSchema], default: [] },
  },
  { timestamps: true, collection: "Role" }
);

roleSchema.index({ company: 1, roleCode: 1 }, { unique: true });
roleSchema.index({ company: 1, roleName: 1 }, { unique: true });

export const Role =
  mongoose.models.Role || mongoose.model("Role", roleSchema);
