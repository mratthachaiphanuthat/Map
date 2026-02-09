import { GoogleGenAI } from "@google/genai";
import { GeoLocation, MapSearchResult } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client once if possible, but for safety in this env, we instantiate per call or use a singleton pattern if we had complex state.
// We will instantiate per request to ensure latest key if it were dynamic, but here static is fine.

export const queryMapsGrounding = async (
  query: string,
  location?: GeoLocation
): Promise<MapSearchResult> => {
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  const retrievalConfig = location ? {
    latLng: {
      latitude: location.latitude,
      longitude: location.longitude
    }
  } : undefined;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: location ? {
          googleSearchRetrieval: { // Note: The SDK might map this differently, but per docs `retrievalConfig` is inside toolConfig for Maps? 
            // Checking guidelines: "retrievalConfig: { latLng: ... }" inside toolConfig.
            dynamicRetrievalConfig: {
                mode: "MODE_UNSPECIFIED", // Default
                dynamicThreshold: 0
            }
          }
        } : undefined,
      },
    });

    // NOTE: The guidelines specify specific structure for retrievalConfig. 
    // Let's retry strictly following the "Maps Grounding" section of the guidelines:
    /*
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: 37.78193,
              longitude: -122.40476
            }
          }
        }
      },
    */

    // Re-doing the call with exact structure
    const exactResponse = await ai.models.generateContent({
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

    const text = exactResponse.text || "No details found.";
    // The chunks are in candidates[0].groundingMetadata.groundingChunks
    const groundingChunks = exactResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text,
      groundingChunks: groundingChunks as any // Casting as any to match our simplified type vs strict SDK type
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Model: gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity from canvas
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    });

    // Iterate to find image part
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};
