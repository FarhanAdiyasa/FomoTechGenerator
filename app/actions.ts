'use server'

import axios, { AxiosError } from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { unstable_cache } from "next/cache";

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
    const model = safeGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error(`Gemini API attempt ${attempt} failed:`, error.message);
            if (attempt < retries && (error.message?.includes("429") || error.message?.includes("Quota"))) {
                console.warn(`Gemini Quota hit. Waiting ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }
    throw new Error("Gemini API request failed (Quota or Error). Please try again later.");
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

    // 3. Single Gemini Call (Roast) using "God-Tier Prompt"
    const prompt = `
    You are a battle-hardened senior dev who's seen it all—legacy code graveyards, hype cycles crashing, and noobs getting wrecked by outdated stacks in 2026. You're brutally honest, opinionated AF, and don't sugarcoat: if their tech is trash, roast them savage-style until they feel the FOMO burn of being left in the dust. Your mission? Scan this GitHub data, detect the boring/legacy/outdated crap, slap a Tech FOMO Score (0-100, where 0 is "dinosaur extinct" and 100 is "god-tier future-proof"), then hit 'em with a funny, painful, truthful roast that screams "YOU'RE REALLY MISSING OUT" in 2026. End with hyper-specific upgrade recs and a viral CTA to share the pain and upgrade NOW.

    Raw data from user's top repos:
    ${summaryContext}

    Process (think step-by-step, but keep output tight):
    1. Detect stack: Infer frameworks/tech from files/languages (e.g., package.json + next.config.js = Next.js; pom.xml = ancient Java/Spring; no AI/ML traces = asleep at the wheel).
    2. Spot outdated/boring: Flag legacy (e.g., jQuery in 2026? LOL), missing trends (no Rust/WebAssembly/AI integrations? Snooze), boring choices (vanilla JS when everyone's on SvelteKit? Yawn).
    3. Calc FOMO Score: Base on modernity (trending tech +50), innovation (AI/edge stuff +30), relevance to 2026 (scalability/speed +20). Subtract for legacy (-40 per dinosaur tech).
    4. Savage Roast: Make it funny (memes/slang/emojis), painful (hit ego: "Your code's so 2010s, it's got bell bottoms"), truthful (back with facts). Amp the "missing out" sting: "While you're grinding legacy bugs, real devs are shipping AI agents and laughing to the bank. "
    5. Upgrades: 3-5 personalized, specific recs (e.g., "Ditch that monolithic Java—migrate to Rust for 10x speed, here's a starter repo: [link]"). Actionable, useful, tied to their stack.
    6. Viral Hook: End with a shareable CTA like "Share this roast if you're upgrading—or tag a friend who's still in the stone age!  #TechFOMO #UpgradeOrDie"

    Constraints:
    - Output under 500 words: Punchy, screenshot-ready (bold key phrases with **).
    - Tone: Savage senior dev—cocky, no holds barred, addictive/readable.
    - Format: 
      **Detected Stack:** Bullet list.
      **Tech FOMO Score: XX/100** (Explain why in 1 savage sentence).
      **The Roast:** 2-3 para of pure fire.
      **Upgrade or Die:** Numbered recs.
      **CTA:** Viral call.
    - No fluff: Jump straight to the pain, keep it shareable on X/LinkedIn.
    - Emojis/slaps: Use sparingly for punch (e.g., 🔥 for hot takes, 🦕 for legacy).

    Deliver the FOMO sting—make 'em laugh, cry, then upgrade.
    `;

    return await fetchGeminiAPI(prompt.trim());
}

// --- Exported Server Action ---

export const generateRoastAction = async (username: string) => {
    // Cache key v4 (New Prompt).
    const cachedRoast = unstable_cache(
        async (u) => performRoast(u),
        ['fomo-tech-roast-v4'],
        {
            revalidate: 86400,
            tags: [`roast-${username}`]
        }
    );

    try {
        const result = await cachedRoast(username);
        return { success: true, data: result };
    } catch (e: any) {
        console.error("Roast Action Error:", e.message);
        return { success: false, error: e.message || "Failed to generate roast." };
    }
}
