import { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import RoastCard from "../../components/RoastCard";
import { getRoastReportAction } from "../../actions";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const result = await getRoastReportAction(username);

  if (result.success && result.report) {
    const r = result.report;
    const ogUrl = `/api/og?username=${encodeURIComponent(r.username)}&score=${r.fomoScore}&grade=${r.fomoGrade}&archetype=${encodeURIComponent(r.archetype)}&headline=${encodeURIComponent(r.roastHeadline)}`;

    return {
      title: `@${r.username}'s Tech FOMO Score: ${r.fomoScore}/100 (${r.fomoGrade})`,
      description: r.roastHeadline,
      openGraph: {
        title: `@${r.username}'s Tech FOMO Report`,
        description: r.roastHeadline,
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `@${r.username}'s Tech FOMO Score: ${r.fomoScore}/100`,
        description: r.roastHeadline,
        images: [ogUrl],
      },
    };
  }

  return {
    title: `Tech FOMO Report: @${username}`,
    description: "Audit your developer tech stack against 2026 standards.",
  };
}

export default async function UserRoastPage({ params }: Props) {
  const { username } = await params;
  const result = await getRoastReportAction(username);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black font-mono">
      <Header />

      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs uppercase text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Search
          </Link>

          <Link
            href="/"
            className="text-xs uppercase text-secondary hover:underline flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Audit Another Repo
          </Link>
        </div>

        {result.success && result.report ? (
          <RoastCard report={result.report} />
        ) : (
          <div className="max-w-xl mx-auto p-8 border-2 border-destructive bg-black text-center mt-12 space-y-4">
            <h2 className="text-xl font-pixel text-destructive uppercase">Audit Failed</h2>
            <p className="text-gray-300 text-sm">
              {result.error || `Could not find or audit GitHub user "@${username}".`}
            </p>
            <div className="pt-4">
              <Link href="/" className="pixel-btn text-xs uppercase px-4 py-2 inline-block">
                Try Another Username
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
