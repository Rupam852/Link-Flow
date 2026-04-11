import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const profileSchema = new mongoose.Schema({
  avatarUrl: String,
});

// Use flexible schema to only target avatarUrl without enforcing strict schemas
const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23111827'/%3E%3Ccircle cx='100' cy='75' r='35' fill='%2338BDF8'/%3E%3Cpath d='M45 190 C45 110, 155 110, 155 190 Z' fill='%2338BDF8'/%3E%3C/svg%3E";

async function cleanDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env file");
    process.exit(1);
  }

  // Extract credentials from the SRV URI since Windows DNS blocks SRV lookups
  // We use the resolved shard hostnames directly instead
  const credMatch = MONGODB_URI.match(/mongodb\+srv:\/\/([^@]+)@/);
  const credentials = credMatch ? credMatch[1] : null;
  const dbMatch = MONGODB_URI.match(/\.mongodb\.net\/(.+?)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : '';
  const appMatch = MONGODB_URI.match(/appName=([^&]+)/);
  const appName = appMatch ? appMatch[1] : '';

  // Direct replicaSet URI using resolved shard hostnames (bypasses SRV DNS)
  const directUri = credentials
    ? `mongodb://${credentials}@ac-nhkb43n-shard-00-00.yp8pge5.mongodb.net:27017,ac-nhkb43n-shard-00-01.yp8pge5.mongodb.net:27017,ac-nhkb43n-shard-00-02.yp8pge5.mongodb.net:27017/?ssl=true&replicaSet=atlas-yvz8gf-shard-0&authSource=admin&retryWrites=true`
    : MONGODB_URI;

  console.log("📡 Using direct shard connection to bypass Windows DNS SRV issue...");

  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(directUri, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    // Fetch profiles that have a Data URI (base64) format. 
    // We ignore Cloudinary or Google URLs because they start with https://
    const profilesToCheck = await Profile.find({ avatarUrl: { $regex: /^data:image/ } });
    
    let cleanedCount = 0;
    for (const profile of profilesToCheck) {
      // If the string length is > 1000 characters, it's definitely a raw uploaded photo base64
      // The default SVG avatar is tiny (~200 chars), so it will safely be ignored!
      if (profile.avatarUrl && profile.avatarUrl.length > 1000) {
        console.log(`🧹 Cleaning bloated photo data for profile ID: ${profile._id}...`);
        profile.avatarUrl = DEFAULT_AVATAR; // Reset to tiny default avatar
        await profile.save();
        cleanedCount++;
      }
    }

    console.log(`\n🎉 Success! Cleaned up ${cleanedCount} bloated profiles.`);
    console.log("   Your MongoDB instance has been stripped of base64 photos and your storage limit is recovered!");

  } catch (err) {
    console.error("❌ Error while cleaning database:", err);
  } finally {
    process.exit(0);
  }
}

cleanDatabase();
