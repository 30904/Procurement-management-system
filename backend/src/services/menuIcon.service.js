import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MenuIcon } from "../models/MenuIcon.model.js";
import { AppError } from "../utils/AppError.js";
import { BUILTIN_MENU_ICONS, BUILTIN_ICON_KEY_SET } from "../config/builtinMenuIcons.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, "../../uploads/menu-icons");

const ALLOWED_MIME = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function slugifyCode(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export async function isAllowedMenuIconKey(companyId, code) {
  if (BUILTIN_ICON_KEY_SET.has(code)) return true;
  return MenuIcon.exists({ company: companyId, code });
}

export async function listMenuIconsForCompany(companyId) {
  const custom = await MenuIcon.find({ company: companyId })
    .sort({ label: 1 })
    .lean();

  const customCodes = new Set(custom.map((c) => c.code));

  const builtins = BUILTIN_MENU_ICONS.filter((b) => !customCodes.has(b.code)).map(
    (b) => ({
      code: b.code,
      label: b.label,
      source: "builtin",
      iconUrl: null,
      activeIconUrl: null,
    })
  );

  const uploaded = custom.map((row) => ({
    code: row.code,
    label: row.label,
    source: "upload",
    iconUrl: row.iconUrl,
    activeIconUrl: row.activeIconUrl,
    id: row._id,
  }));

  return [...builtins, ...uploaded];
}

export async function uploadMenuIcon(companyId, payload, files) {
  const label = String(payload?.label ?? "").trim();
  let code = slugifyCode(payload?.code || label);

  if (!label) {
    throw new AppError("Icon label is required", 400, "VALIDATION_ERROR");
  }
  if (!code) {
    throw new AppError("Icon code is required", 400, "VALIDATION_ERROR");
  }
  if (BUILTIN_ICON_KEY_SET.has(code)) {
    throw new AppError(
      "This code is reserved for a built-in icon. Choose a different code.",
      409,
      "RESERVED_CODE"
    );
  }

  const iconFile = files?.iconFile?.[0];
  if (!iconFile) {
    throw new AppError("Icon image file is required", 400, "VALIDATION_ERROR");
  }
  if (!ALLOWED_MIME.has(iconFile.mimetype)) {
    throw new AppError("Use SVG, PNG, JPEG, WebP, or GIF", 400, "VALIDATION_ERROR");
  }

  const activeFile = files?.activeIconFile?.[0] || iconFile;
  if (!ALLOWED_MIME.has(activeFile.mimetype)) {
    throw new AppError("Invalid active icon format", 400, "VALIDATION_ERROR");
  }

  const existing = await MenuIcon.findOne({ company: companyId, code });
  if (existing) {
    throw new AppError("An icon with this code already exists", 409, "DUPLICATE_CODE");
  }

  const companyDir = path.join(UPLOAD_ROOT, String(companyId));
  fs.mkdirSync(companyDir, { recursive: true });

  const ext = path.extname(iconFile.originalname) || ".svg";
  const baseName = `${code}-${Date.now()}`;
  const iconFilename = `${baseName}${ext}`;
  const activeExt = path.extname(activeFile.originalname) || ext;
  const activeFilename = `${baseName}-active${activeExt}`;

  fs.writeFileSync(path.join(companyDir, iconFilename), iconFile.buffer);
  fs.writeFileSync(path.join(companyDir, activeFilename), activeFile.buffer);

  const iconUrl = `/api/uploads/menu-icons/${companyId}/${iconFilename}`;
  const activeIconUrl = `/api/uploads/menu-icons/${companyId}/${activeFilename}`;

  const doc = await MenuIcon.create({
    company: companyId,
    code,
    label,
    iconUrl,
    activeIconUrl,
  });

  return doc.toObject();
}

export async function deleteMenuIcon(companyId, iconId) {
  const doc = await MenuIcon.findOne({ _id: iconId, company: companyId });
  if (!doc) {
    throw new AppError("Icon not found", 404, "NOT_FOUND");
  }

  for (const url of [doc.iconUrl, doc.activeIconUrl]) {
    const rel = String(url || "").replace(/^\/api\/uploads\/menu-icons\//, "");
    if (rel) {
      const disk = path.join(UPLOAD_ROOT, rel);
      if (fs.existsSync(disk)) fs.unlinkSync(disk);
    }
  }

  await MenuIcon.deleteOne({ _id: doc._id });
  return { code: doc.code };
}

export async function resolveIconUrlsForMenu(companyId, iconKey) {
  if (!iconKey) return { iconUrl: null, activeIconUrl: null };
  const custom = await MenuIcon.findOne({ company: companyId, code: iconKey }).lean();
  if (custom) {
    return { iconUrl: custom.iconUrl, activeIconUrl: custom.activeIconUrl };
  }
  return { iconUrl: null, activeIconUrl: null };
}
