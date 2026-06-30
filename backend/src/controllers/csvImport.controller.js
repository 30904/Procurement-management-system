import { asyncHandler } from "../middleware/asyncHandler.js";
import * as svc from "../services/csvImport.service.js";
import { AppError } from "../utils/AppError.js";

export const getProfiles = asyncHandler(async (_req, res) => {
  const profiles = svc.listProfiles();
  res.json({ success: true, data: profiles });
});

export const downloadTemplate = asyncHandler(async (req, res) => {
  const { profile } = req.params;
  const csv = svc.generateTemplate(profile);
  if (!csv) throw new AppError("Unknown profile", 404, "NOT_FOUND");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${profile}_template.csv"`);
  res.send(csv);
});

export const parseUpload = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No file uploaded", 400, "VALIDATION_ERROR");

  const profileKey = req.body.profile;
  if (!profileKey) throw new AppError("Profile key is required", 400, "VALIDATION_ERROR");

  const profile = svc.getProfile(profileKey);
  if (!profile) throw new AppError("Unknown profile", 400, "NOT_FOUND");

  const results = svc.parseCSV(req.file.buffer, profileKey);
  res.json({ success: true, data: results });
});

export const executeImport = asyncHandler(async (req, res) => {
  const { profile: profileKey, rows } = req.body ?? {};
  if (!profileKey || !Array.isArray(rows) || rows.length === 0) {
    throw new AppError("Profile and rows are required", 400, "VALIDATION_ERROR");
  }

  const profile = svc.getProfile(profileKey);
  if (!profile) throw new AppError("Unknown profile", 400, "NOT_FOUND");

  const company = req.user?.company;
  const result = await svc.importRows(profileKey, rows, company);
  res.json({ success: true, data: result });
});
