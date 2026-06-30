import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  console.log(`[rename] Connecting to ${uri}`);
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const renames = [
    { from: "FinUser", to: "User" },
    { from: "FinRole", to: "Role" },
  ];

  for (const { from, to } of renames) {
    try {
      const exists = await db.listCollections({ name: from }).hasNext();
      if (!exists) {
        console.log(`  SKIP  ${from} (does not exist)`);
        continue;
      }
      const targetExists = await db.listCollections({ name: to }).hasNext();
      if (targetExists) {
        console.log(`  DROP  ${to} (already exists, dropping before rename)`);
        await db.dropCollection(to);
      }
      await db.collection(from).rename(to);
      console.log(`  OK    ${from} → ${to}`);
    } catch (err) {
      console.error(`  ERR   ${from} → ${to}: ${err.message}`);
    }
  }

  const remaining = (await db.listCollections().toArray()).map((c) => c.name).sort();
  console.log(`\nCollections now: ${remaining.join(", ")}`);
  await mongoose.disconnect();
  console.log("[rename] Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
