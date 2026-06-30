import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { APP_BRANDING_DEFAULTS } from "../config/appBrandingDefaults.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { Company } from "../models/Company.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, "../../uploads");

const ALLOWED_ASSETS = new Set([
  "logo",
  "logoSidebar",
  "favicon",
  "loginLogo",
]);

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

function requireSuperAdmin(req) {
  const isSuper =
    req.rbac?.isSuperAdmin ||
    String(req.appUser?.userType || "").toUpperCase() === "SUPER_ADMIN";
  if (!isSuper) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
}

async function resolveCompanyDoc(req) {
  const companyId = req.appUser?.company || req.rbac?.companyId;
  if (companyId) return Company.findById(companyId);
  return Company.findOne({ isActive: true }).sort({ createdAt: 1 });
}

function defaultApplication() {
  return {
    applicationName: "Procurement Management System",
    shortName: "PMS",
    version: "1.0.0",
    buildNumber: "",
    tagline: "Purchase · Stores · Quality",
    description: "",
    developerName: APP_BRANDING_DEFAULTS.developerName,
    supportEmail: "",
    supportPhone: "",
    websiteUrl: "",
    copyrightText: "",
    environment: "production",
    themePrimaryColor: "#0F7C94",
    themeAccentColor: "#DC2626",
    logoUrl: "",
    logoSidebarUrl: "",
    faviconUrl: "",
    loginLogoUrl: "",
  };
}

function mergeApplication(doc) {
  const base = defaultApplication();
  const app = doc.application?.toObject?.() || doc.application || {};
  return { ...base, ...app };
}

export const getPublicApplicationBranding = asyncHandler(async (req, res) => {
  const doc = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  res.status(200).json({
    success: true,
    data: doc ? mergeApplication(doc) : defaultApplication(),
  });
});

export const getApplicationSettings = asyncHandler(async (req, res) => {
  const doc = await resolveCompanyDoc(req);
  if (!doc) throw new AppError("Company not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    data: mergeApplication(doc),
  });
});

export const updateApplicationSettings = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);

  const doc = await resolveCompanyDoc(req);
  if (!doc) throw new AppError("Company not found", 404, "NOT_FOUND");

  const body = req.body ?? {};
  const allowed = [
    "applicationName",
    "shortName",
    "version",
    "buildNumber",
    "tagline",
    "description",
    "developerName",
    "supportEmail",
    "supportPhone",
    "websiteUrl",
    "copyrightText",
    "environment",
    "themePrimaryColor",
    "themeAccentColor",
  ];

  if (!doc.application) {
    doc.application = defaultApplication();
  }

  for (const key of allowed) {
    if (body[key] !== undefined) {
      doc.application[key] =
        typeof body[key] === "string" ? body[key].trim() : body[key];
    }
  }

  if (body.applicationName !== undefined) {
    const name = String(body.applicationName).trim();
    if (!name) {
      throw new AppError("Application name is required", 400, "VALIDATION_ERROR");
    }
    doc.application.applicationName = name;
  }

  if (body.environment !== undefined) {
    const env = String(body.environment).toLowerCase();
    if (!["development", "staging", "production"].includes(env)) {
      throw new AppError("Invalid environment", 400, "VALIDATION_ERROR");
    }
    doc.application.environment = env;
  }

  doc.markModified("application");
  await doc.save();

  res.status(200).json({
    success: true,
    data: mergeApplication(doc),
    message: "Application settings saved successfully",
  });
});

export const uploadApplicationAsset = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);

  const doc = await resolveCompanyDoc(req);
  if (!doc) throw new AppError("Company not found", 404, "NOT_FOUND");

  const assetType = String(req.body?.assetType || req.query?.assetType || "").trim();
  if (!ALLOWED_ASSETS.has(assetType)) {
    throw new AppError("Invalid asset type", 400, "VALIDATION_ERROR");
  }

  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded", 400, "VALIDATION_ERROR");
  }

  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError("Unsupported image format", 400, "VALIDATION_ERROR");
  }

  const companyFolder = String(doc._id);
  const dir = path.join(UPLOAD_ROOT, companyFolder);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.originalname) || ".png";
  const filename = `${assetType}-${Date.now()}${ext}`;
  const diskPath = path.join(dir, filename);
  fs.writeFileSync(diskPath, file.buffer);

  const publicUrl = `/api/uploads/${companyFolder}/${filename}`;
  const fieldMap = {
    logo: "logoUrl",
    logoSidebar: "logoSidebarUrl",
    favicon: "faviconUrl",
    loginLogo: "loginLogoUrl",
  };

  if (!doc.application) doc.application = defaultApplication();
  doc.application[fieldMap[assetType]] = publicUrl;
  doc.markModified("application");
  await doc.save();

  res.status(200).json({
    success: true,
    data: {
      assetType,
      url: publicUrl,
      application: mergeApplication(doc),
    },
    message: "File uploaded successfully",
  });
});
