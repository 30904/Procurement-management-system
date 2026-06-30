import { asyncHandler } from "../middleware/asyncHandler.js";
import { loginUser } from "../services/auth.service.js";

export function authStatus(_req, res) {
  res.status(200).json({
    success: true,
    message: "Auth module ready",
    loginImplemented: true,
  });
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) {
    return xf.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body ?? {};
  const ip = clientIp(req);
  const ua = req.headers["user-agent"] || "";

  const result = await loginUser({
    identifier,
    password,
    clientIp: ip,
    userAgent: ua,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      token: result.token,
      expiresIn: result.expiresIn,
      user: result.user,
    },
  });
});
