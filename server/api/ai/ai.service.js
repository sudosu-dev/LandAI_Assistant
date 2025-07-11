import { GoogleGenerativeAI } from "@google/generative-ai";
import { axiosWithProxy } from "#utils/axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const requestOptions = {
  customClient: axiosWithProxy,
};

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

export const getSimpleChatResponse = async (prompt) => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }
  try {
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

export const getAdvancedChatResponse = async (prompt, options = {}) => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Prompt must be a non-empty string.");
  }
  try {
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
  } catch (error) {
    console.error("Error getting response from Gemini API:", error);
    throw new Error(
      `Failed to get response from AI service: ${
        error.message || "Unknown error"
      }`
    );
  }
};

export const getJsonResponseFromAi = async (prompt) => {
  try {
    const result = await jsonModel.generateContent(prompt.trim());
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error getting or parsing JSON response from AI:", error);
    throw new Error("Failed to get structured data from AI service.");
  }
};
