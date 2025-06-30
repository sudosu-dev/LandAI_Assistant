import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Sends a simple text prompt to the Gemini API and gets a response.
 * @param {string} prompt - The text prompt to send to the AI.
 * @returns {Promise<string>} The text response from the AI.
 * @throws {Error} When prompt is invalid or API request fails.
 */
export const getSimpleChatResponse = async (prompt) => {
  // Input validation
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }

  try {
    const result = await model.generateContent(prompt.trim());
    return result.response.text();
  } catch (error) {
    // Log the original error for debugging
    console.error("Error getting response from Gemini API:", error);

    // Handle specific error types if needed
    if (error.message?.includes("API_KEY")) {
      throw new Error("Invalid API key or authentication failed.");
    }

    if (error.message?.includes("quota")) {
      throw new Error("API quota exceeded. Please try again later.");
    }

    // Generic fallback
    throw new Error(
      `Failed to get response from AI service: ${
        error.message || "Unknown error"
      }`
    );
  }
};

/**
 * Sends an enhanced text prompt with configuration options to the Gemini API
 * @param {string} prompt - The text prompt to send to the AI.
 * @param {Object} options - Configuration options.
 * @param {number} [options.maxTokens] - Maximum tokens in response.
 * @param {number} [options.temperature] - Creativity level (0-1).
 * @returns {Promise<string>} The text response from the AI.
 */
export const getAdvancedChatResponse = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }

  try {
    const generationConfig = {
      maxOutputTokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
    });

    const result = await model.generateContent(prompt.trim());
    return result.response.text();
  } catch (error) {
    console.error("Error getting response from Gemini API:", error);
    throw new Error(
      `Failed to get response from AI service: ${
        error.message || "Unknown error"
      }`
    );
  }
};
