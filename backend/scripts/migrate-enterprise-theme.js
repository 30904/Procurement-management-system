/**
 * One-time migration: update legacy blue/pink theme colors in Company.application
 *
 * Usage: node scripts/migrate-enterprise-theme.js
 */
import "dotenv/config";
import { connectDatabase } from "../src/config/database.js";
import { Company } from "../src/models/Company.model.js";

const ENTERPRISE_PRIMARY = "#0F7C94";
const ENTERPRISE_ACCENT = "#DC2626";

const LEGACY_PRIMARY = [
  "#197dfa",
  "#006efa",
  "#007dfa",
  "#005afa",
  "#0046d2",
  "#506ed2",
  "#2563eb",
];

const LEGACY_ACCENT = ["#ff0096", "#ff3296", "#ec4899"];

function norm(hex) {
  return (hex || "").trim().toLowerCase();
}

async function run() {
  await connectDatabase();

  const companies = await Company.find({}).select("companyCode companyName application").lean();
  let updated = 0;

  for (const c of companies) {
    const app = c.application || {};
    const primary = norm(app.themePrimaryColor);
    const accent = norm(app.themeAccentColor);
    const needsPrimary = !primary || LEGACY_PRIMARY.includes(primary);
    const needsAccent = !accent || LEGACY_ACCENT.includes(accent);

    if (!needsPrimary && !needsAccent) continue;

    await Company.updateOne(
      { _id: c._id },
      {
        $set: {
          ...(needsPrimary ? { "application.themePrimaryColor": ENTERPRISE_PRIMARY } : {}),
          ...(needsAccent ? { "application.themeAccentColor": ENTERPRISE_ACCENT } : {}),
        },
      }
    );
    updated += 1;
    console.log(
      `Updated ${c.companyCode || c._id}: primary ${app.themePrimaryColor || "(empty)"} → ${ENTERPRISE_PRIMARY}`
    );
  }

  console.log(`\nDone. ${updated} of ${companies.length} companies updated.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
