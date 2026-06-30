/**
 * Assign sequence 1..n within each Master Data category (per company).
 * Preserves current order: sequence asc, then label asc, then createdAt asc.
 *
 * Usage: npm run seed:master-data-sequence
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { MasterData } from "../src/models/MasterData.model.js";

async function resequenceCompany(companyId) {
  const categories = await MasterData.distinct("category", { company: companyId });
  let updated = 0;

  for (const category of categories) {
    const docs = await MasterData.find({ company: companyId, category })
      .sort({ sequence: 1, label: 1, createdAt: 1 })
      .select("_id sequence label")
      .lean();

    let seq = 1;
    for (const doc of docs) {
      if (doc.sequence !== seq) {
        await MasterData.updateOne({ _id: doc._id }, { $set: { sequence: seq } });
        updated += 1;
      }
      seq += 1;
    }
  }

  return { categories: categories.length, updated };
}

async function main() {
  await connectDatabase();

  const companyCode = process.env.SEED_COMPANY_CODE?.trim();
  const companies = companyCode
    ? await Company.find({ companyCode })
    : await Company.find({ isActive: true }).sort({ createdAt: 1 });

  if (!companies.length) {
    const any = await Company.find().sort({ createdAt: 1 }).limit(1);
    if (!any.length) {
      console.error("[resequence-master-data] No company found");
      process.exitCode = 1;
      return;
    }
    companies.push(...any);
  }

  let totalUpdated = 0;
  for (const company of companies) {
    const { categories, updated } = await resequenceCompany(company._id);
    totalUpdated += updated;
    console.log(
      `[resequence-master-data] ${company.companyName}: ${categories} categories, ${updated} rows updated`
    );
  }

  console.log(`[resequence-master-data] Done — ${totalUpdated} total row updates`);
}

main()
  .catch((err) => {
    console.error("[resequence-master-data] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
