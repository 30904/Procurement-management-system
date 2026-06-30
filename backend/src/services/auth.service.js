import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { AppError } from "../utils/AppError.js";

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new AppError("JWT_SECRET is not configured", 500, "SERVER_MISCONFIG");
  return s;
}

function getJwtExpiry() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

export async function loginUser(opts) {
  const identifier = typeof opts === "string" ? opts : opts?.identifier;
  const password = typeof opts === "string" ? arguments[1] : opts?.password;
  const clientIp = opts?.clientIp || "";
  const userAgent = opts?.userAgent || "";

  if (!identifier || !password) {
    throw new AppError("Username and password are required", 400, "VALIDATION_ERROR");
  }

  const user = await User.findOne({
    $or: [
      { userName: identifier },
      { userEmail: identifier },
      { email: identifier },
    ],
    isActive: true,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const payload = {
    sub: user._id,
    company: user.company,
    userType: user.userType,
  };

  const token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiry(),
  });

  user.lastLoggedIn = new Date();
  user.isLoggedIn = "Y";
  user.userIP = clientIp;
  user.userDevice = userAgent;
  await user.save();

  return {
    token,
    user: {
      _id: user._id,
      userCode: user.userCode,
      name: user.name,
      userName: user.userName,
      userEmail: user.userEmail,
      userType: user.userType,
      company: user.company,
      role: user.role,
    },
  };
}

export async function logoutUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  user.isLoggedIn = "N";
  await user.save();
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}
