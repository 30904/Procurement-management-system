import { MasterData } from "../models/MasterData.model.js";
import { AppError } from "./AppError.js";

const MODULE_BY_LABEL = new Map([
  ["repair and maintenance", "RMT"],
  ["repair & maintenance", "RMT"],
  ["installation", "INS"],
  ["consulting", "CON"],
  ["amc", "AMC"],
]);

function toModuleCode(value) {
  const v = String(value ?? "").trim().toUpperCase();
  return /^[A-Z0-9_]{2,20}$/.test(v) ? v : "";
}

export async function resolveServiceCategoryModule(companyId, categoryType) {
  const raw = String(categoryType ?? "").trim();
  if (!raw) throw new AppError("Service Category is required", 400, "VALIDATION_ERROR");

  const direct = toModuleCode(raw);
  if (direct) return direct;

  const md = await MasterData.findOne({
    company: companyId,
    category: "Service Category",
    $or: [{ value: raw }, { label: raw }],
  }).lean();

  if (md?.value) {
    const fromValue = toModuleCode(md.value);
    if (fromValue) return fromValue;
  }

  const mapped = MODULE_BY_LABEL.get(raw.toLowerCase());
  if (mapped) return mapped;

  const fallback = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (fallback.length >= 2) return fallback.slice(0, 12);
  throw new AppError("Unable to resolve Service Category module key", 400, "VALIDATION_ERROR");
}
