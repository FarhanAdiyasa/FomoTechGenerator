"use client";

interface AnalysisResult {
  results: {
    totalFomoScore: number;
    roast: string;
    skillsToLearn: string;
    summary: string;
  };
}

export default function Results({ results }: AnalysisResult) {
  const fomoMessage = () => {
    if (results.totalFomoScore >= 95) {
      return "THE ULTIMATE FOMO PERSON CAN BE";
    } else if (results.totalFomoScore >= 80) {
      return "YOU'RE FOMO ENOUGH 🚀";
    } else if (results.totalFomoScore >= 50) {
      return "GOOD, BUT YOU CAN DO MORE! 💪";
    } else {
      return "BE MORE FOMO 😎";
    }
  };

  // Format the text and convert **text** to <b>text</b>
  const formatText = (text: string) => {
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    return formattedText
      .split("\n")
      .map((line, index) => (
        <div
          key={index}
          className="mb-2"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ));
  };

  return (
    <div className="mt-12 text-left animate-fade-in">
      <h3 className="text-3xl font-bold text-blue-600 mb-6 text-center">
        Your Tech FOMO Report 🚀
      </h3>
      <div className="flex justify-center items-center mb-6">
        <div className="relative w-40 h-40 flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-blue-700">
            {results.totalFomoScore}%
          </span>
        </div>
      </div>
      <div className="text-center mb-12">
        <h4 className="text-xl font-semibold text-gray-700">{fomoMessage()}</h4>
      </div>
      <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow">
        <h4 className="text-2xl font-bold text-blue-600 mb-4">🔥 Roast</h4>
        {formatText(results.roast)}
      </div>
      <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow">
        <h4 className="text-2xl font-bold text-blue-600 mb-4">
          💡 Skills to Learn
        </h4>
        {formatText(results.skillsToLearn)}
      </div>
      <div className="mt-12 bg-gray-50 p-6 rounded-lg shadow">
        <h4 className="text-2xl font-bold text-blue-600 mb-4">
          🚀 Summary & Recommendations
        </h4>
        {formatText(results.summary)}
        <div className="text-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition">
            Catch Up on Trends Now 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
