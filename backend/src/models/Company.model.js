import mongoose from "mongoose";
import { APP_BRANDING_DEFAULTS } from "../config/appBrandingDefaults.js";

const companySchema = new mongoose.Schema(
  {
    companyCode: { type: String, trim: true, required: true },
    companyName: { type: String, trim: true, required: true },
    displayName: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    status: { type: String, trim: true, default: "Active" },

    registrationNo: { type: String, trim: true },
    registrationDate: { type: Date },
    constitutionOfBusiness: { type: String, trim: true },
    corporateIdentificationNo: { type: String, trim: true },
    dateOfIncorporation: { type: Date },
    natureOfBusiness: { type: String, trim: true },
    typeOfIndustry: { type: String, trim: true },
    companyPan: { type: String, trim: true },
    tan: { type: String, trim: true },
    msmeClassification: { type: String, trim: true },
    udyamRegistrationNo: { type: String, trim: true },
    gstClassification: { type: String, trim: true },
    locationsServedCount: { type: Number, min: 0 },

    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pinCode: { type: String, trim: true },
    },
    contact: {
      email: { type: String, trim: true },
      mobile: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    application: {
      applicationName: {
        type: String,
        trim: true,
        default: "Procurement Management System",
      },
      shortName: { type: String, trim: true, default: "PMS" },
      version: { type: String, trim: true, default: "1.0.0" },
      buildNumber: { type: String, trim: true },
      tagline: {
        type: String,
        trim: true,
        default: "Purchase · Stores · Quality",
      },
      description: { type: String, trim: true },
      developerName: {
        type: String,
        trim: true,
        default: APP_BRANDING_DEFAULTS.developerName,
      },
      supportEmail: { type: String, trim: true },
      supportPhone: { type: String, trim: true },
      websiteUrl: { type: String, trim: true },
      copyrightText: { type: String, trim: true },
      environment: {
        type: String,
        enum: ["development", "staging", "production"],
        default: "production",
      },
      themePrimaryColor: { type: String, trim: true, default: "#0F7C94" },
      themeAccentColor: { type: String, trim: true, default: "#ff0096" },
      logoUrl: { type: String, trim: true },
      logoSidebarUrl: { type: String, trim: true },
      faviconUrl: { type: String, trim: true },
      loginLogoUrl: { type: String, trim: true },
    },
  },
  { timestamps: true, collection: "Company" }
);

companySchema.index({ companyCode: 1 }, { unique: true });
companySchema.index({ registrationNo: 1 }, { sparse: true });

export const Company =
  mongoose.models.Company || mongoose.model("Company", companySchema);
