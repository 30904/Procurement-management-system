import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const GROUP_CARDS = [
  {
    code: "company_setup_group",
    label: "Company Setup",
    description: "Company profile, locations, sub-locations, and inventory stores",
    segment: "configuration/company-setup",
    sequence: 10,
  },
  {
    code: "app_setup_group",
    label: "Application Setup",
    description: "App branding, menus, modules, and icons",
    segment: "configuration/app-setup",
    sequence: 20,
  },
  // roles_access already exists at sequence 30
  {
    code: "data_mgmt_group",
    label: "Data Management",
    description: "Master data and bulk CSV import",
    segment: "configuration/data-management",
    sequence: 40,
  },
  {
    code: "communication_group",
    label: "Communication",
    description: "Email configuration and file management",
    segment: "configuration/communication",
    sequence: 50,
  },
  {
    code: "system_group",
    label: "System",
    description: "Audit logs and system monitoring",
    segment: "configuration/system",
    sequence: 60,
  },
];

const HIDE_CODES = [
  "application_setup",
  "menu_setup",
  "modules_setup",
  "icons_setup",
  "master_data",
  "bulk_import",
  "email_setup",
  "file_manager",
  "audit_logs",
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error("MONGO_URI not set"); process.exit(1); }

  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("MenuItem");

  const settings = await col.findOne({ code: "settings" });
  if (!settings) { console.error("'settings' parent not found"); process.exit(1); }

  // Update roles_access sequence to 30
  await col.updateOne({ code: "roles_access" }, { $set: { sequence: 30 } });
  console.log("  roles_access → sequence 30");

  // Insert group cards
  for (const g of GROUP_CARDS) {
    const exists = await col.findOne({ code: g.code });
    if (exists) {
      console.log(`  ${g.code} already exists — updating sequence`);
      await col.updateOne({ code: g.code }, { $set: { sequence: g.sequence, label: g.label, description: g.description, segment: g.segment } });
    } else {
      await col.insertOne({
        company: settings.company,
        code: g.code,
        label: g.label,
        description: g.description,
        segment: g.segment,
        parentCode: "settings",
        menuType: "landing_card",
        sequence: g.sequence,
        requiresSuperAdmin: true,
        variant: "admin",
        isActive: true,
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ${g.code} created (seq ${g.sequence})`);
    }
  }

  // Hide individual cards from top-level
  for (const code of HIDE_CODES) {
    const res = await col.updateOne({ code }, { $set: { isHidden: true } });
    console.log(`  ${code}: ${res.modifiedCount ? "hidden" : "already hidden/missing"}`);
  }

  // Verify final state
  console.log("\n  Final Settings cards:");
  const docs = await col.find({ parentCode: "settings", menuType: "landing_card", isHidden: { $ne: true } })
    .sort({ sequence: 1 }).project({ code: 1, label: 1, sequence: 1 }).toArray();
  docs.forEach((d, i) => console.log(`    ${i + 1}. ${d.label} (${d.code}, seq ${d.sequence})`));

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => { console.error(err); process.exit(1); });
