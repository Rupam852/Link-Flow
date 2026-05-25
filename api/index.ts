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
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB (Serverless Mode)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

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
  },
  isActive: { type: Boolean, default: true },
  links: [
    {
      id: String,
      title: String,
      url: String,
      icon: String,
      description: String,
      isActive: { type: Boolean, default: true },
      thumbnailUrl: String,
      clicks: { type: Number, default: 0 },
    },
  ],
});

// Avoid re-compiling models in serverless environment
const Profile = (mongoose.models.Profile || mongoose.model("Profile", profileSchema)) as any;

// API Routes
app.get("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();
    const profile = await Profile.findOne({ uid: req.params.uid });
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

app.get("/api/profiles/:username", async (req, res) => {
  try {
    await connectToDatabase();
    const profile = await Profile.findOne({ username: req.params.username });
    if (profile) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
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
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken-for-firebase%40system.gserviceaccount.com");
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
async function verifyFirebaseToken(req: any, expectedUid: string): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }
    const token = authHeader.split("Bearer ")[1];
    if (!token) return false;

    // 1. Decode JWT parts
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Helper to safely convert base64url to base64
    const base64UrlDecode = (str: string) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf8');
    };

    // 2. Decode header to find Key ID (kid)
    const header = JSON.parse(base64UrlDecode(headerB64));
    const kid = header.kid;
    if (!kid) return false;

    // 3. Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64));
    
    // 4. Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn("Token expired");
      return false;
    }
    
    // Verify subject matches expected UID
    if (payload.sub !== expectedUid) {
      console.warn("UID mismatch");
      return false;
    }

    // 5. Fetch Google certificates and verify signature
    const publicKeys = await fetchGooglePublicKeys();
    const cert = publicKeys[kid];
    if (!cert) {
      console.warn("Public key not found for kid:", kid);
      return false;
    }

    // Verify signature using crypto
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    
    // Base64url to standard Base64 conversion for signature buffer
    const sigBase64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const signature = Buffer.from(sigBase64, 'base64');
    const isSignatureValid = verifier.verify(cert, signature);
    
    return isSignatureValid;
  } catch (err) {
    console.error("Token verification failed:", err);
    return false;
  }
}

app.put("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();
    
    // Core Security: Verify authorized token matches targeted UID
    const isAuthorized = await verifyFirebaseToken(req, req.params.uid);
    if (!isAuthorized) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing token" });
    }

    const { _id, __v, ...updateData } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { uid: req.params.uid },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );
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
    const isAuthorized = await verifyFirebaseToken(req, req.params.uid);
    if (!isAuthorized) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing token" });
    }

    const result = await Profile.deleteOne({ uid: req.params.uid });
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

// ⚠️ TEMPORARY: One-time admin cleanup endpoint — REMOVE AFTER USE
app.get("/api/admin/clean-avatars", async (req: any, res: any) => {
  if (req.query.secret !== "linkflow-clean-2024") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    await connectToDatabase();
    const DEFAULT_AVATAR = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23111827'/%3E%3Ccircle cx='100' cy='75' r='35' fill='%2338BDF8'/%3E%3Cpath d='M45 190 C45 110, 155 110, 155 190 Z' fill='%2338BDF8'/%3E%3C/svg%3E";
    const bloated = await Profile.find({
      $and: [
        { avatarUrl: { $regex: /^data:image/ } },
        { $expr: { $gt: [{ $strLenCP: "$avatarUrl" }, 1000] } }
      ]
    });
    let cleaned = 0;
    for (const p of bloated) {
      await Profile.findByIdAndUpdate(p._id, { avatarUrl: DEFAULT_AVATAR });
      cleaned++;
    }
    res.json({ success: true, cleaned, total: bloated.length });
  } catch (err: any) {
    res.status(500).json({ error: "Cleanup failed", details: err.message });
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
