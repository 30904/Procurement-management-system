/**
 * Adds "Sub-locations" settings card + sample sub-location.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";
import { Location } from "../src/models/Location.model.js";
import { SubLocation } from "../src/models/SubLocation.model.js";

async function main() {
  await connectDatabase();

  const company = await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No active company found");

  await MenuItem.findOneAndUpdate(
    { company: company._id, code: "sub_locations" },
    {
      $set: {
        company: company._id,
        code: "sub_locations",
        label: "Sub Location Master",
        description: "Manage sub-locations under parent locations",
        segment: "configuration/sub-locations",
        parentCode: "company_setup_group",
        menuType: "landing_card",
        sequence: 30,
        isActive: true,
        isHidden: true,
        requiresSuperAdmin: true,
        variant: "admin",
      },
    },
    { upsert: true, new: true }
  );

  const parent = await Location.findOne({
    company: company._id,
    locationId: "Factory",
  });

  if (parent) {
    await SubLocation.findOneAndUpdate(
      { company: company._id, parentLocation: parent._id, subLocationId: "Assembly Unit 1" },
      {
        $set: {
          company: company._id,
          parentLocation: parent._id,
          subLocationCode: "SLOC00001",
          subLocationId: "Assembly Unit 1",
          locationType: "Factory",
          operationalCategory: "Manufacturing",
          gstin: "29AAICV4795A1ZF",
          status: "Active",
          isActive: true,
          description: "Main assembly floor",
        },
      },
      { upsert: true }
    );
  }

  const superRole = await Role.findOne({
    company: company._id,
    roleName: "SUPER_ADMIN",
  });

  const menu = await MenuItem.findOne({
    company: company._id,
    code: "sub_locations",
  });

  if (superRole && menu) {
    const exists = (superRole.permissions || []).some(
      (p) => p.businessFunction === "sub_locations"
    );
    if (!exists) {
      superRole.permissions.push({
        menuItemId: menu._id,
        businessFunction: "sub_locations",
        create: true,
        edit: true,
        view: true,
        approve: true,
        cancel: true,
        delete: true,
        reportGenerated: true,
        acknowledgment: true,
        download: true,
      });
      await superRole.save();
    }
  }

  console.log("[add-sub-location-menu] Done");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
