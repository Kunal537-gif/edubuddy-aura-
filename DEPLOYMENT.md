# 🚀 EduBuddy Aura — Cloud & Public Deployment Guide

Deploy **EduBuddy Aura** to the public internet so it is accessible from anywhere (smartphones, laptops, evaluators) without running on `localhost`.

---

## ⚡ Option 1: Instant Public HTTPS URL (Zero Setup, 10 Seconds)
If your app is already running locally and you want an instant, public HTTPS link to share right now without creating any accounts:

### Method A (Pinggy Tunnel — Recommended)
1. In the `EDUBUDDY-AURA` folder, double-click **`deploy_pinggy.bat`** (or run `ssh -p 443 -R0:localhost:8000 a.pinggy.io` in terminal).
2. It will display a live public URL in the terminal:
   ```text
   http://xxxxx.a.pinggy.link
   https://xxxxx.a.pinggy.link
   ```
3. Open that link on your phone or send it to anyone — it immediately opens your live EduBuddy Aura dashboard!

### Method B (Localhost.run)
1. Double-click **`deploy_tunnel.bat`** (or run `ssh -R 80:localhost:8000 nokey@localhost.run`).
2. It outputs an HTTPS address like: `https://xxxx.localhost.run`.

---

## ☁️ Option 2: Free 24/7 Permanent Cloud Hosting on Render (Recommended)
Render provides free permanent web hosting with automatic HTTPS and continuous deployment from GitHub.

1. **Push your code to GitHub**:
   - Create a repository on GitHub (e.g. `edubuddy-aura`).
   - Push this `EDUBUDDY-AURA` folder to GitHub.

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) and sign in with GitHub.
   - Click **New +** → **Web Service**.
   - Select your `edubuddy-aura` repository.
   - Render will auto-detect the configuration, or set:
     - **Name**: `edubuddy-aura`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `python run_server.py`
   - Under **Environment Variables**, add:
     - `GEMINI_API_KEY`: `AQ.Ab8RN6KulPJ0FlBQmGP90qb8UAjSJTbtyQKE0Dl5b3HSmBVEhA`
     - `GEMINI_MODEL`: `gemini-3.8-flash`
     - `HOST`: `0.0.0.0`
   - Click **Create Web Service**.

3. **Your Live URL**:
   Within 2 minutes, Render gives you a live permanent link:
   `https://edubuddy-aura.onrender.com`

---

## 🐳 Option 3: Deploy with Docker on Railway / Fly.io / Hugging Face Spaces

A production-grade [Dockerfile](file:///c:/Users/dell/Desktop/google%20antigravity/EDUBUDDY-AURA/Dockerfile) is pre-configured.

### On Hugging Face Spaces (100% Free Docker Hosting):
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** as the SDK.
3. Push or upload your repository.
4. Hugging Face automatically builds the `Dockerfile` and gives you a free permanent URL: `https://huggingface.co/spaces/YOUR_USERNAME/edubuddy-aura`.

### On Railway:
1. Go to [railway.app](https://railway.app) and click **New Project** → **Deploy from GitHub repo**.
2. Railway detects `Dockerfile` and deploys automatically in under 60 seconds!

---

## ▲ Option 4: Vercel (Serverless)
A [vercel.json](file:///c:/Users/dell/Desktop/google%20antigravity/EDUBUDDY-AURA/vercel.json) and [api/index.py](file:///c:/Users/dell/Desktop/google%20antigravity/EDUBUDDY-AURA/api/index.py) are pre-configured.

1. Install Vercel CLI or import your GitHub repo on [vercel.com](https://vercel.com).
2. Add your environment variable `GEMINI_API_KEY` in the Vercel dashboard.
3. Click **Deploy** to get `https://edubuddy-aura.vercel.app`.
