// @ts-ignore
import { GoogleGenAI } from "@google/genai";

// Declare process to avoid TS errors during build if @types/node is missing
// We use 'declare var' to avoid "Redeclare variable" errors if it already exists globally
declare var process: any;

// Initialize Gemini Client
// Ensure process.env.API_KEY is handled safely in browser environment
let ai: GoogleGenAI | null = null;
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey: apiKey });
    } else {
        console.warn("Gemini API Key is missing. AI features will be disabled or simulated.");
    }
} catch (error) {
    console.error("Failed to initialize Gemini Client", error);
}

export const generatePhotoCaption = async (destination: string, language: 'zh' | 'en'): Promise<string> => {
    // Fallback if AI not initialized or API key missing
    if (!ai) {
        return language === 'zh' 
            ? `这是在 ${destination} 拍摄的精彩瞬间！✨` 
            : `A wonderful moment captured in ${destination}! ✨`;
    }

    try {
        const model = "gemini-2.5-flash";
        const langPrompt = language === 'zh' ? "in Chinese Simplified" : "in English";
        const prompt = `Generate a short, poetic, and inspiring caption (${langPrompt}) for a travel photo taken in ${destination}. Max 15 words. Do not use quotes.`;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text?.replace(/"/g, '') || (language === 'zh' ? `这是在 ${destination} 拍摄的精彩瞬间！✨` : `A wonderful moment captured in ${destination}! ✨`);
    } catch (error) {
        console.error("Caption Error:", error);
        return language === 'zh' ? `这是在 ${destination} 拍摄的精彩瞬间！✨` : `A wonderful moment captured in ${destination}! ✨`;
    }
};

export const identifyPhotoCategory = async (photoUrl: string) => {
  return "scenery";
};

export const generateTravelAdvice = async (history: any[]) => {
  return "你好！我是 AI 导游。有什么可以帮你的吗？";
};