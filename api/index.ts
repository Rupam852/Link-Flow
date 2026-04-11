import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global connection state for Vercel Serverless
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables. Please check your Vercel Dashboard Settings.");
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
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
  links: [
    {
      title: String,
      url: String,
      icon: String,
      description: String,
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

app.put("/api/profiles/uid/:uid", async (req, res) => {
  try {
    await connectToDatabase();
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
