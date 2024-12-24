import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import pLimit from "p-limit";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_API_KEY;
const MAX_CONCURRENT_REQUESTS = 5; // Maximum concurrent requests
const PER_PAGE = 30;

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

// Helper function to fetch data from Gemini API with exponential backoff
async function fetchGeminiAPI(
  prompt: string,
  retries: number = 3,
  delay: number = 1000 // Initial delay in milliseconds (1 second)
): Promise<any> {
  try {
    const geminiResponse = await fetch(
      "https://fomo-tech-generator-gbzs.vercel.app/api/gemini",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }
    );

    if (geminiResponse.status === 429) {
      throw new Error("Rate limit exceeded");
    }

    return await geminiResponse.json();
  } catch (error) {
    if (error instanceof AxiosError) {
      if (retries > 0 && error.message === "Rate limit exceeded") {
        console.warn(
          `Rate limit exceeded, retrying in ${
            delay / 1000
          }s... (${retries} retries left)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait for `delay` time
        return fetchGeminiAPI(prompt, retries - 1, delay * 2); // Retry with exponential backoff
      }
      console.error("Gemini API request failed:", error.message);
      throw new Error("Failed to fetch data from Gemini");
    }
  }
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
  return geminiResponse.result || null;
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
  return geminiResponse.result ? geminiResponse.result.split(",") : [];
}

// Function to roast the detected frameworks and provide feedback
// Function to roast the detected frameworks and provide feedback
// Function to roast the detected frameworks and provide feedback
async function roastFrameworks(
  frameworks: Set<string>,
  languages: Set<string>
): Promise<any> {
  const prompt = `  
      Based on the following detected frameworks, libraries, and programming languages, provide a brutally honest roast along with solid recommendations for improvement and dont ever used '**' used <b>:

      ### Considerations:
      1. **Latest Frameworks/Libraries**: Compare the frameworks to the latest and most popular ones in the industry. For example, if someone is using outdated frameworks (e.g., CodeIgniter), recommend more modern alternatives (e.g., Laravel, React).
      2. **Programming Languages**: Assess the programming languages detected in the project and compare them to the latest trends or newer languages. Provide a roast if the user is stuck on old or less-relevant languages.
      3. **Version Usage**: Check if the user is using outdated versions of frameworks, libraries, or tools. Recommend upgrading to more recent versions, and explain the benefits of doing so.
      4. **Trends**: Give a roast about missing out on trending tech (e.g., AI, cloud computing, modern frontend frameworks) if applicable.
      5. Judge and explain why their stack is outdated why they should change it

      ### Detected Frameworks:
      - ${Array.from(frameworks).join(", ")} 

      ### Detected Languages:
      - ${Array.from(languages).join(", ")}

     Provide the results in valid JSON format, valid means no raw newlines; instead, you should use \n to represent them:
      {
          "totalFomoScore": number, //(1-100)
          "roast": string, // JSON strings must not contain raw newlines; instead, you should use \n to represent them.
          "skillsToLearn": string, //JSON strings must not contain raw newlines; instead, you should use \n to represent them.
          "summary": string, //JSON strings must not contain raw newlines; instead, you should use \n to represent them.
      }


      Style Guide:
		- Use slang and trendy terms
    - in roast, skillstolearn, and summary do just one paragraph, but make it very long like minimum 100 words
		- Roasting should be spicy but constructive
		- Feel free to use emojis 🔥  

		Note: Avoid:
		- Harsh or offensive language
		- Too personal criticism
		- Markdown or formatting other than <b>
      Be brutally honest in the roast and give clear, actionable advice on how the user can level up their skills and stay relevant in the tech industry. For example, if someone is using outdated tools or languages, suggest modern alternatives and provide reasoning.
    `;
  return await hitAPI(prompt);
}
interface GeminiResponse {
  result: string;
}

function cleanedResults(geminiResponse: GeminiResponse): string {
  let cleanedResult = geminiResponse.result;

  if (
    geminiResponse.result.includes("```json\n") &&
    geminiResponse.result.includes("```")
  ) {
    cleanedResult = geminiResponse.result
      .replace(/```json\n/, "")
      .replace(/```$/, "");
  }

  cleanedResult = cleanedResult.trim();
  return cleanedResult;
}

async function hitAPI(prompt: string) {
  try {
    const geminiResponse = await fetchGeminiAPI(prompt);
    const resInJSON = JSON.parse(cleanedResults(geminiResponse));
    return resInJSON;
  } catch {
    hitAPI(prompt);
  }
}
async function fetchAllRepositories(username: string) {
  const repositories = [];
  let page = 1;

  while (repositories.length < 10) {
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
        `https://api.github.com/repos/${username}/${repo.name}/languages`
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
    return NextResponse.json(geminiResults);
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
