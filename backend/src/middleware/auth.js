import jwt from "jsonwebtoken";

/**
 * JWT guard for protected routes (Phase 2).
 * Install: add "jsonwebtoken" to dependencies when implementing login.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "UNAUTHORIZED",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: "JWT_SECRET is not configured",
      code: "SERVER_MISCONFIG",
    });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      code: "INVALID_TOKEN",
    });
  }
}

/**
 * If a Bearer token is present and valid, attaches req.user.
 * Does not reject the request when missing/invalid (for routes that work without auth but still need company context from JWT when logged in).
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return next();
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }
  try {
    req.user = jwt.verify(token, secret);
  } catch {
    // No user context; handlers fall back to default dropdowns.
  }
  return next();
}
