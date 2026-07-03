/**
 * One-off migration: backfills `siteType` on Blog documents created before
 * this field existed. Existing blogs (from the original captions/love site)
 * are assumed to be "love" content — change the DEFAULT_SITE_TYPE below if
 * that's not correct for your data, or update specific documents manually.
 *
 * Run with: npx ts-node src/scripts/migrateSiteType.ts
 */
import "dotenv/config";
import mongoose from "mongoose";
import Blog from "../models/Blog";

const DEFAULT_SITE_TYPE = "love";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const result = await Blog.updateMany(
    { siteType: { $exists: false } },
    { $set: { siteType: DEFAULT_SITE_TYPE } }
  );

  console.log(`Updated ${result.modifiedCount} blog(s) with siteType="${DEFAULT_SITE_TYPE}"`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
