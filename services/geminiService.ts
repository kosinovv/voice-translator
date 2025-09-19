import { GoogleGenAI, Type } from "@google/genai";
import { Language } from '../types';
import { LANGUAGES } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: {
      type: Type.STRING,
      description: 'The full name of the detected source language, e.g., "English".',
    },
    translatedText: {
      type: Type.STRING,
      description: 'The translated text.',
    },
  },
  required: ['detectedLanguage', 'translatedText'],
};

export const translateAndDetect = async (
  text: string,
  sourceLangCode: string,
  targetLangCode: string
): Promise<{ detectedLanguage: string; translatedText:string }> => {
  try {
    const targetLanguage = LANGUAGES.find(l => l.code === targetLangCode)?.name || 'the target language';
    
    let prompt: string;

    if (sourceLangCode === 'auto') {
        prompt = `You are an expert multilingual translator. First, identify the language of the following text. Then, translate it to ${targetLanguage}. If the source language is already ${targetLanguage}, simply return the original text as the translated text.

Text to translate: "${text}"

Provide the response in the specified JSON format.`;
    } else {
        const sourceLanguage = LANGUAGES.find(l => l.code === sourceLangCode)?.name || 'the source language';
        prompt = `You are an expert multilingual translator. The user has specified the source language is ${sourceLanguage}. Translate the following text to ${targetLanguage}.

Text to translate: "${text}"

Provide the response in the specified JSON format. The "detectedLanguage" field in your response must be "${sourceLanguage}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    
    if (result.detectedLanguage && result.translatedText) {
        return result;
    } else {
        throw new Error("Invalid response format from API");
    }
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    throw new Error("Failed to get translation from Gemini API.");
  }
};