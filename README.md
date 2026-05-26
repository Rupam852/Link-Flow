<div align="center">
  <h1>📱 Link-Flow</h1>
  <p><strong>A Premium, High-Performance, and 100% Free Personal Bio-Link Platform</strong></p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" /></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>
</div>

---

## 🌟 Overview

**Link-Flow** is a modern, high-fidelity, and fully responsive personal profile & bio-link aggregator (a self-hosted, premium alternative to Linktree). It allows creators, developers, and professionals to build a stunning, fully-customized personal landing page, update links in real time with an interactive live dashboard mockup preview, and track link clicks with real-time analytics.

Built for maximum performance and cost efficiency, **Link-Flow** leverages a modern serverless stack to remain **100% free forever** while scaling seamlessly to support **200,000+ monthly visits**.

---

## ✨ Features

- **⚡ Live Dashboard Editor**: Add, edit, toggle, and re-order links with a real-time, pixel-perfect interactive smartphone preview mockup.
- **🎨 Infinite Styling & Customization**: Personalize display names, custom bios, avatar photos, custom backgrounds, gradient accents, button colors, and typography.
- **📊 Real-Time Analytics**: Built-in click tracking for each link with live counter updates on the dashboard.
- **📱 Pixel-Perfect Mobile Parity**: Custom font-sizes, fluid spacing, and optimized paddings align the editor mockup and the public page flawlessly across all devices.
- **🔒 Secure Authentication**: Instant sign-ups and secure password-less logins powered by Firebase Auth & Google Integration.
- **📈 Serverless & Infinite Scale**: Deployed fully on serverless architectures costing exactly **$0/month** to maintain.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React.js](https://react.dev/) + [Vite](https://vite.dev/) (Lightning-fast bundling & asset pipeline)
- **Styling & Theme Engine**: [Tailwind CSS](https://tailwindcss.com/) (Premium custom tokens, utility classes, and glassmorphic filters)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Smooth transitions, click reactions, and responsive modal animations)
- **Database & Authentication**: [Google Firebase](https://firebase.google.com/) (Firestore database, Realtime click synchronization, and Firebase Auth)
- **Deployment & Hosting**: [Vercel](https://vercel.com/) (Edge-optimized Content Delivery Network)

---

## 🚀 Getting Started

Follow these instructions to get your local development copy of Link-Flow up and running.

### 📋 Prerequisites

- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)

### ⚙️ Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rupam852/Link-Flow.git
   cd Link-Flow
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and copy the variables from `.env.example`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` to explore the dashboard.

---

## 📦 Deployment Guide

### 🚀 Deploying to Vercel

The repository includes a pre-configured `vercel.json` file optimized for React SPA routing. To deploy:

1. Install Vercel CLI or import the repository on the [Vercel Dashboard](https://vercel.com).
2. Set the environment variables in Vercel project configuration to match your `.env` values.
3. Deploy! Vercel will automatically run `npm run build` and build your production bundle under 5 seconds.

---

## 📊 Scale & Pricing Architecture

Link-Flow is architected on top of generous free-tier services, requiring **$0/month** to scale to massive volumes:

| Service | Tier / Plan | Free Limit | Estimated Cap |
| :--- | :--- | :--- | :--- |
| **Vercel CDN** | Hobby | **100 GB Bandwidth/mo** | ~200,000+ page views / month |
| **Firebase Auth** | Spark | **Unlimited Email/Google logins** | Infinite active users |
| **Firestore Database** | Spark | **50,000 Reads / day** | ~1,500,000 profile views / month |
| **Firestore Database** | Spark | **20,000 Writes / day** | ~600,000 link updates / month |
| **Firestore Storage** | Spark | **1 GB Storage** | ~1,000,000 profile accounts |

---

## 📄 License

This project is open-source and available under the **MIT License**. Created with ❤️ by [Rupam Bairagya](https://github.com/Rupam852).
