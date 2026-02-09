import React, { useState } from 'react';
import { AppMode } from './types';
import { MapFeatures } from './components/MapFeatures';
import { ImageFeatures } from './components/ImageFeatures';
import { MapPinIcon, ImageIcon } from './components/Icons';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.MAPS);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col md:flex-row">
      
      {/* Navigation Rail (Desktop) / Bottom Bar (Mobile) */}
      <nav className="z-50 bg-slate-900/90 backdrop-blur-md border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start items-center p-2 md:w-20 w-full fixed bottom-0 md:relative order-2 md:order-1 shrink-0">
        <div className="hidden md:block mb-8 mt-4">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
             GF
           </div>
        </div>

        <NavButton 
          active={mode === AppMode.MAPS} 
          onClick={() => setMode(AppMode.MAPS)} 
          icon={<MapPinIcon />} 
          label="Map"
        />
        
        <NavButton 
          active={mode === AppMode.IMAGE_EDIT} 
          onClick={() => setMode(AppMode.IMAGE_EDIT)} 
          icon={<ImageIcon />} 
          label="Edit"
        />
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative h-[calc(100vh-64px)] md:h-screen order-1 md:order-2">
        <MapFeatures isActive={mode === AppMode.MAPS} />
        <ImageFeatures isActive={mode === AppMode.IMAGE_EDIT} />
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`p-3 md:p-4 rounded-xl flex flex-col items-center gap-1 transition-all duration-300 ${
      active 
        ? 'text-primary-400 bg-primary-500/10 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        {icon}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

export default App;
