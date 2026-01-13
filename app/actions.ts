'use server'

import axios, { AxiosError } from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { unstable_cache } from "next/cache";
import { kv } from "@vercel/kv";

// Quota config
const DAILY_TOKEN_LIMIT = 50; // Set a safe daily limit for free tier
const QUOTA_KEY = "fomotech_daily_quota";

// Configuration
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PER_PAGE = 30;
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in .env");
}

// --- Helper Functions ---

async function fetchGeminiAPI(
    prompt: string,
    retries: number = MAX_RETRIES,
    delay: number = INITIAL_DELAY
): Promise<string> {
    const safeGenAI = new GoogleGenerativeAI((GEMINI_API_KEY || "").trim());
    const model = safeGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error(`Gemini API attempt ${attempt} failed:`, error.message);
            // Handle quota/limit hit specifically
            if (error.message?.includes("429") || error.message?.includes("Quota")) {
                if (attempt < retries) {
                    console.warn(`Gemini Quota hit. Waiting ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2;
                    continue;
                }
                throw new Error("QUOTA_LIMIT_REACHED");
            }
        }
    }
    throw new Error("Gemini API request failed. Please try again later.");
}

async function fetchWithRateLimit(url: string) {
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        });
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 403 && error.response?.headers["x-ratelimit-remaining"] === "0") {
            const resetTime = parseInt(error.response?.headers["x-ratelimit-reset"], 10) * 1000;
            const delay = Math.max(0, resetTime - Date.now()) + 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchWithRateLimit(url);
        }
        // Ignore 404s for contents/languages
        if (error.response?.status === 404) return [];
        throw error;
    }
}

async function fetchRepoList(username: string) {
    const repositories = [];
    let page = 1;
    // Fetch up to 10 repos (limit for context size)
    while (repositories.length < 10) {
        const url = `${GITHUB_API_URL}/users/${username}/repos?per_page=${PER_PAGE}&page=${page}`;
        const batch = await fetchWithRateLimit(url);
        if (!Array.isArray(batch)) break;
        repositories.push(...batch);
        if (batch.length < PER_PAGE) break;
        page++;
    }
    // Sort by updated_at desc to get recent active repos
    repositories.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return repositories.slice(0, 3); // Analyze top 3 active repos
}

// --- Main Logic (Single Shot Optimization) ---

async function performRoast(username: string) {
    if (!username) throw new Error("Username required");

    // 1. Fetch Repos
    const repositories = await fetchRepoList(username);
    if (repositories.length === 0) throw new Error("No public repositories found.");

    let summaryContext = `Target Username: ${username}\n\n`;

    // 2. Collect Data (Github API only - Fast & High Limit)
    for (const repo of repositories) {
        summaryContext += `Repository: ${repo.name}\n`;
        summaryContext += `Description: ${repo.description || "None"}\n`;

        // Fetch Languages
        const languagesCtx = await fetchWithRateLimit(`${GITHUB_API_URL}/repos/${username}/${repo.name}/languages`);
        if (languagesCtx && typeof languagesCtx === 'object') {
            const topLangs = Object.keys(languagesCtx).slice(0, 5).join(", ");
            summaryContext += `Languages: ${topLangs}\n`;
        }

        // Fetch Top Level Files (to guess framework)
        const contents = await fetchWithRateLimit(`${GITHUB_API_URL}/repos/${username}/${repo.name}/contents`);
        if (Array.isArray(contents)) {
            const files = contents
                .filter((f: any) => f.type === "file")
                .map((f: any) => f.name)
                .slice(0, 15) // Limit files per repo
                .join(", ");
            summaryContext += `Files: ${files}\n`;
        }
        summaryContext += "\n---\n";
    }

    // 3. Single Gemini Call (Roast) using Optimized God-Tier Prompt
    // Incremental Quota Tracking
    try {
        const currentQuota = await kv.get<number>(QUOTA_KEY) || 0;
        if (currentQuota >= DAILY_TOKEN_LIMIT) {
            throw new Error("QUOTA_LIMIT_REACHED");
        }
        await kv.incr(QUOTA_KEY);
    } catch (kvError) {
        console.warn("KV Quota tracking failed, proceeding anyway:", kvError);
    }

    const prompt = `
    You are a battle-hardened senior dev who's seen it all. You're brutally honest, opinionated AF, and don't sugarcoat. 
    Your mission: Scan this GitHub data, detect legacy crap, and hit 'em with a funny, painful, truthful roast that screams "YOU'RE REALLY MISSING OUT" in 2026.

    Raw data from user's top repos:
    ${summaryContext}

    Constraints:
    - MAXIMUM 300 words. Be extremely punchy.
    - Format strictly:
      **Detected Stack:** Bullet list.
      **Tech FOMO Score: XX/100** (1 savage sentence why).
      **The Roast:** 2 blocks of pure fire.
      **Upgrade or Die:** 3 prioritized, specific recs.
      **CTA:** 1 viral hook.
    - No fluff. Bold key phrases with **. Use tech slang carefully. Make it addictive to read.
    `;

    return await fetchGeminiAPI(prompt.trim());
}

// --- Exported Server Action ---

export const generateRoastAction = async (username: string) => {
    const cachedRoast = unstable_cache(
        async (u) => performRoast(u),
        ['fomo-tech-roast-v5'], // Iterated version
        {
            revalidate: 86400, // 24 hours
            tags: [`roast - ${username} `]
        }
    );

    try {
        const result = await cachedRoast(username);
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Roast Action Error:", e.message);

        if (e.message === "QUOTA_LIMIT_REACHED") {
            return {
                success: false,
                type: 'QUOTA',
                error: "FomoTech is overheating! 🔥 AI-nya lagi capek nge-roast orang karena kuota Gemini-nya abis kesedot lu pada. Coba lagi besok atau tag gw di LinkedIn biar gw isi bensin!",
            };
        }

        return {
            success: false,
            error: "GitHub API atau Gemini kayaknya lagi ngambek. Coba cek lagi username-nya bener apa nggak, atau coba lagi sedetik kemudian. 🦖"
        };
    }
}

export const getQuotaStatus = async () => {
    try {
        const count = await kv.get<number>(QUOTA_KEY) || 0;
        const percentage = Math.min(100, Math.round((count / DAILY_TOKEN_LIMIT) * 100));
        return { count, limit: DAILY_TOKEN_LIMIT, percentage };
    } catch (e) {
        return { count: 0, limit: DAILY_TOKEN_LIMIT, percentage: 0 };
    }
}
