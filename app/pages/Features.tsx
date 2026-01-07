import { Search, Laugh, BarChart3 } from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "Skill Analysis",
      description:
        "We dig through your GitHub and tell you exactly what you've *actually* mastered.",
      icon: <Search size={40} className="text-primary" />,
    },
    {
      title: "Tech Trends",
      description:
        "Let’s be real – you’re way behind on the latest tech. AI frameworks, anyone? Yeah, we thought so.",
      icon: <BarChart3 size={40} className="text-secondary" />,
    },
    {
      title: "FOMO Report",
      description:
        "We’ll throw some shade and deliver a report that’s as witty as it is shareable – let everyone know what you’re missing.",
      icon: <Laugh size={40} className="text-accent" />,
    },
  ];

  return (
    <section id="features" className="py-20 bg-black/50 border-t-2 border-white/10 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-pixel text-center mb-16 text-white uppercase tracking-wider">
          What We Do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="pixel-box bg-background text-foreground hover:-translate-y-2 transition-transform duration-300 flex flex-col items-center text-center h-full"
            >
              <div className="mb-6 p-4 border-2 border-white/20 bg-white/5">
                {feature.icon}
              </div>
              <h3 className="font-pixel text-xl mb-4 text-primary uppercase">
                {feature.title}
              </h3>
              <p className="font-mono text-lg text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
