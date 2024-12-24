"use client";

export default function Results({ results }: { results: string }) {
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
      <div className="mt-12 bg-gray-50 p-16 rounded-lg shadow">
        <h3 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Your Tech FOMO Report 🚀
        </h3>
        <h4 className="text-2xl font-bold text-blue-600 mb-4">🔥 💡 🌶️</h4>
        <h1>{formatText(results)}</h1>
        <div className="text-center mt-8"></div>
      </div>
    </div>
  );
}
