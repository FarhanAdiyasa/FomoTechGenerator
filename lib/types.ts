export interface DetectedOutdatedFlag {
  name: string;
  foundVersion?: string;
  recommended: string;
  reason: string;
  category: 'build' | 'framework' | 'state' | 'style' | 'utility' | 'runtime';
  severity: 'critical' | 'warning' | 'info';
}

export interface ExtractedRepoData {
  name: string;
  description: string | null;
  stars: number;
  fork: boolean;
  pushedAt: string;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  hasPackageJson: boolean;
  hasRequirements: boolean;
  hasCargoToml: boolean;
  hasGoMod: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  detectedOutdatedFlags: DetectedOutdatedFlag[];
}

export interface UserTechProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  analyzedRepos: ExtractedRepoData[];
  topLanguages: string[];
  totalDependenciesDetected: number;
  detectedLegacyCount: number;
  allLegacyFlags: DetectedOutdatedFlag[];
  allLibraries: string[];
}

export interface ModernUpgrade {
  current: string;
  upgradeTo: string;
  impact: string;
}

export interface RoastReport {
  username: string;
  name?: string;
  avatarUrl: string;
  fomoScore: number; // 0-100 (higher = worse FOMO / more outdated)
  fomoGrade: 'S+' | 'A' | 'B' | 'C' | 'D' | 'Fossil';
  archetype: string;
  roastHeadline: string;
  roastBody: string[];
  detectedStack: {
    category: string;
    items: string[];
  }[];
  legacyFlags: {
    name: string;
    foundVersion?: string;
    modernAlternative: string;
    reason: string;
  }[];
  modernUpgrades: ModernUpgrade[];
  actionableCursorPrompt: string;
  analyzedAt: string;
}
