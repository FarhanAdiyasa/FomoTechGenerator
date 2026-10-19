"use client";

import { useState } from "react";
import { RoastReport } from "@/lib/types";
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Flame, 
  AlertTriangle, 
  Sparkles, 
  Terminal, 
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

export default function RoastCard({ report }: { report: RoastReport }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/u/${report.username}`
    : `https://fomotech.dev/u/${report.username}`;

  const tweetText = `Just got my Tech FOMO report on @fomotech:
FOMO Score: ${report.fomoScore}/100 (${report.fomoGrade})
Archetype: ${report.archetype}

"${report.roastHeadline.slice(0, 140)}"

Check how outdated your tech stack is:`;

  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(report.actionableCursorPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-destructive border-destructive";
    if (score >= 60) return "text-secondary border-secondary";
    if (score >= 40) return "text-yellow-400 border-yellow-400";
    return "text-primary border-primary";
  };

  const ogImageUrl = `/api/og?username=${encodeURIComponent(report.username)}&score=${report.fomoScore}&grade=${report.fomoGrade}&archetype=${encodeURIComponent(report.archetype)}&headline=${encodeURIComponent(report.roastHeadline)}`;

  return (
    <div className="mt-12 text-left animate-fade-in w-full max-w-4xl mx-auto space-y-8 font-mono">
      {/* Main Terminal Card */}
      <div className="pixel-box bg-black text-white border-2 border-white p-6 md:p-10 relative overflow-hidden">
        {/* Decorative corner blocks */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 bg-secondary" />

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-2 border-white/20 gap-4">
          <div className="flex items-center gap-4">
            {report.avatarUrl && (
              <img
                src={report.avatarUrl}
                alt={report.username}
                className="w-14 h-14 border-2 border-primary pixel-box p-0.5 object-cover"
              />
            )}
            <div>
              <div className="text-2xl font-pixel text-white uppercase tracking-tight flex items-center gap-2">
                @{report.username}
                <span className="text-xs font-mono px-2 py-0.5 bg-white/10 text-primary border border-primary/30">
                  VERIFIED AUDIT
                </span>
              </div>
              <div className="text-xs text-gray-400 uppercase mt-1">
                Archetype: <span className="text-secondary font-bold">{report.archetype}</span>
              </div>
            </div>
          </div>

          {/* FOMO Meter Box */}
          <div className={`flex items-center gap-3 border-2 px-5 py-3 bg-black/60 ${getScoreColor(report.fomoScore)}`}>
            <div className="text-right">
              <div className="text-[10px] uppercase text-gray-400">FOMO SCORE</div>
              <div className="text-3xl font-pixel leading-none">{report.fomoScore}</div>
            </div>
            <div className="text-xl font-bold border-l-2 border-current pl-3">
              {report.fomoGrade}
            </div>
          </div>
        </div>

        {/* Roast Headline */}
        <div className="mb-8 p-4 bg-white/5 border-l-4 border-primary">
          <div className="flex items-center gap-2 text-primary text-xs uppercase mb-1 font-bold">
            <Flame size={16} /> THE VERDICT
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
            &ldquo;{report.roastHeadline}&rdquo;
          </h2>
        </div>

        {/* Roast Paragraphs */}
        <div className="space-y-4 text-base md:text-lg text-gray-300 leading-relaxed mb-8">
          {report.roastBody.map((paragraph, idx) => (
            <p key={idx} className="border-l border-white/10 pl-4 py-1">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Legacy Red Flags Section (if detected) */}
        {report.legacyFlags && report.legacyFlags.length > 0 && (
          <div className="mb-8 p-5 bg-red-950/20 border-2 border-destructive/40">
            <div className="flex items-center gap-2 text-destructive text-sm font-bold uppercase mb-4">
              <AlertTriangle size={18} /> Flagged Stale & Deprecated Dependencies ({report.legacyFlags.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.legacyFlags.map((flag, idx) => (
                <div key={idx} className="p-3 bg-black border border-destructive/30 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400 uppercase">{flag.name}</span>
                    {flag.foundVersion && (
                      <span className="text-[10px] bg-red-900/50 px-1 text-gray-300">{flag.foundVersion}</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-[11px] leading-tight">{flag.reason}</div>
                  <div className="text-primary text-[11px] pt-1 flex items-center gap-1 font-bold">
                    ➔ Upgrade to: {flag.modernAlternative}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2026 Modern Upgrades Table */}
        {report.modernUpgrades && report.modernUpgrades.length > 0 && (
          <div className="mb-8 p-5 bg-white/5 border-2 border-white/20">
            <div className="flex items-center gap-2 text-secondary text-sm font-bold uppercase mb-4">
              <TrendingUp size={18} /> 2026 Recommended Modernization Targets
            </div>
            <div className="divide-y divide-white/10">
              {report.modernUpgrades.map((upgrade, idx) => (
                <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 line-through text-xs">{upgrade.current}</span>
                    <span className="text-primary font-bold">➔ {upgrade.upgradeTo}</span>
                  </div>
                  <div className="text-xs text-gray-400 md:text-right max-w-md">
                    {upgrade.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detected Tech Stack Categories */}
        <div className="mb-8 p-4 bg-black border border-white/20">
          <div className="text-xs text-gray-400 uppercase mb-3 font-bold flex items-center gap-2">
            <Sparkles size={14} className="text-primary" /> Audited Tech Footprint
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {report.detectedStack.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-primary font-bold uppercase tracking-wider">{cat.category}</div>
                <div className="flex flex-wrap gap-1">
                  {cat.items.map((item, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white/10 text-gray-300 text-[11px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyable Cursor/Claude Refactor Prompt */}
        <div className="mb-8 p-4 bg-zinc-950 border border-primary/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary text-xs uppercase font-bold">
              <Terminal size={14} /> 1-Click Cursor / Claude Modernization Prompt
            </div>
            <button
              onClick={handleCopyPrompt}
              className="text-xs px-2.5 py-1 bg-primary text-black font-bold uppercase hover:bg-white transition-colors flex items-center gap-1.5"
            >
              {copiedPrompt ? <Check size={12} /> : <Copy size={12} />}
              {copiedPrompt ? "Copied!" : "Copy Prompt"}
            </button>
          </div>
          <pre className="text-[11px] text-gray-300 bg-black p-3 overflow-x-auto whitespace-pre-wrap border border-white/10">
            {report.actionableCursorPrompt}
          </pre>
        </div>

        {/* Viral Share Actions */}
        <div className="pt-6 border-t-2 border-white/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={twitterIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn text-xs uppercase px-4 py-2 bg-primary text-black hover:bg-white flex items-center gap-2 font-bold"
            >
              <Share2 size={14} /> Share to X (Twitter)
            </a>

            <button
              onClick={handleCopyLink}
              className="pixel-btn text-xs uppercase px-4 py-2 bg-white text-black hover:bg-secondary hover:text-white flex items-center gap-2"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? "Link Copied!" : "Copy Share Link"}
            </button>
          </div>

          <a
            href={ogImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1 uppercase"
          >
            View Generated OG Card <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
