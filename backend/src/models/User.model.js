import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    userCode: { type: String, trim: true },
    name: { type: String, trim: true },
    role: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoggedIn: { type: Date },
    isLoggedIn: { type: String },
    userType: { type: String, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    departmentName: { type: String, trim: true },
    status: { type: String, trim: true },
    allowedSuppCatTypes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    userDevice: { type: String, trim: true },
    userIP: { type: String, trim: true },
    groupLocationName: { type: String, trim: true },
    locDet: { type: [mongoose.Schema.Types.Mixed], default: [] },
    defaultLocationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    allowedLocationIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }], default: [] },
    locationAccessMode: { type: String, enum: ["restricted", "all"], default: "restricted" },
  },
  { timestamps: true, collection: "User" }
);

userSchema.index({ userCode: 1 });
userSchema.index({ userName: 1 });
userSchema.index({ userEmail: 1 });

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
