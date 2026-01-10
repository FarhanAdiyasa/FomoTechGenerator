"use client";

export default function Results({ results }: { results: string }) {
  // Format the text and convert **text** to <b>text</b>
  const formatText = (text: string) => {
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, "<b class='text-secondary'>$1</b>");
    return formattedText
      .split("\n")
      .map((line, index) => (
        <div
          key={index}
          className="mb-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ));
  };

  return (
    <div className="mt-16 text-left animate-fade-in w-full max-w-4xl mx-auto">
      <div className="pixel-box bg-black text-white border-white p-8 md:p-12">
        <h3 className="text-2xl md:text-3xl font-pixel text-primary mb-8 text-center uppercase tracking-wider">
          Your Tech FOMO Report 🚀
        </h3>

        <div className="font-mono text-lg md:text-xl text-gray-300 space-y-4">
          {formatText(results)}
        </div>
        <div className="text-center mt-8"></div>
      </div>
    </div>
  );
}
