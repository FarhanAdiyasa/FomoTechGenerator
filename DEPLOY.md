# Deploying FomoTech Generator

This app uses Next.js 15, Google Gemini API, and GitHub API. The best place to deploy is **Vercel**.

## 🚀 Steps to Deploy

1.  **Push Code to GitHub**
    *   (Already done! Ensure your repo is up to date).

2.  **Go to Vercel**
    *   Log in to [vercel.com](https://vercel.com).
    *   Click **"Add New..."** -> **"Project"**.
    *   Import your `FomoTechGenerator` repository.

3.  **Configure Environment Variables (CRITICAL)**
    *   Before clicking "Deploy", verify the **Environment Variables** section.
    *   Add the following keys (copy values from your local `.env` file):
        *   `GEMINI_API_KEY`
        *   `GITHUB_API_KEY`

4.  **Deploy**
    *   Click **Deploy**.
    *   Wait ~1 minute.
    *   Done! Your savage AI roaster is live.

## ⚠️ Important Note on Rate Limits
*   **Public Traffic**: Since you are using a shared API Key (Free Tier), if hundreds of people use your app simultaneously, you might hit the "Quota Exceeded" error (429).
*   **Optimization**: We have optimized the backend to use **Single-Shot Analysis** (1 Gemini call per user) and **Caching** (results cached for 24h), which effectively increases your capacity to ~20 requests/minute.
*   **Upgrade**: If your app goes viral, consider upgrading the Gemini API to Pay-as-you-go.

## 🐛 Troubleshooting
*   If you see "Quota or Error" in production, check your Vercel Logs (`Functions` tab).
*   If caching behaves weirdly, redeploy (which clears server cache) or wait 24h.
