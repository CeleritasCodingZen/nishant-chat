import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const gemini = new GoogleGenAI({
  apiKey: apiKey || "MISSING_GEMINI_API_KEY",
});

export const isGeminiConfigured = Boolean(
  apiKey && apiKey.trim().length > 0 && apiKey !== "MISSING_GEMINI_API_KEY"
);
