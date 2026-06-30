/**
 * Procurement Management System — full seed
 * Company, menu catalog, roles (Super Admin + Admin), and demo users.
 *
 * Usage: node scripts/seed-framework.js
 * DB: MONGO_URI from backend/.env (default mongodb://localhost:27017/procurement)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";
import { User } from "../src/models/User.model.js";
import { buildRolePermissions } from "./menu-catalog.js";
import { syncMenuCatalogForCompany } from "./menu-sync.js";

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Admin@123";

async function upsertCompany() {
  const doc = await Company.findOneAndUpdate(
    { companyCode: "CELERIS-PMS-001" },
    {
      $set: {
        companyCode: "CELERIS-PMS-001",
        companyName: "Celeris Demo Company",
        displayName: "Procurement Management System",
        registrationNo: "R0012",
        registrationDate: new Date("2026-05-15"),
        constitutionOfBusiness: "Private Limited",
        corporateIdentificationNo: "U31909KA2022PTC156193",
        dateOfIncorporation: new Date("2022-01-03"),
        typeOfIndustry: "IT & Software",
        companyPan: "AAICV4795A",
        tan: "BLRV23558D",
        msmeClassification: "Micro",
        udyamRegistrationNo: "KR-03-0151340",
        gstClassification: "B2B Regular",
        status: "Active",
        isActive: true,
        application: {
          applicationName: "Procurement Management System",
          shortName: "PMS",
          version: "1.0.0",
          buildNumber: "100",
          tagline: "Purchase · Stores · Quality",
          developerName: "Celeris Venture Systems Pvt. Ltd.",
          environment: "production",
          themePrimaryColor: "#0F7C94",
          themeAccentColor: "#DC2626",
        },
        address: {
          line1: "Celeris Venture Systems",
          city: "Pune",
          state: "Maharashtra",
          pinCode: "411001",
        },
        contact: {
          email: "framework@celeris.local",
          mobile: "9999999999",
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
}

async function upsertRoles(companyId, menuDocs) {
  const superPerms = buildRolePermissions(menuDocs, "super");
  const adminPerms = buildRolePermissions(menuDocs, "admin");

  const superRole = await Role.findOneAndUpdate(
    { company: companyId, roleCode: "FR00001" },
    {
      $set: {
        company: companyId,
        roleCode: "FR00001",
        roleName: "SUPER_ADMIN",
        displayRoleName: "Super Admin",
        redirectTo: "/app/dashboard",
        dashboardKey: "executive",
        permissions: superPerms,
      },
    },
    { upsert: true, new: true }
  );

  const adminRole = await Role.findOneAndUpdate(
    { company: companyId, roleCode: "FR00002" },
    {
      $set: {
        company: companyId,
        roleCode: "FR00002",
        roleName: "ADMIN",
        displayRoleName: "Admin",
        redirectTo: "/app/dashboard",
        dashboardKey: "default",
        permissions: adminPerms,
      },
    },
    { upsert: true, new: true }
  );

  return { superRole, adminRole };
}

async function upsertUsers(companyId, superRole, adminRole) {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const superUser = await User.findOneAndUpdate(
    { userName: "superadmin" },
    {
      $set: {
        company: companyId,
        userCode: "FU00001",
        name: "Super Admin",
        userName: "superadmin",
        userEmail: "superadmin@celeris.local",
        password: hash,
        role: [superRole._id],
        userType: "SUPER_ADMIN",
        isActive: true,
        status: "Active",
      },
    },
    { upsert: true, new: true }
  );

  const adminUser = await User.findOneAndUpdate(
    { userName: "admin" },
    {
      $set: {
        company: companyId,
        userCode: "FU00002",
        name: "Admin User",
        userName: "admin",
        userEmail: "admin@celeris.local",
        password: hash,
        role: [adminRole._id],
        userType: "ADMIN",
        isActive: true,
        status: "Active",
      },
    },
    { upsert: true, new: true }
  );

  return { superUser, adminUser };
}

async function main() {
  console.log("[seed-framework] Connecting...");
  await connectDatabase();

  const company = await upsertCompany();
  console.log("[seed-framework] Company:", company.companyName, company._id.toString());

  const syncResult = await syncMenuCatalogForCompany(company._id);
  const menuDocs = await MenuItem.find({ company: company._id }).sort({ sequence: 1 });
  console.log(
    "[seed-framework] Menu items:",
    syncResult.menuCount,
    "(removed",
    syncResult.removedCount,
    "legacy/orphan)"
  );

  const { superRole, adminRole } = await upsertRoles(company._id, menuDocs);
  console.log("[seed-framework] Roles:", superRole.roleName, adminRole.roleName);

  const { superUser, adminUser } = await upsertUsers(company._id, superRole, adminRole);
  console.log("[seed-framework] Users seeded:");
  console.log(
    JSON.stringify(
      {
        companyId: company._id.toString(),
        superAdmin: { userName: superUser.userName, role: superRole.roleName },
        admin: { userName: adminUser.userName, role: adminRole.roleName },
        password: DEFAULT_PASSWORD,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error("[seed-framework] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
