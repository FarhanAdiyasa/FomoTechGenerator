import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Laugh, BarChart3 } from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "Skill Analysis",
      description:
        "We dig through your GitHub and tell you exactly what you've *actually* mastered.",
      icon: <Search size={40} className="text-blue-600" />,
    },
    {
      title: "Tech Trends",
      description:
        "Let’s be real – you’re way behind on the latest tech. AI frameworks, anyone? Yeah, we thought so.",
      icon: <BarChart3 size={40} className="text-purple-600" />,
    },
    {
      title: "FOMO Report",
      description:
        "We’ll throw some shade and deliver a report that’s as witty as it is shareable – let everyone know what you’re missing.",
      icon: <Laugh size={40} className="text-yellow-500" />,
    },
  ];

  return (
    <section id="features" className="py-16 bg-gray-50">
      <h2 className="text-4xl font-bold text-center mb-12 text-blue-600">
        What We Do
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            <CardHeader className="flex items-center justify-center">
              {feature.icon}
            </CardHeader>
            <CardContent>
              <CardTitle className="text-center mb-2">
                {feature.title}
              </CardTitle>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
