import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { ItemMaster } from "../src/models/ItemMaster.model.js";
import { SupplierMaster } from "../src/models/SupplierMaster.model.js";
import { ItemSupplierLink } from "../src/models/ItemSupplierLink.model.js";
import { User } from "../src/models/User.model.js";

async function main() {
  await connectDatabase();
  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const company = companyCode
    ? await Company.findOne({ companyCode })
    : await Company.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!company) throw new Error("No company found");

  const actor =
    (await User.findOne({ company: company._id, isActive: true }).sort({ createdAt: 1 })) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }));
  const actorId = actor?._id ?? null;
  const items = await ItemMaster.find({ company: company._id }).sort({ itemNo: 1 }).limit(3).lean();
  const suppliers = await SupplierMaster.find({ company: company._id }).sort({ supplierCode: 1 }).limit(6).lean();
  if (!items.length || !suppliers.length) throw new Error("Seed item and supplier master first");

  let count = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const s1 = suppliers[(i * 2) % suppliers.length];
    const s2 = suppliers[(i * 2 + 1) % suppliers.length];
    for (const supplier of [s1, s2]) {
      await ItemSupplierLink.findOneAndUpdate(
        { company: company._id, itemId: item._id, supplierId: supplier._id, mpn: "" },
        {
          $set: {
            company: company._id,
            itemId: item._id,
            supplierId: supplier._id,
            supplierCode: supplier.supplierCode,
            supplierName: supplier.supplierName,
            supplierCategory: supplier.categoryType || supplier.supplierPurchaseType || "",
            mpn: "",
            uom: item.uom || "NOS",
            rates: [
              { moq: 1, uom: item.uom || "NOS", rate: 100 + i * 20 },
              { moq: 10, uom: item.uom || "NOS", rate: 95 + i * 15 },
            ],
            status: "Active",
            createdBy: actorId,
            updatedBy: actorId,
          },
        },
        { upsert: true, new: true }
      );
      count += 1;
    }
  }
  console.log(`[seed-item-supplier-links] Upserted ${count} links`);
}

main()
  .catch((err) => {
    console.error("[seed-item-supplier-links] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
