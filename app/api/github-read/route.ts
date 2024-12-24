import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import pLimit from "p-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration
const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_CONCURRENT_REQUESTS = 5; // Maximum concurrent requests
const PER_PAGE = 30;

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; //
// Error handling: Ensure API keys are set
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in .env.local");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to call Gemini API directly
async function fetchGeminiAPI(
  prompt: string,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_DELAY
): Promise<any> {
  async function callGemini(prompt: string): Promise<string> {
    // Instantiate the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate a response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        if (
          attempt < retries &&
          error.message.includes("Rate limit exceeded")
        ) {
          console.warn(
            `Rate limit exceeded, retrying in ${delay / 1000}s... (${
              retries - attempt
            } retries left)`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw new Error(`Failed to fetch data: ${error.message}`);
        }
      }
    }
  }
  throw new Error("All retries failed.");
}

async function fetchWithRateLimit(url: string) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Type-safe access to Axios error properties
      if (
        error.response?.status === 403 &&
        error.response?.headers["x-ratelimit-remaining"] === "0"
      ) {
        const resetTime =
          parseInt(error.response?.headers["x-ratelimit-reset"], 10) * 1000;
        const delay = resetTime - Date.now();
        console.warn(
          `Rate limit exceeded. Retrying in ${Math.ceil(
            delay / 1000
          )} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRateLimit(url); // Retry after rate limit reset
      }
    }
    throw error; // If not an Axios error, rethrow it
  }
}

// Function to analyze frameworks using the Gemini API
async function analyzeFrameworksUsingGeminiAPI(
  username: string,
  repoName: string
): Promise<Set<string>> {
  const frameworks: Set<string> = new Set();

  try {
    const contents = await fetchWithRateLimit(
      `https://api.github.com/repos/${username}/${repoName}/contents`
    );
    const files = contents.filter((file: any) => file.type === "file");
    const summarizedContents = files
      .map((file: any) => `Filename: ${file.name}`)
      .join("\n");

    const result = await getFrameworkFromGeminiAPI(summarizedContents);
    if (result != "N") {
      const contents2 = await fetchWithRateLimit(
        `https://api.github.com/repos/${username}/${repoName}/contents/${result}`
      );
      const summarizedContents2 = JSON.stringify(contents2, null, 2);

      const frameworksList = await identifyFrameworksFromGeminiAPI(
        summarizedContents2
      );
      frameworksList.forEach((framework: string) => frameworks.add(framework));
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      console.error(`Error analyzing frameworks for ${repoName}:`, err.message);
    }
  }

  return frameworks;
}

// Helper function to get framework information from Gemini API
async function getFrameworkFromGeminiAPI(
  summarizedContents: string
): Promise<string | null> {
  const prompt = `
      Here are some code files from a GitHub repository:
      ${summarizedContents}
      Based on the filenames pick one file you want to lookup to determine the frameworks used, just pick one and give me straight results
      ex: pom.xml, package.json, .sln
      if you have nothing just say 'N'
    `;
  const geminiResponse = await fetchGeminiAPI(prompt);
  return geminiResponse || null;
}

// Helper function to identify frameworks from Gemini API
async function identifyFrameworksFromGeminiAPI(
  summarizedContents: string
): Promise<string[]> {
  const prompt = `
      Here are some code files from a GitHub repository:
      ${summarizedContents}
      Based on the filenames and partial content (if available), identify the programming frameworks or libraries being used in this project.
      Return only the frameworks or libraries' names as a comma-separated list.
      frameworks = [a, b, c]
      if No frameworks or libraries are identifiable from the provided information just answer nothing
    `;
  const geminiResponse = await fetchGeminiAPI(prompt);
  return geminiResponse ? geminiResponse.split(",") : [];
}

// Function to roast the detected frameworks and provide feedback
// Function to roast the detected frameworks and provide feedback
// Function to roast the detected frameworks and provide feedback
async function roastFrameworks(
  frameworks: Set<string>,
  languages: Set<string>
): Promise<any> {
  const prompt = `  
		You are a savvy tech consultant with a flair for humor and modern trends. Your task is to analyze GitHub repositories to evaluate the developer's tech stack and generate a "Tech FOMO" score. Provide entertaining, insightful, and practical feedback with recommendations for modernization. The response should be in english and use a light-hearted, casual tone with relevant slang, emojis, and pop culture references.
      
      Framework and languages used by the user to roast as long as you can and as heat as you can. descriptions style is the first-choice here, points are second:
      ### Detected Frameworks:
      - ${Array.from(frameworks).join(", ")} 

      ### Detected Languages:
      - ${Array.from(languages).join(", ")}

      Tech Stack Analysis:
      - Identify the main frameworks, libraries, and languages used across repositories.
      - Highlight any outdated, niche, or trendy tech in their stack.
      - Calculate a "Tech FOMO" score (scale of 0 to 100) based on modernization potential, activity level, and innovation.
      - Suggest ways to modernize their tech stack or learn new tools.

      Based on the data above, generate an insightful and fun evaluation:
      1. Assess their current tech stack and point out any outdated or unconventional choices.
      2. Provide personalized recommendations for:
        - Modern frameworks and libraries to explore
        - Popular tools and technologies to add to their stack
        - Strategies for staying ahead in the fast-paced tech world
      3. Share humorous commentary on their GitHub activity and profile details.
      4. Conclude with motivational and encouraging words to inspire them to level up their skills.

      Style Guide:
      - To separate each paragraphs use double '/n'
      - Blend humor with actionable insights
      - Include relevant tech slang, trendy references, and emojis 🎉
      - Use <b> tags for highlights and bold text, avoid markdown or other formatting styles
      - Keep the tone fun, constructive, and supportive

      Note: Avoid:
      - Harsh or negative criticism
      - Overly complex jargon without explanation
      - Personal attacks or offensive language
      `;
  return await fetchGeminiAPI(prompt);
}

async function fetchAllRepositories(username: string) {
  const repositories = [];
  let page = 1;

  while (repositories.length < 6) {
    // Fetch until we have 10 repositories
    const url = `${GITHUB_API_URL}/users/${username}/repos?per_page=${PER_PAGE}&page=${page}`;
    const batch = await fetchWithRateLimit(url);
    repositories.push(...batch);
    if (batch.length < PER_PAGE) break; // No more repositories
    page++;
  }

  return repositories.slice(0, 10); // Return only the last 10 repositories
}

// Main handler for the POST request
export async function POST(req: NextRequest) {
  try {
    const { githubLink } = await req.json();
    const limit = pLimit(MAX_CONCURRENT_REQUESTS);

    const username = githubLink;
    if (!username) {
      return NextResponse.json(
        { error: "Invalid GitHub profile link" },
        { status: 400 }
      );
    }

    // Fetch user's public repositories
    const repositories = await fetchAllRepositories(username);
    const languages = new Set<string>();
    const frameworks = new Set<string>();

    for (const repo of repositories) {
      const repoLanguages = await fetchWithRateLimit(
        `${GITHUB_API_URL}/repos/${username}/${repo.name}/languages`
      );

      // Add the languages used in this repo to the set
      Object.keys(repoLanguages).forEach((language) => languages.add(language));
    }

    const analysisPromises = repositories.map((repo) =>
      limit(async () => {
        const repoFrameworks = await analyzeFrameworksUsingGeminiAPI(
          username,
          repo.name
        );
        repoFrameworks.forEach((framework) => frameworks.add(framework));
      })
    );

    await Promise.all(analysisPromises);

    // Get the analysis and feedback from Gemini for the frameworks
    const geminiResults = await roastFrameworks(frameworks, languages);
    return new NextResponse(geminiResults);
  } catch (error) {
    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message; // Safely access the message property
    }

    return NextResponse.json(
      { error: `Failed to fetch data from GitHub: ${errorMessage}` },
      { status: 500 }
    );
  }
}
