import { Company } from "../models/Company.model.js";

/**
 * Single-tenant helper.
 * Returns the first active Company document id.
 */
export async function getSingletonCompanyId() {
  const first = await Company.findOne({ isActive: true })
    .sort({ createdAt: 1 })
    .select({ _id: 1 })
    .lean();
  return first?._id ?? null;
}

