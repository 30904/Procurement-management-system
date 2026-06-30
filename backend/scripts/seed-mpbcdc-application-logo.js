/**
 * Seed MPBCDC logo into company Application Setup (uploads + logoUrl fields).
 * Source: frontend/src/assets/mpbcdc.jpg
 *
 * Usage: npm run seed:mpbcdc-logo
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SOURCE_LOGO = path.join(__dirname, "../../frontend/src/assets/mpbcdc.jpg");
const UPLOAD_ROOT = path.join(__dirname, "../uploads");

async function main() {
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error("[seed-mpbcdc-logo] Missing source file:", SOURCE_LOGO);
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  const companies = await Company.find({ isActive: true }).sort({ createdAt: 1 });
  const targets = companies.length
    ? companies
    : await Company.find().sort({ createdAt: 1 }).limit(1);

  if (!targets.length) {
    console.error("[seed-mpbcdc-logo] No company found. Run npm run seed:framework first.");
    process.exitCode = 1;
    return;
  }

  const buffer = fs.readFileSync(SOURCE_LOGO);
  const stamp = Date.now();

  for (const company of targets) {
    const companyFolder = String(company._id);
    const dir = path.join(UPLOAD_ROOT, companyFolder);
    fs.mkdirSync(dir, { recursive: true });

    const filename = `logo-${stamp}.jpg`;
    fs.writeFileSync(path.join(dir, filename), buffer);

    const publicUrl = `/api/uploads/${companyFolder}/${filename}`;

    if (!company.application) company.application = {};
    company.application.logoUrl = publicUrl;
    company.application.logoSidebarUrl = publicUrl;
    company.application.loginLogoUrl = publicUrl;
    company.application.faviconUrl = publicUrl;
    company.markModified("application");
    await company.save();

    console.log(
      `[seed-mpbcdc-logo] ${company.companyName} — logoUrl set to ${publicUrl}`
    );
  }

  console.log("[seed-mpbcdc-logo] Done. Refresh the app or re-open Application Setup to preview.");
}

main()
  .catch((err) => {
    console.error("[seed-mpbcdc-logo] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
