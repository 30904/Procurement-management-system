/**
 * Adds "Location Master" card + sample location.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";
import { Location } from "../src/models/Location.model.js";

async function main() {
  await connectDatabase();

  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company found");

  await MenuItem.findOneAndUpdate(
    { company: company._id, code: "location_master" },
    {
      $set: {
        company: company._id,
        code: "location_master",
        label: "Location Master",
        description: "Manage business locations and GSTIN",
        segment: "configuration/location-master",
        parentCode: "company_setup_group",
        menuType: "landing_card",
        sequence: 20,
        isActive: true,
        isHidden: false,
        requiresSuperAdmin: false,
        variant: "",
      },
    },
    { upsert: true, new: true }
  );

  await Location.findOneAndUpdate(
    { company: company._id, locationId: "Factory" },
    {
      $set: {
        company: company._id,
        locationCode: "LOC00001",
        locationId: "Factory",
        locationType: "Factory",
        operationalCategory: "Manufacturing",
        gstin: "29AAICV4795A1ZF",
        status: "Active",
        isActive: true,
        registrationDate: new Date(),
        country: "India",
        state: "Karnataka",
        cityDistrict: "Bengaluru",
        pinCode: "560001",
        addressLine1: "Plot 12, Industrial Area",
        addressLine2: "Phase 2",
        addressLine3: "Peenya",
        addressLine4: "",
        latitude: "13.0287",
        longitude: "77.5146",
        contacts: [
          {
            name: "Plant Manager",
            mobile: "9876543210",
            email: "plant@example.com",
            designation: "Manager",
          },
        ],
      },
    },
    { upsert: true }
  );

  const superRole = await Role.findOne({
    company: company._id,
    roleName: "SUPER_ADMIN",
  });

  const menu = await MenuItem.findOne({
    company: company._id,
    code: "location_master",
  });

  const fullFlags = {
    create: true,
    edit: true,
    view: true,
    approve: true,
    cancel: true,
    delete: true,
    reportGenerated: true,
    acknowledgment: true,
    download: true,
  };

  for (const roleName of ["SUPER_ADMIN", "ADMIN"]) {
    const role = await Role.findOne({ company: company._id, roleName });
    if (!role || !menu) continue;
    const idx = (role.permissions || []).findIndex(
      (p) => p.businessFunction === "location_master"
    );
    const entry = {
      menuItemId: menu._id,
      businessFunction: "location_master",
      ...fullFlags,
    };
    if (idx >= 0) role.permissions[idx] = { ...role.permissions[idx], ...entry };
    else role.permissions.push(entry);
    await role.save();
  }

  console.log("[add-location-menu] Done");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
