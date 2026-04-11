import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log("Connected to MongoDB"))
      .catch((err) => console.error("MongoDB connection error:", err));
  } else {
    console.warn("MONGODB_URI not found in environment variables. Database features will be disabled.");
  }

  // Profile Schema
  const profileSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    uid: { type: String, required: true, unique: true },
    email: String,
    displayName: String,
    bio: String,
    avatarUrl: String,
    links: [{
      title: String,
      url: String,
      icon: String
    }],
    theme: {
      backgroundColor: { type: String, default: "#ffffff" },
      textColor: { type: String, default: "#000000" },
      buttonColor: { type: String, default: "#000000" },
      buttonTextColor: { type: String, default: "#ffffff" }
    }
  });

  const Profile = mongoose.model("Profile", profileSchema);

  // API Routes
  app.get("/api/profiles/:username", async (req, res) => {
    try {
      const profile = await Profile.findOne({ username: req.params.username });
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/profiles/uid/:uid", async (req, res) => {
    try {
      const profile = await Profile.findOne({ uid: req.params.uid });
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const profile = new Profile(req.body);
      await profile.save();
      res.status(201).json(profile);
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Username already taken" });
      }
      res.status(400).json({ error: "Error creating profile" });
    }
  });

  app.put("/api/profiles/:username", async (req, res) => {
    try {
      const profile = await Profile.findOneAndUpdate(
        { username: req.params.username },
        req.body,
        { new: true, runValidators: true }
      );
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Username already taken" });
      }
      res.status(400).json({ error: "Error updating profile" });
    }
  });

  app.put("/api/profiles/uid/:uid", async (req, res) => {
    try {
      const profile = await Profile.findOneAndUpdate(
        { uid: req.params.uid },
        req.body,
        { new: true, upsert: true, runValidators: true }
      );
      res.json(profile);
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "Username already taken" });
      }
      res.status(400).json({ error: "Error updating profile" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
