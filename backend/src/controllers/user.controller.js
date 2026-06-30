import { asyncHandler } from "../middleware/asyncHandler.js";
import { User } from "../models/User.model.js";
import { AppError } from "../utils/AppError.js";
import bcrypt from "bcryptjs";

const USER_CODE_PREFIX = "USR";

async function generateNextUserCode() {
  const latest = await User.findOne({
    userCode: new RegExp(`^${USER_CODE_PREFIX}\\d{4}$`),
  })
    .sort({ userCode: -1 })
    .select({ userCode: 1 })
    .lean();

  const latestSuffix = latest?.userCode
    ? Number(String(latest.userCode).slice(USER_CODE_PREFIX.length))
    : 0;
  const nextSuffix = Number.isFinite(latestSuffix) ? latestSuffix + 1 : 1;
  return `${USER_CODE_PREFIX}${String(nextSuffix).padStart(4, "0")}`;
}

export const listUsers = asyncHandler(async (_req, res) => {
  const rows = await User.find({})
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: rows,
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const body = req.body ?? {};

  if (!body.userName && body.email) body.userName = body.email;
  delete body.email;

  if (!body.name || !body.userName || !body.password) {
    throw new AppError("Missing required fields", 400, "VALIDATION_ERROR");
  }

  if (!Array.isArray(body.role) || body.role.length === 0) {
    throw new AppError("Role is required", 400, "VALIDATION_ERROR");
  }

  const nextCode = await generateNextUserCode();
  const hashedPassword = await bcrypt.hash(body.password, 8);

  try {
    const doc = await User.create({
      ...body,
      password: hashedPassword,
      userCode: nextCode,
      userType: body.userType || "ADMIN",
      isActive: body.isActive !== undefined ? body.isActive : true,
      status: body.status || "Active",
    });

    const result = doc.toObject();
    delete result.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError("User already exists", 409, "DUPLICATE_USER");
    }
    throw err;
  }
});

export const getNextUserCode = asyncHandler(async (_req, res) => {
  const nextCode = await generateNextUserCode();
  res.status(200).json({
    success: true,
    data: { userCode: nextCode },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};

  if (!body.userName && body.email) body.userName = body.email;
  delete body.email;

  if (body.password != null) {
    const pwd = String(body.password).trim();
    if (!pwd) {
      delete body.password;
    } else {
      body.password = await bcrypt.hash(pwd, 8);
    }
  }

  const doc = await User.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) throw new AppError("User not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: doc,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await User.findByIdAndDelete(id);

  if (!doc) throw new AppError("User not found", 404, "NOT_FOUND");

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const listUserSessions = asyncHandler(async (_req, res) => {
  const rows = await User.find({})
    .populate("role", "roleName displayRoleName roleCode")
    .select("name userType userEmail isActive isLoggedIn lastLoggedIn userIP userDevice role status")
    .sort({ lastLoggedIn: -1 })
    .lean();

  const data = rows.map((u) => ({
    ...u,
    roleName: u.role?.length
      ? u.role.map((r) => r.displayRoleName || r.roleName).join(", ")
      : "—",
  }));

  res.status(200).json({ success: true, data });
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const doc = await User.findById(userId)
    .populate("role", "roleName displayRoleName roleCode")
    .lean();
  if (!doc) throw new AppError("User not found", 404, "NOT_FOUND");

  res.status(200).json({ success: true, data: doc });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const body = req.body ?? {};
  const allowed = ["name", "userEmail", "departmentName"];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields to update", 400, "VALIDATION_ERROR");
  }

  const doc = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate("role", "roleName displayRoleName roleCode")
    .lean();

  if (!doc) throw new AppError("User not found", 404, "NOT_FOUND");

  res.status(200).json({ success: true, data: doc });
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new AppError("Authentication required", 401, "UNAUTHORIZED");

  const { currentPassword, newPassword, confirmPassword } = req.body ?? {};

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("All password fields are required", 400, "VALIDATION_ERROR");
  }
  if (newPassword !== confirmPassword) {
    throw new AppError("New password and confirmation do not match", 400, "VALIDATION_ERROR");
  }
  if (newPassword.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");
  }

  user.password = await bcrypt.hash(newPassword, 8);
  await user.save();

  res.status(200).json({ success: true, message: "Password changed successfully" });
});
