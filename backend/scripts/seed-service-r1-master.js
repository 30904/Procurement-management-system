import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";
import { User } from "../src/models/User.model.js";
import { SacPMaster } from "../src/models/SacPMaster.model.js";
import { ServiceMasterR1 } from "../src/models/ServiceMasterR1.model.js";
import { AutoIncrement } from "../src/models/AutoIncrement.model.js";

const SERVICES = [
  {
    serviceId: "RMT/0001",
    serviceCategory: "RMT",
    serviceName: "Industrial Machine Maintenance Service",
    serviceDescription: "Annual preventive and breakdown maintenance for production machines",
    uom: "NOS",
    gstRegimeApplicability: "Regular",
    sacCode: "998719",
    taxabilityType: "Taxable",
    rcmApplicability: "No",
    itcAllowed: "Yes",
    tdsApplicability: "Yes",
    tdsSection: "194C",
    tdsRate: 2,
    costCenter: "Maintenance",
    status: "Active",
  },
  {
    serviceId: "RMT/0002",
    serviceCategory: "RMT",
    serviceName: "Electrical Panel Inspection Service",
    serviceDescription: "Quarterly electrical safety and compliance inspection",
    uom: "NOS",
    gstRegimeApplicability: "Regular",
    sacCode: "998313",
    taxabilityType: "Taxable",
    rcmApplicability: "No",
    itcAllowed: "Yes",
    tdsApplicability: "Yes",
    tdsSection: "194C",
    tdsRate: 2,
    costCenter: "Maintenance",
    status: "Active",
  },
  {
    serviceId: "INS/0001",
    serviceCategory: "INS",
    serviceName: "On-site Installation Support",
    serviceDescription: "Machine installation and commissioning at customer site",
    uom: "NOS",
    gstRegimeApplicability: "Regular",
    sacCode: "998540",
    taxabilityType: "Taxable",
    rcmApplicability: "No",
    itcAllowed: "Yes",
    tdsApplicability: "Yes",
    tdsSection: "194J",
    tdsRate: 10,
    costCenter: "Production",
    status: "Active",
  },
];

async function syncCounter(companyId, module) {
  const rows = await ServiceMasterR1.find({ company: companyId, serviceCategory: module })
    .select("serviceId")
    .lean();
  let max = 0;
  for (const row of rows) {
    const m = String(row.serviceId ?? "").match(/\/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  await AutoIncrement.findOneAndUpdate(
    { company: companyId, module },
    { $set: { autoIncrementValue: max } },
    { new: true }
  );
}

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
  const sacRows = await SacPMaster.find({ company: company._id }).sort({ sacCode: 1 }).select("sacCode gstRate").lean();
  if (!sacRows.length) throw new Error("SAC/P records required before seeding Service Master R1");

  for (let i = 0; i < SERVICES.length; i += 1) {
    const row = SERVICES[i];
    const sac = sacRows.find((s) => s.sacCode === row.sacCode) || sacRows[i % sacRows.length];
    await ServiceMasterR1.findOneAndUpdate(
      { company: company._id, serviceId: row.serviceId },
      {
        $set: {
          company: company._id,
          createdBy: actorId,
          updatedBy: actorId,
          ...row,
          sacCode: sac.sacCode,
          gstRate: Number(sac.gstRate ?? 18),
          revNumber: 0,
          revisionHistory: [],
        },
      },
      { upsert: true, new: true }
    );
  }

  for (const module of ["RMT", "INS", "CON", "AMC"]) {
    await syncCounter(company._id, module);
  }
  console.log(`[seed-service-r1-master] Upserted ${SERVICES.length} service R1 records`);
}

main()
  .catch((err) => {
    console.error("[seed-service-r1-master] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
