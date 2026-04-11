import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global connection state for Vercel
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
    },
  ],
});

// Avoid re-compiling models in serverless environment
const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

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

// Environment Logic
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, () => {
      console.log(`Development server running at http://localhost:${PORT}`);
    });
  };
  startServer();
} else {
  // Production (Vercel) static serving
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
