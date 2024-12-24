import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    // Instantiate the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate a response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: `failed to process the request ${error.message}` },
      { status: 500 }
    );
  }
}
