/**
 * Ensures one central (HO) location per company from company address + GSTIN.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { Location } from "../src/models/Location.model.js";

async function main() {
  await connectDatabase();
  const companies = await Company.find({ isActive: { $ne: false } }).lean();

  for (const company of companies) {
    let central = await Location.findOne({ company: company._id, isCentral: true });
    if (central) {
      console.log(`Central location exists for ${company.companyName}: ${central.locationId}`);
      continue;
    }

    const existing = await Location.findOne({ company: company._id }).sort({ createdAt: 1 });
    if (existing) {
      existing.isCentral = true;
      existing.name = existing.name || existing.locationId || "Head Office";
      if (!existing.gstin && company.gstin) existing.gstin = company.gstin;
      await existing.save();
      console.log(`Marked existing location as central: ${existing.locationId}`);
      continue;
    }

    central = await Location.create({
      company: company._id,
      locationCode: "LOC00001",
      locationId: "HO",
      name: "Head Office",
      isCentral: true,
      usesCompanyGstin: !company.gstin,
      gstin: String(company.gstin || "").trim(),
      locationType: "Head Office",
      operationalCategory: "Corporate",
      status: "Active",
      isActive: true,
      country: company.country || "India",
      state: company.state || "",
      cityDistrict: company.city || "",
      pinCode: company.pinCode || "",
      addressLine1: company.addressLine1 || company.address || "",
      addressLine2: company.addressLine2 || "",
    });
    console.log(`Created central location HO for ${company.companyName}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
