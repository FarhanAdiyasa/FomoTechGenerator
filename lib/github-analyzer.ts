import axios from "axios";
import { DetectedOutdatedFlag, ExtractedRepoData, UserTechProfile } from "./types";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_API_KEY;

// Curated 2026 Tech Knowledge Base: Flagged legacy libraries & modern replacements
const KNOWN_LEGACY_MAP: Record<string, { recommended: string; reason: string; category: DetectedOutdatedFlag['category']; severity: DetectedOutdatedFlag['severity'] }> = {
  "moment": {
    recommended: "date-fns / dayjs / native Intl",
    reason: "Deprecated since 2020. Adds ~70KB to bundle size and mutates objects.",
    category: "utility",
    severity: "warning"
  },
  "create-react-app": {
    recommended: "Vite / Next.js / TanStack Start",
    reason: "Officially abandoned. Riddled with stale Webpack 4/5 dependencies and security CVEs.",
    category: "build",
    severity: "critical"
  },
  "react-scripts": {
    recommended: "Vite / Next.js / Turbopack",
    reason: "CRA runner deprecated years ago. Slow HMR and rigid configuration.",
    category: "build",
    severity: "critical"
  },
  "webpack": {
    recommended: "Vite / Turbopack / Rspack",
    reason: "Maintaining a 300-line webpack.config.js in 2026 is pure masochism.",
    category: "build",
    severity: "warning"
  },
  "classnames": {
    recommended: "clsx / tailwind-merge",
    reason: "clsx is 6x smaller, faster, and tailwind-merge eliminates conflicting classes.",
    category: "utility",
    severity: "info"
  },
  "tslint": {
    recommended: "typescript-eslint / Biome",
    reason: "Deprecated in 2019. Lacks support for any modern TypeScript features.",
    category: "build",
    severity: "critical"
  },
  "node-sass": {
    recommended: "sass-embedded / Tailwind CSS",
    reason: "Deprecated since 2020. Constantly breaks C++ node-gyp bindings on modern Node versions.",
    category: "style",
    severity: "critical"
  },
  "@material-ui/core": {
    recommended: "shadcn/ui / Tailwind CSS / MUI v5+",
    reason: "MUI v4 was superseded years ago. Runtime styles conflict with modern React 19.",
    category: "style",
    severity: "warning"
  },
  "enzyme": {
    recommended: "Vitest + React Testing Library",
    reason: "Completely dead for React 18/19. Shallow rendering is an anti-pattern.",
    category: "build",
    severity: "critical"
  },
  "bower": {
    recommended: "pnpm / npm / yarn",
    reason: "Fossil-tier package manager from 2013.",
    category: "build",
    severity: "critical"
  },
  "gulp": {
    recommended: "Vite / npm scripts / Bun",
    reason: "Stream pipelines from 2014. Modern bundlers do this natively.",
    category: "build",
    severity: "warning"
  },
  "grunt": {
    recommended: "Vite / npm scripts / Bun",
    reason: "Ancient task runner. Belongs in a museum.",
    category: "build",
    severity: "critical"
  },
  "jquery": {
    recommended: "Native Web APIs / modern component framework",
    reason: "DOM manipulation in 2026? Modern browsers have native querySelector and Fetch.",
    category: "framework",
    severity: "critical"
  },
  "lodash": {
    recommended: "es-toolkit / native JavaScript methods",
    reason: "es-toolkit is up to 97% smaller and 2-3x faster than legacy lodash.",
    category: "utility",
    severity: "info"
  },
  "styled-components": {
    recommended: "Tailwind CSS / CSS Modules / StyleX",
    reason: "Runtime CSS-in-JS injects style tags on the client, crippling RSC and SSR performance.",
    category: "style",
    severity: "info"
  }
};

function getHeaders(useAuth = true): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "FomoTech-Analyzer-2026",
    Accept: "application/vnd.github.v3+json",
  };
  if (useAuth && GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN.trim()}`;
  }
  return headers;
}

async function fetchGithubApi(url: string, useAuth = true): Promise<any> {
  try {
    const response = await axios.get(url, { headers: getHeaders(useAuth), timeout: 10000 });
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401 && useAuth) {
      console.warn("GitHub token invalid or unauthorized, retrying unauthenticated...");
      return fetchGithubApi(url, false);
    }
    if (status === 404) return null;
    if (status === 403) {
      const resetTime = error.response?.headers["x-ratelimit-reset"];
      console.warn(`GitHub rate limit hit. Reset at: ${resetTime}`);
      throw new Error("GITHUB_RATE_LIMIT");
    }
    throw error;
  }
}

async function fetchRawFile(username: string, repo: string, branch: string, filepath: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${filepath}`;
  try {
    const response = await axios.get(url, { timeout: 6000 });
    return typeof response.data === "object" ? JSON.stringify(response.data) : String(response.data);
  } catch {
    return null;
  }
}

export async function analyzeUserGithub(username: string): Promise<UserTechProfile> {
  const cleanUsername = username.trim().replace(/^@/, "");
  if (!cleanUsername) {
    throw new Error("Username is required");
  }

  // 1. Fetch user profile
  const user = await fetchGithubApi(`${GITHUB_API_URL}/users/${cleanUsername}`);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // 2. Fetch recent repositories
  const repos = await fetchGithubApi(`${GITHUB_API_URL}/users/${cleanUsername}/repos?per_page=15&sort=pushed&direction=desc`);
  if (!Array.isArray(repos) || repos.length === 0) {
    throw new Error("NO_PUBLIC_REPOS");
  }

  // Select up to 5 non-fork active repos (or include forks if user only has forks)
  const candidateRepos = repos.filter((r: any) => !r.fork).slice(0, 5);
  const targetRepos = candidateRepos.length > 0 ? candidateRepos : repos.slice(0, 5);

  const analyzedRepos: ExtractedRepoData[] = [];
  const allLanguagesMap: Record<string, number> = {};
  const allLibrariesSet = new Set<string>();
  const allLegacyFlagsMap = new Map<string, DetectedOutdatedFlag>();

  for (const repo of targetRepos) {
    const defaultBranch = repo.default_branch || "main";
    let hasPackageJson = false;
    let hasRequirements = false;
    let hasCargoToml = false;
    let hasGoMod = false;
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    let scripts: Record<string, string> = {};
    const repoLegacyFlags: DetectedOutdatedFlag[] = [];

    // Try fetching package.json
    let pkgRaw = await fetchRawFile(cleanUsername, repo.name, defaultBranch, "package.json");
    if (!pkgRaw && defaultBranch !== "master") {
      pkgRaw = await fetchRawFile(cleanUsername, repo.name, "master", "package.json");
    }

    if (pkgRaw) {
      try {
        const pkg = typeof pkgRaw === "string" ? JSON.parse(pkgRaw) : pkgRaw;
        hasPackageJson = true;
        dependencies = pkg.dependencies || {};
        devDependencies = pkg.devDependencies || {};
        scripts = pkg.scripts || {};

        const allDeps = { ...dependencies, ...devDependencies };
        for (const [depName, version] of Object.entries(allDeps)) {
          allLibrariesSet.add(depName);

          // Check known legacy
          if (KNOWN_LEGACY_MAP[depName]) {
            const flag: DetectedOutdatedFlag = {
              name: depName,
              foundVersion: String(version),
              recommended: KNOWN_LEGACY_MAP[depName].recommended,
              reason: KNOWN_LEGACY_MAP[depName].reason,
              category: KNOWN_LEGACY_MAP[depName].category,
              severity: KNOWN_LEGACY_MAP[depName].severity,
            };
            repoLegacyFlags.push(flag);
            allLegacyFlagsMap.set(depName, flag);
          }

          // Check Redux without toolkit
          if (depName === "redux" && !allDeps["@reduxjs/toolkit"]) {
            const flag: DetectedOutdatedFlag = {
              name: "redux (standalone)",
              foundVersion: String(version),
              recommended: "Zustand / TanStack Query / Redux Toolkit",
              reason: "Raw legacy Redux boilerplate without Redux Toolkit or Zustand in 2026 is painful.",
              category: "state",
              severity: "warning",
            };
            repoLegacyFlags.push(flag);
            allLegacyFlagsMap.set("redux (standalone)", flag);
          }

          // Check ancient React versions
          if (depName === "react" && typeof version === "string") {
            if (version.includes("16.") || version.includes("17.")) {
              const flag: DetectedOutdatedFlag = {
                name: `React ${version}`,
                foundVersion: String(version),
                recommended: "React 19+",
                reason: "Running React 16/17 means you miss out on Server Components, Actions, and modern hooks.",
                category: "framework",
                severity: "critical",
              };
              repoLegacyFlags.push(flag);
              allLegacyFlagsMap.set(`React ${version}`, flag);
            }
          }

          // Check ancient Next.js
          if (depName === "next" && typeof version === "string") {
            if (version.includes("12.") || version.includes("13.")) {
              const flag: DetectedOutdatedFlag = {
                name: `Next.js ${version}`,
                foundVersion: String(version),
                recommended: "Next.js 15+ / Turbopack",
                reason: "Ancient Next.js version lacking Server Actions, Turbopack, and async request APIs.",
                category: "framework",
                severity: "warning",
              };
              repoLegacyFlags.push(flag);
              allLegacyFlagsMap.set(`Next.js ${version}`, flag);
            }
          }
        }
      } catch {
        // Corrupted or non-standard package.json
      }
    }

    // Check non-JS ecosystems
    const reqRaw = await fetchRawFile(cleanUsername, repo.name, defaultBranch, "requirements.txt");
    if (reqRaw) {
      hasRequirements = true;
      allLibrariesSet.add("Python ecosystem");
      if (reqRaw.includes("flask") && !reqRaw.includes("fastapi")) {
        const flag: DetectedOutdatedFlag = {
          name: "Flask (synchronous)",
          recommended: "FastAPI / Litestar",
          reason: "FastAPI gives native Pydantic validation, async OpenAPI, and 3x performance over classic Flask.",
          category: "framework",
          severity: "info",
        };
        repoLegacyFlags.push(flag);
        allLegacyFlagsMap.set("Flask (synchronous)", flag);
      }
    }

    const cargoRaw = await fetchRawFile(cleanUsername, repo.name, defaultBranch, "Cargo.toml");
    if (cargoRaw) {
      hasCargoToml = true;
      allLibrariesSet.add("Rust ecosystem");
    }

    const goRaw = await fetchRawFile(cleanUsername, repo.name, defaultBranch, "go.mod");
    if (goRaw) {
      hasGoMod = true;
      allLibrariesSet.add("Go ecosystem");
    }

    // Fetch language stats
    const languages = await fetchGithubApi(`${GITHUB_API_URL}/repos/${cleanUsername}/${repo.name}/languages`);
    if (languages && typeof languages === "object") {
      for (const [lang, bytes] of Object.entries(languages)) {
        allLanguagesMap[lang] = (allLanguagesMap[lang] || 0) + (typeof bytes === "number" ? bytes : 0);
      }
    }

    analyzedRepos.push({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count || 0,
      fork: Boolean(repo.fork),
      pushedAt: repo.pushed_at,
      primaryLanguage: repo.language,
      languages: languages && typeof languages === "object" ? languages : {},
      hasPackageJson,
      hasRequirements,
      hasCargoToml,
      hasGoMod,
      dependencies,
      devDependencies,
      scripts,
      detectedOutdatedFlags: repoLegacyFlags,
    });
  }

  // Sort top languages by bytes
  const topLanguages = Object.entries(allLanguagesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .slice(0, 5);

  const allLegacyFlags = Array.from(allLegacyFlagsMap.values());

  return {
    username: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    publicRepos: user.public_repos || targetRepos.length,
    analyzedRepos,
    topLanguages,
    totalDependenciesDetected: allLibrariesSet.size,
    detectedLegacyCount: allLegacyFlags.length,
    allLegacyFlags,
    allLibraries: Array.from(allLibrariesSet),
  };
}
