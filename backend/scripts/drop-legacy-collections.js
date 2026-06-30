import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const FRAMEWORK_COLLECTIONS = new Set([
  "Company",
  "Role",
  "User",
  "MenuItem",
  "MenuIcon",
  "Location",
  "SubLocation",
  "MasterData",
  "Notification",
  "EmailConfig",
  "AuditLog",
  "FileUpload",
]);

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  console.log(`[cleanup] Connecting to ${uri}`);
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name).sort();

  console.log(`\n[cleanup] Found ${names.length} collection(s):\n`);

  const toDrop = [];
  const toKeep = [];

  for (const name of names) {
    if (FRAMEWORK_COLLECTIONS.has(name)) {
      toKeep.push(name);
      console.log(`  KEEP   ${name}`);
    } else {
      toDrop.push(name);
      console.log(`  DROP   ${name}`);
    }
  }

  console.log(`\n[cleanup] Keeping ${toKeep.length}, dropping ${toDrop.length}\n`);

  const results = [];
  for (const name of toDrop) {
    try {
      const stats = await db.collection(name).stats();
      const docCount = stats.count ?? 0;
      await db.dropCollection(name);
      results.push({ name, status: "dropped", documents: docCount });
      console.log(`  Dropped: ${name} (${docCount} document(s))`);
    } catch (err) {
      results.push({ name, status: "error", error: err.message });
      console.log(`  Error:   ${name} — ${err.message}`);
    }
  }

  console.log("\n========== SUMMARY ==========\n");
  console.log(`Database:    ${uri.split("/").pop()}`);
  console.log(`Before:      ${names.length} collection(s)`);
  console.log(`Dropped:     ${results.filter((r) => r.status === "dropped").length}`);
  console.log(`Kept:        ${toKeep.length}`);
  console.log(`Remaining:   ${toKeep.length} collection(s)\n`);

  console.log("Kept collections:");
  toKeep.forEach((n) => console.log(`  - ${n}`));

  if (results.length) {
    console.log("\nDropped collections:");
    results
      .filter((r) => r.status === "dropped")
      .forEach((r) => console.log(`  - ${r.name} (${r.documents} docs)`));
  }

  const errors = results.filter((r) => r.status === "error");
  if (errors.length) {
    console.log("\nErrors:");
    errors.forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }

  console.log("\n[cleanup] Done.\n");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
