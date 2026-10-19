'use server';

import { unstable_cache } from "next/cache";
import { kv } from "@vercel/kv";
import { analyzeUserGithub } from "@/lib/github-analyzer";
import { generateRoastReport } from "@/lib/ai-roaster";
import { RoastReport } from "@/lib/types";

// Quota config
const DAILY_TOKEN_LIMIT = 200; // Increased capacity with multi-tier fallback
const QUOTA_KEY = "fomotech_daily_quota";

async function performStructuredRoast(username: string): Promise<RoastReport> {
  const cleanUsername = username.trim().replace(/^@/, "");
  if (!cleanUsername) throw new Error("USERNAME_REQUIRED");

  // Track quota metric if KV is configured
  try {
    await kv.incr(QUOTA_KEY);
  } catch (kvError) {
    // KV is optional in local or custom deployment
  }

  // 1. Analyze GitHub repos & dependencies forensically
  const profile = await analyzeUserGithub(cleanUsername);

  // 2. Generate structured roast report (Groq -> Gemini -> Deterministic Fallback)
  const report = await generateRoastReport(profile);

  return report;
}

export const getRoastReportAction = async (
  username: string
): Promise<{ success: boolean; report?: RoastReport; error?: string }> => {
  const clean = username.trim().toLowerCase().replace(/^@/, "");
  if (!clean) {
    return { success: false, error: "Please enter a valid GitHub username." };
  }

  const safeTag = clean.replace(/[^a-z0-9]/g, "-");

  const cachedRoast = unstable_cache(
    async (u: string) => performStructuredRoast(u),
    ["fomo-tech-roast-v7-structured"],
    {
      revalidate: 86400, // 24 hours
      tags: [`roast-report-${safeTag}`],
    }
  );

  try {
    const report = await cachedRoast(clean);
    return { success: true, report };
  } catch (err: any) {
    console.error("Roast execution error:", err?.message || err);

    if (err?.message === "USER_NOT_FOUND") {
      return { success: false, error: `GitHub user "@${clean}" does not exist. Check spelling!` };
    }
    if (err?.message === "NO_PUBLIC_REPOS") {
      return {
        success: false,
        error: `User "@${clean}" has no public repositories to analyze.`,
      };
    }
    if (err?.message === "GITHUB_RATE_LIMIT") {
      return {
        success: false,
        error: "GitHub API rate limit exceeded. Please wait a minute and retry.",
      };
    }

    return {
      success: false,
      error: "Could not complete GitHub tech audit. Please try again.",
    };
  }
};

// Backward-compatibility wrapper for legacy components
export const generateRoastAction = async (username: string) => {
  const result = await getRoastReportAction(username);
  if (!result.success || !result.report) {
    return { success: false, error: result.error || "An error occurred." };
  }

  const r = result.report;
  const legacyFormatted = `
**Detected Stack:**
${r.detectedStack.map((s) => `- ${s.category}: ${s.items.join(", ")}`).join("\n")}

**Tech FOMO Score: ${r.fomoScore}/100** (${r.fomoGrade}) - ${r.roastHeadline}

**The Roast:**
${r.roastBody.join("\n\n")}

**Upgrade or Die:**
${r.modernUpgrades.map((u) => `- **${u.current}** ➔ ${u.upgradeTo}: ${u.impact}`).join("\n")}

**Actionable Modernization Prompt:**
\`\`\`markdown
${r.actionableCursorPrompt}
\`\`\`
`.trim();

  return { success: true, data: legacyFormatted, report: r };
};

export const getQuotaStatus = async () => {
  try {
    const count = (await kv.get<number>(QUOTA_KEY)) || 0;
    const percentage = Math.min(100, Math.round((count / DAILY_TOKEN_LIMIT) * 100));
    return { count, limit: DAILY_TOKEN_LIMIT, percentage };
  } catch {
    return { count: 0, limit: DAILY_TOKEN_LIMIT, percentage: 0 };
  }
};
