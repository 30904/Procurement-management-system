/**
 * Assigns all users to central/default location when allowedLocationIds is empty.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";
import { User } from "../src/models/User.model.js";

async function main() {
  await connectDatabase();

  const companies = await Company.find({ isActive: { $ne: false } }).lean();

  for (const company of companies) {
    const central = await Location.findOne({
      company: company._id,
      $or: [{ isCentral: true }, { isActive: { $ne: false } }],
    }).sort({ isCentral: -1, createdAt: 1 });

    if (!central) continue;

    const users = await User.find({
      company: company._id,
      $or: [{ allowedLocationIds: { $exists: false } }, { allowedLocationIds: { $size: 0 } }],
    });

    for (const user of users) {
      const isSuper = String(user.userType || "").toUpperCase() === "SUPER_ADMIN";
      user.allowedLocationIds = [central._id];
      user.defaultLocationId = central._id;
      user.locationAccessMode = isSuper ? "all" : "restricted";
      await user.save();
    }

    console.log(`Updated ${users.length} users for ${company.companyName}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
