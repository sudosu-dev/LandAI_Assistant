import { GoogleGenerativeAI } from "@google/generative-ai";
import { axiosWithProxy } from "#utils/axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const requestOptions = { customClient: axiosWithProxy };

const model = genAI.getGenerativeModel(
  { model: "gemini-1.5-flash" },
  requestOptions
);
const jsonModel = genAI.getGenerativeModel(
  {
    model: "gemini-1.5-flash",
    generationConfig: { response_mime_type: "application/json" },
  },
  requestOptions
);

const retryWithBackoff = async (fn, maxRetries = 3) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      // Only retry on transient 503 errors
      if (error.status === 503 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `AI service unavailable. Retrying in ${
            delay / 1000
          } seconds... (Attempt ${attempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // For all other errors (like 429 quota), fail immediately
        throw error;
      }
    }
  }
};

export const getSimpleChatResponse = async (prompt) => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }
  try {
    return await retryWithBackoff(async () => {
      const result = await model.generateContent(prompt.trim());
      return result.response.text();
    });
  } catch (error) {
    console.error(
      "Error in getSimpleChatResponse from Gemini API:",
      error.message
    );
    throw error;
  }
};

export const getAdvancedChatResponse = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }
  try {
    return await retryWithBackoff(async () => {
      const generationConfig = {
        maxOutputTokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
      };
      const advancedModel = genAI.getGenerativeModel(
        { model: "gemini-1.5-flash", generationConfig },
        requestOptions
      );
      const result = await advancedModel.generateContent(prompt.trim());
      return result.response.text();
    });
  } catch (error) {
    console.error(
      "Error in getAdvancedChatResponse from Gemini API:",
      error.message
    );
    throw error;
  }
};

export const getJsonResponseFromAi = async (prompt) => {
  try {
    return await retryWithBackoff(async () => {
      const result = await jsonModel.generateContent(prompt.trim());
      const responseText = result.response.text();
      return JSON.parse(responseText);
    });
  } catch (error) {
    console.error(
      "Error in getJsonResponseFromAi from Gemini API:",
      error.message
    );
    throw error;
  }
};
