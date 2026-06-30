import { asyncHandler } from "../middleware/asyncHandler.js";
import { Role } from "../models/Role.model.js";
import { getSingletonCompanyId } from "../utils/singleTenant.js";
import { AppError } from "../utils/AppError.js";
import { isValidDashboardKey } from "../config/dashboardCatalog.js";

const ROLE_CODE_PREFIX = "FR";
const ROLE_CODE_DIGITS = 5;

async function generateNextRoleCode(companyId) {
  const latest = await Role.findOne({
    company: companyId,
    roleCode: new RegExp(`^${ROLE_CODE_PREFIX}\\d{${ROLE_CODE_DIGITS}}$`),
  })
    .sort({ roleCode: -1 })
    .select({ roleCode: 1 })
    .lean();

  const latestSuffix = latest?.roleCode
    ? Number(String(latest.roleCode).slice(ROLE_CODE_PREFIX.length))
    : 0;
  const nextSuffix = Number.isFinite(latestSuffix) ? latestSuffix + 1 : 1;
  return `${ROLE_CODE_PREFIX}${String(nextSuffix).padStart(ROLE_CODE_DIGITS, "0")}`;
}

export const listRoles = asyncHandler(async (_req, res) => {
  const companyId = await getSingletonCompanyId();
  const filter = companyId ? { company: companyId } : {};

  const rows = await Role.find(filter)
    .sort({ displayRoleName: 1, roleName: 1, roleCode: 1 })
    .select({ _id: 1, roleCode: 1, roleName: 1, displayRoleName: 1, dashboardKey: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: rows,
  });
});

export const createRole = asyncHandler(async (req, res) => {
  const companyId = await getSingletonCompanyId();
  if (!companyId) {
    throw new AppError("Company not found", 400, "NO_COMPANY");
  }

  const body = req.body ?? {};
  const roleName = String(body.roleName ?? "").trim();
  if (!roleName) {
    throw new AppError("Role name is required", 400, "VALIDATION_ERROR");
  }

  const roleCode = await generateNextRoleCode(companyId);

  try {
    const doc = await Role.create({
      company: companyId,
      roleCode,
      roleName,
      displayRoleName: roleName,
      permissions: [],
    });

    res.status(201).json({
      success: true,
      data: {
        _id: doc._id,
        roleCode: doc.roleCode,
        roleName: doc.roleName,
        displayRoleName: doc.displayRoleName,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("Role already exists", 409, "DUPLICATE_ROLE");
    }
    throw err;
  }
});

export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Role.findById(id).lean();
  if (!doc) {
    throw new AppError("Role not found", 404, "NOT_FOUND");
  }
  res.status(200).json({
    success: true,
    data: doc,
  });
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};

  const doc = await Role.findById(id);
  if (!doc) {
    throw new AppError("Role not found", 404, "NOT_FOUND");
  }

  if (body.roleName) {
    doc.roleName = String(body.roleName).trim();
    doc.displayRoleName = doc.roleName;
  }
  if (Array.isArray(body.permissions)) {
    doc.permissions = body.permissions;
  }
  if (body.dashboardKey !== undefined) {
    const key = String(body.dashboardKey).trim();
    if (!isValidDashboardKey(key)) {
      throw new AppError("Invalid dashboard key", 400, "VALIDATION_ERROR");
    }
    doc.dashboardKey = key;
  }

  await doc.save();

  res.status(200).json({
    success: true,
    data: {
      _id: doc._id,
      roleCode: doc.roleCode,
      roleName: doc.roleName,
      permissions: doc.permissions,
    },
  });
});
