import mongoose from "mongoose";

const MONGO_URI =
  "mongodb+srv://idmshrms:Pass123@hrms-abstart.25ipjft.mongodb.net/idms-hrms-app";

async function main() {
  console.log(`[drop-all] Connecting to ${MONGO_URI.replace(/:([^@]+)@/, ":***@")}`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name).sort();

  if (!names.length) {
    console.log("[drop-all] No collections found. Database is already empty.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n[drop-all] Found ${names.length} collection(s):\n`);
  names.forEach((n) => console.log(`  - ${n}`));

  console.log(`\n[drop-all] Dropping all ${names.length} collection(s)...\n`);

  const results = [];
  for (const name of names) {
    try {
      await db.dropCollection(name);
      results.push({ name, status: "dropped" });
      console.log(`  Dropped: ${name}`);
    } catch (err) {
      results.push({ name, status: "error", error: err.message });
      console.log(`  Error:   ${name} — ${err.message}`);
    }
  }

  const dropped = results.filter((r) => r.status === "dropped").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log("\n========== SUMMARY ==========\n");
  console.log(`Database:  idms-hrms-app`);
  console.log(`Found:     ${names.length} collection(s)`);
  console.log(`Dropped:   ${dropped}`);
  console.log(`Errors:    ${errors}`);
  console.log(`Remaining: ${names.length - dropped} collection(s)\n`);

  if (errors) {
    console.log("Failed collections:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
  }

  console.log("[drop-all] Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
