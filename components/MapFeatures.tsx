import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GeoLocation, GroundingChunk, MapSearchResult } from '../types';
import { queryMapsGrounding } from '../services/geminiService';
import { LocateIcon, SendIcon, LoaderIcon, MapPinIcon } from './Icons';

// Fix Leaflet icon issue in React
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapFeaturesProps {
  isActive: boolean;
}

export const MapFeatures: React.FC<MapFeaturesProps> = ({ isActive }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ type: 'user' | 'model'; text: string; chunks?: GroundingChunk[] }[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    // Try to get initial location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        map.setView([latitude, longitude], 14);
        markerRef.current = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
      },
      (err) => console.error(err)
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Resize when active tab changes
  useEffect(() => {
    if (isActive && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isActive]);

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        mapRef.current?.setView([latitude, longitude], 15);
        if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
        else markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current!);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    const currentQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { type: 'user', text: currentQuery }]);

    try {
      const result: MapSearchResult = await queryMapsGrounding(currentQuery, location || undefined);
      setMessages(prev => [...prev, { 
        type: 'model', 
        text: result.text, 
        chunks: result.groundingChunks 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { type: 'model', text: "Sorry, I couldn't fetch the map data right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full relative ${!isActive ? 'hidden' : ''}`}>
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-900" />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        {/* Top Controls */}
        <div className="p-4 flex justify-end pointer-events-auto">
            <button 
                onClick={handleLocateMe}
                className="bg-slate-800/90 text-white p-3 rounded-full hover:bg-slate-700 backdrop-blur-md shadow-lg border border-slate-700 transition-all"
                title="Locate Me"
            >
                <LocateIcon />
            </button>
        </div>

        {/* Chat / Results Panel */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 pointer-events-none flex flex-col justify-end space-y-4">
             {/* Messages Area - only shows recent interaction to keep map visible */}
            <div className="max-h-[60vh] overflow-y-auto w-full max-w-2xl mx-auto space-y-4 pointer-events-auto">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 shadow-xl backdrop-blur-md border ${
                            msg.type === 'user' 
                                ? 'bg-primary-600/90 border-primary-500 text-white' 
                                : 'bg-slate-900/90 border-slate-700 text-slate-100'
                        }`}>
                            <div className="prose prose-invert prose-sm">
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            
                            {/* Grounding Chunks */}
                            {msg.chunks && msg.chunks.length > 0 && (
                                <div className="mt-4 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                    {msg.chunks.map((chunk, cIdx) => {
                                        const mapData = chunk.maps;
                                        if (!mapData) return null;
                                        return (
                                            <a 
                                                key={cIdx} 
                                                href={mapData.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="block p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-colors flex items-start gap-3 group"
                                            >
                                                <div className="mt-1 text-red-400 group-hover:scale-110 transition-transform">
                                                    <MapPinIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-200">{mapData.title}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">View on Google Maps</div>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700 flex items-center gap-2">
                             <LoaderIcon className="animate-spin text-primary-400" />
                             <span className="text-sm text-slate-400">Consulting Gemini...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-auto">
            <div className="max-w-2xl mx-auto relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ask map questions (e.g., 'Best ramen nearby?')..."
                    className="w-full bg-slate-800/90 text-white placeholder-slate-400 rounded-full py-4 pl-6 pr-14 shadow-2xl border border-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none backdrop-blur-md"
                />
                <button 
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="absolute right-2 top-2 p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
