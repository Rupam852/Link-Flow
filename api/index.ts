import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables. Please check your Vercel Dashboard Settings.");
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB (Serverless Mode)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Link Sub-Schema
const linkSchema = new mongoose.Schema({
  id: String,
  title: String,
  url: String,
  icon: String,
  description: String,
  isActive: { type: Boolean, default: true },
  thumbnailUrl: String,
  display: { type: String, default: 'list' },
  clicks: { type: Number, default: 0 },
  animation: { type: String, default: 'none' },
  embed: { type: Boolean, default: false },
  autoplay: { type: Boolean, default: false },
  embedType: { type: String, default: 'video' },
}, { _id: false, strict: false });

// Profile Schema
const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  uid: { type: String, required: true, unique: true },
  email: String,
  displayName: String,
  bio: String,
  avatarUrl: String,
  socialLinksStyle: { type: String, default: 'grid' },
  theme: {
    backgroundColor: String,
    textColor: String,
    buttonColor: String,
    buttonTextColor: String,
    buttonStyle: { type: String, default: 'rounded' },
    themeId: { type: String, default: 'classic' },
    backgroundImageUrl: { type: String, default: '' },
    backgroundBlur: { type: Number, default: 0 },
    backgroundOverlay: { type: Number, default: 0.35 },
  },
  isActive: { type: Boolean, default: true },
  emailCaptureEnabled: { type: Boolean, default: false },
  subscribers: [{ type: String }],
  links: [linkSchema],
}, { strict: false });

// Ensure any stale cached model in memory is cleared
if (mongoose.models && mongoose.models.Profile) {
  delete (mongoose.models as any).Profile;
}
const Profile = mongoose.model("Profile", profileSchema) as any;

// API Routes
app.get("/api/cron/keep-alive", async (req, res) => {
  try {
    await connectToDatabase();
    const state = mongoose.connection.readyState;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      databaseState: state === 1 ? "connected" : "disconnected"
    });
  } catch (err: any) {
    console.error("Cron keep-alive failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();
    const profile = await Profile.findOne({ uid: req.params.uid }).lean();
    if (profile) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.json(profile);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  } catch (err: any) {
    console.error("API GET Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message,
      hint: "Check if MONGODB_URI is correctly set in Vercel environment variables."
    });
  }
});

// In-memory caching for ultrafast public profile responses (sub-5ms)
const profileMemoryCache = new Map<string, { data: any; expiry: number }>();

app.get("/api/profiles/:username", async (req, res) => {
  try {
    const rawUsername = req.params.username;
    const username = rawUsername.toLowerCase();
    const isPoll = req.query.poll === 'true';
    const now = Date.now();

    // Serve from ultrafast memory cache for instant public loading
    if (!isPoll) {
      const cached = profileMemoryCache.get(username);
      if (cached && cached.expiry > now) {
        res.setHeader('Cache-Control', 'public, max-age=2, s-maxage=10, stale-while-revalidate=600');
        return res.json(cached.data);
      }
    }

    await connectToDatabase();
    const profile = await Profile.findOne({ username: rawUsername }).lean();
    if (profile) {
      if (!isPoll) {
        profileMemoryCache.set(username, { data: profile, expiry: now + 30000 }); // 30s cache
      }
      if (isPoll) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      } else {
        // Cache on CDN for 10 seconds, stale-while-revalidate for 10 minutes
        res.setHeader('Cache-Control', 'public, max-age=2, s-maxage=10, stale-while-revalidate=600');
      }
      res.json(profile);
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  } catch (err: any) {
    console.error("API GET username Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: err.message
    });
  }
});

app.post("/api/profiles/:username/links/click", async (req, res) => {
  try {
    await connectToDatabase();
    const { url, linkId } = req.body;
    const username = req.params.username;
    
    // First try updating matching link by unique id
    if (linkId) {
      const profile = await Profile.findOneAndUpdate(
        { username, "links.id": linkId },
        { $inc: { "links.$.clicks": 1 } },
        { new: true }
      );
      if (profile) return res.json({ success: true, profile });
    }

    // Fallback: match by URL
    const profile = await Profile.findOneAndUpdate(
      { username, "links.url": url },
      { $inc: { "links.$.clicks": 1 } },
      { new: true }
    );

    if (profile) {
      res.json({ success: true, profile });
    } else {
      res.status(404).json({ error: "Link or profile not found" });
    }
  } catch (err: any) {
    console.error("Click tracking error:", err);
    res.status(500).json({ error: "Failed to record click", details: err.message });
  }
});

// Cache for Google's public certificates to prevent fetching on every request
let googlePublicKeys: Record<string, string> = {};
let googleKeysExpiry = 0;

async function fetchGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (Object.keys(googlePublicKeys).length > 0 && now < googleKeysExpiry) {
    return googlePublicKeys;
  }

  try {
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
    if (!res.ok) return {};
    
    const data = await res.json();
    googlePublicKeys = data;
    
    // Parse cache-control header to determine expiry
    const cacheControl = res.headers.get("cache-control");
    let maxAge = 3600; // default 1 hour
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) maxAge = parseInt(match[1], 10);
    }
    googleKeysExpiry = now + maxAge * 1000;
    return googlePublicKeys;
  } catch (err) {
    console.error("Error fetching Google public keys:", err);
    return {};
  }
}

// Lightweight dynamic Firebase JWT verification helper using Google securetoken public endpoints
async function verifyFirebaseToken(req: any, expectedUid: string): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isValid: false, reason: "Missing or malformed Authorization header" };
    }
    const token = authHeader.split("Bearer ")[1];
    if (!token || token === "null" || token === "undefined") {
      return { isValid: false, reason: "Token is empty, null, or undefined" };
    }

    // 1. Decode JWT parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: `JWT does not have 3 parts (got ${parts.length})` };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // 2. Decode header to find Key ID (kid)
    let header;
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    } catch (e) {
      return { isValid: false, reason: "Failed to parse JWT Header" };
    }
    
    const kid = header.kid;
    if (!kid) {
      return { isValid: false, reason: "JWT Header is missing 'kid' field" };
    }

    // 3. Decode payload
    let payload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch (e) {
      return { isValid: false, reason: "Failed to parse JWT Payload" };
    }
    
    // 4. Verify audience and issuer to ensure the token belongs to our project
    if (payload.aud !== "fiem-484607") {
      return { isValid: false, reason: `Audience mismatch: expected 'fiem-484607' but got '${payload.aud}'` };
    }
    if (payload.iss !== "https://securetoken.google.com/fiem-484607") {
      return { isValid: false, reason: `Issuer mismatch: expected issuer for 'fiem-484607' but got '${payload.iss}'` };
    }

    // 5. Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { isValid: false, reason: `Token expired at ${payload.exp} (current time ${now})` };
    }
    
    // Verify subject matches expected UID
    if (payload.sub !== expectedUid) {
      return { isValid: false, reason: `UID mismatch: token sub '${payload.sub}' does not match expected '${expectedUid}'` };
    }

    // 6. Fetch Google certificates and verify signature
    const publicKeys = await fetchGooglePublicKeys();
    const cert = publicKeys[kid];
    if (!cert) {
      return { isValid: false, reason: `Public key certificate not found for Key ID '${kid}'` };
    }

    // Verify signature using crypto
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    
    let signature;
    try {
      signature = Buffer.from(signatureB64, 'base64url');
    } catch (e) {
      return { isValid: false, reason: "Signature buffer conversion failed" };
    }

    const isSignatureValid = verifier.verify(cert, signature);
    if (!isSignatureValid) {
      return { isValid: false, reason: "Cryptographic signature verification failed" };
    }
    
    return { isValid: true };
  } catch (err: any) {
    console.error("Token verification failed:", err);
    return { isValid: false, reason: `Catch error: ${err.message}` };
  }
}

app.put("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();
    
    // Core Security: Verify authorized token matches targeted UID
    const authResult = await verifyFirebaseToken(req, req.params.uid);
    if (!authResult.isValid) {
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or missing token", 
        reason: authResult.reason 
      });
    }

    const { _id, __v, ...updateData } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { uid: req.params.uid },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );
    profileMemoryCache.clear();
    res.json(profile);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already taken" });
    }
    res.status(400).json({ error: "Error updating profile", details: err.message });
  }
});

app.delete("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();

    // Core Security: Verify authorized token matches targeted UID
    const authResult = await verifyFirebaseToken(req, req.params.uid);
    if (!authResult.isValid) {
      return res.status(401).json({ 
        error: "Unauthorized: Invalid or missing token", 
        reason: authResult.reason 
      });
    }

    const result = await Profile.deleteOne({ uid: req.params.uid });
    profileMemoryCache.clear();
    if (result.deletedCount > 0) {
      res.json({ success: true, message: "Profile permanently deleted" });
    } else {
      res.status(404).json({ error: "Profile not found" });
    }
  } catch (err: any) {
    console.error("API DELETE Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Email Subscribers Routes
// 1. Public Subscribe Endpoint
app.post("/api/profiles/:username/subscribers", async (req, res) => {
  try {
    await connectToDatabase();
    const { email } = req.body;
    const username = req.params.username;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const profile = await Profile.findOneAndUpdate(
      { username },
      { $addToSet: { subscribers: cleanEmail } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    res.json({ success: true, message: "Successfully subscribed!" });
  } catch (err: any) {
    console.error("Subscriber API Error:", err);
    res.status(500).json({ error: "Failed to subscribe", details: err.message });
  }
});

// 2. Authenticated List Subscribers Endpoint
app.get("/api/profiles/:username/subscribers", async (req, res) => {
  try {
    await connectToDatabase();
    const username = req.params.username;
    const profile = await Profile.findOne({ username }).lean();

    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const authResult = await verifyFirebaseToken(req, profile.uid);
    if (!authResult.isValid) {
      return res.status(401).json({ error: "Unauthorized", reason: authResult.reason });
    }

    res.json({ success: true, subscribers: profile.subscribers || [] });
  } catch (err: any) {
    console.error("Get subscribers error:", err);
    res.status(500).json({ error: "Failed to retrieve subscribers", details: err.message });
  }
});

// 3. Authenticated Delete Subscriber Endpoint
app.delete("/api/profiles/:username/subscribers/:email", async (req, res) => {
  try {
    await connectToDatabase();
    const username = req.params.username;
    const emailToDelete = decodeURIComponent(req.params.email).toLowerCase().trim();
    const profile = await Profile.findOne({ username });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const authResult = await verifyFirebaseToken(req, profile.uid);
    if (!authResult.isValid) {
      return res.status(401).json({ error: "Unauthorized", reason: authResult.reason });
    }

    await Profile.updateOne(
      { username },
      { $pull: { subscribers: emailToDelete } }
    );

    res.json({ success: true, message: "Subscriber removed" });
  } catch (err: any) {
    console.error("Delete subscriber error:", err);
    res.status(500).json({ error: "Failed to delete subscriber", details: err.message });
  }
});

// Cloudinary: Delete old background image by URL
app.post("/api/cloudinary/delete", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    // Extract public_id from Cloudinary URL
    // Example URL: https://res.cloudinary.com/dg41yztls/image/upload/v1234567890/abcdef123.jpg
    const urlParts = imageUrl.split("/upload/");
    if (urlParts.length < 2) {
      return res.status(400).json({ error: "Invalid Cloudinary URL format" });
    }

    // Remove version prefix (e.g. "v1234567890/") if present, then strip extension
    const afterUpload = urlParts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const publicId = withoutVersion.replace(/\.[^/.]+$/, ""); // remove file extension

    if (!publicId) {
      return res.status(400).json({ error: "Could not extract public_id from URL" });
    }

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary credentials not configured on server" });
    }

    // Generate SHA1 signature: timestamp + public_id + api_secret
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

    // Call Cloudinary destroy API
    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      }
    );

    const data = await cloudinaryRes.json();

    if (data.result === "ok") {
      res.json({ success: true, result: data.result });
    } else {
      // not_found is not a hard error — image may have been manually deleted
      res.json({ success: true, result: data.result, note: "Image may not exist on Cloudinary" });
    }
  } catch (err: any) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ error: "Failed to delete image from Cloudinary", details: err.message });
  }
});


// Environment Logic
if (process.env.NODE_ENV !== "production") {
  // Use dynamic import so 'vite' isn't required at runtime on Vercel
  import("vite").then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, () => {
      console.log(`Development server running at http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Failed to start Vite dev server:", err);
  });
} else {
  // In Vercel, we do NOT serve static files from Express. 
  // Vercel Edge Network handles serving 'index.html' from the 'dist' folder automatically.
  // We only provide a 404 fallback for unhandled API routes to prevent hanging.
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: "API Route Not Found" });
    }
  });
}

// Export the app for Vercel Serverless
export default app;
