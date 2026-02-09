export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        reviewText: string;
      }[];
    };
  };
}

export interface MapSearchResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export enum AppMode {
  MAPS = 'MAPS',
  IMAGE_EDIT = 'IMAGE_EDIT'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
  image?: string; // For image edit results
  timestamp: number;
}
