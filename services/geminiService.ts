import { GoogleGenAI } from "@google/genai";
import { GeoLocation, MapSearchResult } from "../types";

const apiKey = process.env.API_KEY || '';

export const queryMapsGrounding = async (
  query: string,
  location?: GeoLocation
): Promise<MapSearchResult> => {
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        } : undefined
      }
    });

    const text = response.text || "No details found.";
    // The chunks are in candidates[0].groundingMetadata.groundingChunks
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text,
      groundingChunks: groundingChunks as any // Casting as any to match our simplified type vs strict SDK type
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    throw error;
  }
};
