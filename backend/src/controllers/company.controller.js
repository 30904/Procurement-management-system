import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { Company } from "../models/Company.model.js";

function requireSuperAdmin(req) {
  const isSuper =
    req.rbac?.isSuperAdmin ||
    String(req.appUser?.userType || "").toUpperCase() === "SUPER_ADMIN";
  if (!isSuper) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
}

function parseOptionalDate(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError("Invalid date value", 400, "VALIDATION_ERROR");
  }
  return d;
}

async function resolveCompanyDoc(req) {
  const companyId = req.appUser?.company || req.rbac?.companyId;
  if (companyId) {
    return Company.findById(companyId);
  }
  return Company.findOne({ isActive: true }).sort({ createdAt: 1 });
}

export const getCurrentCompany = asyncHandler(async (req, res) => {
  const doc = await resolveCompanyDoc(req);
  if (!doc) throw new AppError("Company not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    data: doc.toObject ? doc.toObject() : doc,
  });
});

export const updateCurrentCompany = asyncHandler(async (req, res) => {
  requireSuperAdmin(req);

  const doc = await resolveCompanyDoc(req);
  if (!doc) throw new AppError("Company not found", 404, "NOT_FOUND");

  const body = req.body ?? {};

  if (body.companyName !== undefined) {
    const name = String(body.companyName).trim();
    if (!name) throw new AppError("Company legal name is required", 400, "VALIDATION_ERROR");
    doc.companyName = name;
  }
  if (body.displayName !== undefined) {
    doc.displayName = String(body.displayName).trim();
  }
  if (body.companyCode !== undefined) {
    const code = String(body.companyCode).trim();
    if (!code) throw new AppError("Company code is required", 400, "VALIDATION_ERROR");
    doc.companyCode = code;
  }
  if (body.registrationNo !== undefined) {
    doc.registrationNo = String(body.registrationNo).trim();
  }
  if (body.registrationDate !== undefined) {
    doc.registrationDate = parseOptionalDate(body.registrationDate);
  }
  if (body.constitutionOfBusiness !== undefined) {
    doc.constitutionOfBusiness = String(body.constitutionOfBusiness).trim();
  }
  if (body.corporateIdentificationNo !== undefined) {
    doc.corporateIdentificationNo = String(body.corporateIdentificationNo).trim();
  }
  if (body.dateOfIncorporation !== undefined) {
    doc.dateOfIncorporation = parseOptionalDate(body.dateOfIncorporation);
  }
  if (body.natureOfBusiness !== undefined) {
    doc.natureOfBusiness = String(body.natureOfBusiness).trim();
  }
  if (body.typeOfIndustry !== undefined) {
    doc.typeOfIndustry = String(body.typeOfIndustry).trim();
  }
  if (body.companyPan !== undefined) {
    doc.companyPan = String(body.companyPan).trim().toUpperCase();
  }
  if (body.tan !== undefined) {
    doc.tan = String(body.tan).trim().toUpperCase();
  }
  if (body.msmeClassification !== undefined) {
    doc.msmeClassification = String(body.msmeClassification).trim();
  }
  if (body.udyamRegistrationNo !== undefined) {
    doc.udyamRegistrationNo = String(body.udyamRegistrationNo).trim();
  }
  if (body.gstClassification !== undefined) {
    doc.gstClassification = String(body.gstClassification).trim();
  }
  if (body.locationsServedCount !== undefined) {
    const n = body.locationsServedCount === "" ? null : Number(body.locationsServedCount);
    if (n !== null && (!Number.isFinite(n) || n < 0)) {
      throw new AppError("Invalid number of locations", 400, "VALIDATION_ERROR");
    }
    doc.locationsServedCount = n;
  }
  if (body.status !== undefined) {
    const status = String(body.status).trim();
    doc.status = status;
    doc.isActive = status.toLowerCase() === "active";
  }
  if (body.isActive !== undefined) {
    doc.isActive = !!body.isActive;
    if (!body.status) {
      doc.status = doc.isActive ? "Active" : "Inactive";
    }
  }

  if (body.address && typeof body.address === "object") {
    doc.address = { ...doc.address?.toObject?.() || doc.address || {}, ...body.address };
  }
  if (body.contact && typeof body.contact === "object") {
    doc.contact = { ...doc.contact?.toObject?.() || doc.contact || {}, ...body.contact };
  }

  try {
    await doc.save();
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Company code or registration already exists", 409, "DUPLICATE");
    }
    throw err;
  }

  res.status(200).json({
    success: true,
    data: doc.toObject(),
    message: "Company details saved successfully",
  });
});
