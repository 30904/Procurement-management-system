import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveFrontendDistPath() {
  const configured = String(process.env.FRONTEND_DIST_PATH || "").trim();
  if (configured) {
    return fs.existsSync(path.join(configured, "index.html")) ? configured : null;
  }
  const candidate = path.resolve(__dirname, "../../../frontend/dist");
  return fs.existsSync(path.join(candidate, "index.html")) ? candidate : null;
}

export function shouldServeFrontend() {
  const flag = String(process.env.SERVE_FRONTEND ?? "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return process.env.NODE_ENV === "production";
}

/**
 * @param {import("express").Express} app
 */
export function registerFrontendStatic(app) {
  if (!shouldServeFrontend()) return null;

  const distPath = resolveFrontendDistPath();
  if (!distPath) return null;

  app.use(express.static(distPath, { index: false, maxAge: "1d", fallthrough: true }));

  app.get("*", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) next(err);
    });
  });

  return distPath;
}
