import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { RoastReport, UserTechProfile, ModernUpgrade } from "./types";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function calculateFomoGrade(score: number): RoastReport['fomoGrade'] {
  if (score <= 20) return 'S+';
  if (score <= 40) return 'A';
  if (score <= 60) return 'B';
  if (score <= 75) return 'C';
  if (score <= 89) return 'D';
  return 'Fossil';
}

function generateDeterministicRoast(profile: UserTechProfile): RoastReport {
  const legacyCount = profile.detectedLegacyCount;
  const legacyNames = profile.allLegacyFlags.map((f) => f.name);
  const topLangs = profile.topLanguages.slice(0, 3).join(", ") || "Code";

  // Calculate base score
  let score = 35 + legacyCount * 12;
  if (profile.allLegacyFlags.some((f) => f.name.includes("create-react-app") || f.name.includes("react-scripts"))) {
    score += 15;
  }
  if (profile.allLegacyFlags.some((f) => f.name.includes("webpack"))) {
    score += 10;
  }
  score = Math.min(99, Math.max(15, score));

  // Determine archetype
  let archetype = "Pragmatic Stack Builder";
  if (score >= 85) archetype = "Prehistoric 2018 Tutorial Hoarder";
  else if (score >= 70) archetype = "Legacy Enterprise Survivor";
  else if (score >= 50) archetype = "The Comfort Zone Specialist";
  else if (score >= 30) archetype = "Pragmatic Standard Dev";
  else archetype = "Bleeding Edge Trend Chaser";

  // Build punchlines
  const legacyListStr = legacyNames.length > 0 ? legacyNames.join(", ") : "suspiciously generic dependencies";
  const headline = legacyNames.length > 0
    ? `Still shipping ${legacyNames.slice(0, 2).join(" & ")} in 2026? Your build folder deserves a museum plaque.`
    : `Your repositories are remarkably safe, but we see that lurking desire to add another npm package.`;

  const paragraph1 = `We audited ${profile.analyzedRepos.length} of your repositories (${profile.analyzedRepos.map((r) => r.name).join(", ")}) and found ${profile.totalDependenciesDetected} dependencies across ${topLangs}. ${
    legacyNames.length > 0
      ? `You are still carrying ${legacyListStr}. The JavaScript ecosystem has had four existential crises and two bundler wars since those were modern.`
      : `You've managed to avoid the worst legacy sins, but your stack is dangerously close to tutorial-boilerplate territory.`
  }`;

  const paragraph2 = `Your GitHub activity proves you write code, but your tooling screams "I learned this from a Udemy course in 2020 and never looked back." If your CI/CD pipeline takes longer to install node_modules than it does to run tests, it's time to face the mirror.`;

  // Upgrades
  const modernUpgrades: ModernUpgrade[] = profile.allLegacyFlags.slice(0, 3).map((flag) => ({
    current: flag.name,
    upgradeTo: flag.recommended,
    impact: flag.reason,
  }));

  if (modernUpgrades.length === 0) {
    modernUpgrades.push({
      current: "Legacy configs",
      upgradeTo: "Biome / Turbopack / Vite 6",
      impact: "Instant sub-second hot reload and zero configuration bloat.",
    });
  }

  const detectedStack = [
    {
      category: "Languages",
      items: profile.topLanguages.length > 0 ? profile.topLanguages : ["JavaScript"],
    },
    {
      category: "Audited Repositories",
      items: profile.analyzedRepos.map((r) => `${r.name} (${r.primaryLanguage || "Repo"})`),
    },
    {
      category: "Detected Libraries",
      items: profile.allLibraries.slice(0, 10),
    },
  ];

  const cursorPrompt = `You are an elite Staff Engineer. Review our repository dependencies:
Current stack flags: ${legacyListStr}
Target modern replacements:
${modernUpgrades.map((u) => `- Replace ${u.current} with ${u.upgradeTo} (${u.impact})`).join("\n")}

Refactor the package manifests and imports to modern 2026 standards with zero regressions.`;

  return {
    username: profile.username,
    name: profile.name || profile.username,
    avatarUrl: profile.avatarUrl,
    fomoScore: score,
    fomoGrade: calculateFomoGrade(score),
    archetype,
    roastHeadline: headline,
    roastBody: [paragraph1, paragraph2],
    detectedStack,
    legacyFlags: profile.allLegacyFlags.map((f) => ({
      name: f.name,
      foundVersion: f.foundVersion,
      modernAlternative: f.recommended,
      reason: f.reason,
    })),
    modernUpgrades,
    actionableCursorPrompt: cursorPrompt,
    analyzedAt: new Date().toISOString(),
  };
}

async function callGroqAi(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("NO_GROQ_KEY");
  const client = new Groq({ apiKey: GROQ_API_KEY.trim() });
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"];

  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a brutally witty, battle-hardened senior tech lead roasting developer tech stacks in 2026. You MUST return strictly valid JSON matching the requested schema. No markdown formatting outside the JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      });
      const content = response.choices[0]?.message?.content;
      if (content) return content;
    } catch (e: any) {
      console.warn(`Groq model ${model} failed: ${e?.message}`);
    }
  }
  throw new Error("ALL_GROQ_MODELS_FAILED");
}

async function callGeminiAi(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("NO_GEMINI_KEY");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (e: any) {
      console.warn(`Gemini model ${modelName} failed: ${e?.message}`);
    }
  }
  throw new Error("ALL_GEMINI_MODELS_FAILED");
}

export async function generateRoastReport(profile: UserTechProfile): Promise<RoastReport> {
  const context = {
    username: profile.username,
    name: profile.name,
    repos: profile.analyzedRepos.map((r) => ({
      name: r.name,
      description: r.description,
      language: r.primaryLanguage,
      stars: r.stars,
      deps: Object.keys(r.dependencies).slice(0, 15),
      devDeps: Object.keys(r.devDependencies).slice(0, 10),
    })),
    topLanguages: profile.topLanguages,
    detectedLegacyFlags: profile.allLegacyFlags,
    totalAuditedDeps: profile.totalDependenciesDetected,
  };

  const prompt = `
Generate a savage, hilarious, and technically accurate "Tech FOMO Report" for developer @${profile.username} based on their real GitHub repositories.

Context from their actual codebases:
${JSON.stringify(context, null, 2)}

You must return a JSON object with this EXACT structure:
{
  "fomoScore": <number between 10 and 99, where 99 means their stack is hopelessly outdated and 10 means bleeding edge 2026>,
  "archetype": "<Funny, savage developer archetype, e.g. '2019 Tutorial Hoarder', 'Legacy Enterprise Dinosaur', 'CSS-in-JS Mourner', 'Vibe Coder Running On Vibes'>",
  "roastHeadline": "<One razor-sharp, hilarious one-liner roast>",
  "roastBody": [
    "<Paragraph 1 roasting their actual detected dependencies, frameworks, and habits>",
    "<Paragraph 2 roasting their architecture, package hoard, or lack of modern tooling>"
  ],
  "modernUpgrades": [
    {
      "current": "<Outdated tech they use or are close to using>",
      "upgradeTo": "<Modern 2026 replacement>",
      "impact": "<Why this upgrade matters in 1 punchy sentence>"
    }
  ],
  "actionableCursorPrompt": "<A copyable markdown prompt for Cursor/Claude Code to refactor their repo to 2026 standards>"
}

Strict requirements:
- Be savage, hilarious, and deeply knowledgeable about 2026 software engineering trends (React 19, Turbopack, Vite 6, Hono, Bun, Tailwind v4, TanStack Query, RSC).
- Call out their REAL dependencies and repo names from the context.
- Output ONLY valid JSON.
`;

  let jsonText = "";

  // 1. Try Groq (Primary)
  try {
    jsonText = await callGroqAi(prompt);
  } catch (groqErr: any) {
    console.warn("Groq AI failed, falling back to Gemini:", groqErr?.message || groqErr);
    // 2. Try Gemini (Fallback 1)
    try {
      jsonText = await callGeminiAi(prompt);
    } catch (geminiErr: any) {
      console.warn("Gemini AI failed, using deterministic high-signal fallback:", geminiErr?.message || geminiErr);
      // 3. Deterministic Fallback (Zero-Quota Crash Immunity)
      return generateDeterministicRoast(profile);
    }
  }

  try {
    const parsed = JSON.parse(jsonText);
    const score = typeof parsed.fomoScore === "number" ? Math.min(99, Math.max(10, parsed.fomoScore)) : 65;

    const detectedStack = [
      {
        category: "Top Languages",
        items: profile.topLanguages.length > 0 ? profile.topLanguages : ["JavaScript"],
      },
      {
        category: "Audited Repositories",
        items: profile.analyzedRepos.map((r) => `${r.name} (${r.primaryLanguage || "Repo"})`),
      },
      {
        category: "Detected Libraries",
        items: profile.allLibraries.slice(0, 12),
      },
    ];

    return {
      username: profile.username,
      name: profile.name || profile.username,
      avatarUrl: profile.avatarUrl,
      fomoScore: score,
      fomoGrade: calculateFomoGrade(score),
      archetype: parsed.archetype || "Tech Stack Survivor",
      roastHeadline: parsed.roastHeadline || "Your stack is stuck in a time capsule.",
      roastBody: Array.isArray(parsed.roastBody) ? parsed.roastBody : [String(parsed.roastBody)],
      detectedStack,
      legacyFlags: profile.allLegacyFlags.map((f) => ({
        name: f.name,
        foundVersion: f.foundVersion,
        modernAlternative: f.recommended,
        reason: f.reason,
      })),
      modernUpgrades: Array.isArray(parsed.modernUpgrades) && parsed.modernUpgrades.length > 0
        ? parsed.modernUpgrades
        : [
            {
              current: "Legacy bundler / deps",
              upgradeTo: "Vite 6 / Turbopack / Biome",
              impact: "Cuts build times by 80% and eliminates configuration fatigue.",
            },
          ],
      actionableCursorPrompt: parsed.actionableCursorPrompt || "Refactor this codebase to 2026 standards.",
      analyzedAt: new Date().toISOString(),
    };
  } catch (parseError) {
    console.error("Failed to parse AI JSON response, falling back to deterministic roast:", parseError);
    return generateDeterministicRoast(profile);
  }
}
