/**
 * Updates Company.application defaults to Procurement Management System branding.
 * Run: node scripts/update-application-branding.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/procurement";

const BRANDING = {
  applicationName: "Procurement Management System",
  shortName: "PMS",
  tagline: "Purchase · Stores · Quality",
  developerName: "Celeris Venture Systems Pvt. Ltd.",
  logoUrl: "",
  logoSidebarUrl: "",
  loginLogoUrl: "",
  faviconUrl: "",
};

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const companies = db.collection("Company");

  const result = await companies.updateMany(
    {},
    {
      $set: {
        "application.applicationName": BRANDING.applicationName,
        "application.shortName": BRANDING.shortName,
        "application.tagline": BRANDING.tagline,
        "application.logoUrl": BRANDING.logoUrl,
        "application.logoSidebarUrl": BRANDING.logoSidebarUrl,
        "application.loginLogoUrl": BRANDING.loginLogoUrl,
        "application.faviconUrl": BRANDING.faviconUrl,
        "application.developerName": BRANDING.developerName,
      },
    }
  );

  console.log(`Updated ${result.modifiedCount} company record(s) with PMS branding.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
