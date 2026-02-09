import React, { useState, useRef } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import { UploadIcon, SparklesIcon, LoaderIcon, SendIcon } from './Icons';

interface ImageFeaturesProps {
  isActive: boolean;
}

export const ImageFeatures: React.FC<ImageFeaturesProps> = ({ isActive }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Split to get just the base64 data part for API if needed, 
        // but typically for display we need the prefix.
        // For API `inlineData`, we need the pure base64 without prefix.
        setOriginalImage(base64);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;
    setLoading(true);

    try {
      // Extract pure base64
      const base64Data = originalImage.split(',')[1];
      const resultBase64 = await editImageWithPrompt(base64Data, prompt);
      
      // The result is raw base64, need to add prefix for display
      setGeneratedImage(`data:image/jpeg;base64,${resultBase64}`);
    } catch (error) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-start p-6 max-w-5xl mx-auto w-full gap-8">
        
        {/* Header */}
        <div className="text-center space-y-2 mt-4">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-purple-400">
            AI Magic Editor
          </h2>
          <p className="text-slate-400 text-sm">
            Upload a photo and describe how you want to change it.
          </p>
        </div>

        {/* Image Display Area */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
            {/* Original / Upload */}
            <div className={`relative rounded-2xl border-2 border-dashed ${originalImage ? 'border-slate-700 bg-slate-900' : 'border-slate-600 bg-slate-900/50'} flex flex-col items-center justify-center overflow-hidden transition-all h-[400px] md:h-auto`}>
                {originalImage ? (
                    <>
                        <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-colors text-xs font-medium"
                        >
                            Change Photo
                        </button>
                    </>
                ) : (
                    <div className="text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-primary-400">
                            <UploadIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">Upload an image</p>
                            <p className="text-slate-400 text-sm">JPG, PNG up to 5MB</p>
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-sm font-semibold transition-colors"
                        >
                            Select File
                        </button>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Generated Result */}
            <div className={`relative rounded-2xl border ${generatedImage ? 'border-primary-500/30 bg-slate-900' : 'border-slate-800 bg-slate-900/30'} flex flex-col items-center justify-center overflow-hidden h-[400px] md:h-auto`}>
                {loading ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <LoaderIcon className="w-12 h-12 text-primary-500 animate-spin" />
                        <p className="text-primary-400 font-medium tracking-wide">Generating Magic...</p>
                    </div>
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center p-6 text-slate-600">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>Your creation will appear here</p>
                    </div>
                )}
            </div>
        </div>

        {/* Controls */}
        <div className="w-full max-w-2xl bg-slate-900/80 p-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-2 backdrop-blur-lg mb-8">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={originalImage ? "Describe changes (e.g., 'make it cyberpunk style')" : "Upload an image first..."}
                disabled={!originalImage || loading}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1 bg-transparent border-none outline-none text-white px-6 py-3 placeholder-slate-500 disabled:opacity-50"
            />
            <button
                onClick={handleGenerate}
                disabled={!originalImage || !prompt.trim() || loading}
                className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:grayscale transform active:scale-95 shadow-lg"
            >
                {loading ? <LoaderIcon className="animate-spin w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
            </button>
        </div>

      </div>
    </div>
  );
};
