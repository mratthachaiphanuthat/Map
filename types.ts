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
