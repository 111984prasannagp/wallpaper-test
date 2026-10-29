import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Lock,
  Laptop,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SlidingSegmentedTabs } from './SlidingSegmentedTabs';

interface HeaderNavProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  wallpaperCount: number;
  favoritesCount: number;
  onOpenAdmin: () => void;
  onSelectCategory: (cat: string) => void;
  selectedCategory: string;
}

let sharedNavAudioCtx: AudioContext | null = null;

export const HeaderNav: React.FC<HeaderNavProps> = ({
  isDarkMode,
  onToggleTheme,
  wallpaperCount,
  favoritesCount,
  onOpenAdmin,
  onSelectCategory,
  selectedCategory,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Play subtle water drop sound synthesized via Web Audio API (zero external assets needed)
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      playWaterChime();
    }
  };

  const playWaterChime = () => {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!sharedNavAudioCtx) {
        sharedNavAudioCtx = new AudioCtxClass();
      }
      if (sharedNavAudioCtx.state === 'suspended') {
        sharedNavAudioCtx.resume().catch(() => {});
      }
      const audioCtx = sharedNavAudioCtx;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed top-3 sm:top-5 left-0 right-0 z-40 flex justify-center px-3 sm:px-6 pointer-events-none select-none">
      {/* Floating Frosted Glass Island Capsule */}
      <header className="pointer-events-auto flex items-center justify-between w-full max-w-5xl px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-slate-950/45 backdrop-blur-2xl border border-white/20 shadow-[0_15px_40px_rgba(0,15,30,0.6)] transition-all duration-300">
        {/* Brand Logo - Guaranteed Single Line */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onSelectCategory('All')}
            className="flex items-center space-x-2 text-left cursor-pointer group focus:outline-none whitespace-nowrap"
            aria-label="Studio Pond Home"
          >
            <span className="font-serif-title text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-teal-200 transition-colors drop-shadow">
              Studio Pond
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          </button>

          {/* Clean Count Pill */}
          <span className="hidden lg:inline-flex items-center space-x-1 text-[11px] font-mono px-3 py-1 rounded-full bg-white/10 text-teal-200 border border-teal-400/25 whitespace-nowrap shadow-sm">
            <span className="font-bold text-teal-300">{wallpaperCount}</span>
            <span>4K Masterworks</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1.5 font-bubbly text-xs sm:text-sm tracking-wide">
          {/* Segmented Tab Control with Sliding Highlighted Pill (Image 2) */}
          <SlidingSegmentedTabs
            tabs={[
              {
                id: 'Laptop / PC Wallpapers',
                label: 'Laptop / PC',
                icon: <Laptop className="w-3.5 h-3.5" />,
              },
              {
                id: 'Mobile Wallpapers',
                label: 'Mobile',
                icon: <Smartphone className="w-3.5 h-3.5" />,
              },
            ]}
            activeId={
              selectedCategory === 'Mobile Wallpapers'
                ? 'Mobile Wallpapers'
                : 'Laptop / PC Wallpapers'
            }
            onChange={(id) => onSelectCategory(id)}
          />
        </nav>

        {/* Right Actions: Sound FX, Dark Mode, [ ADMIN ] */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Subtle Ambient Water Sound FX Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                : 'bg-white/10 border-white/15 text-slate-300 hover:text-white hover:bg-white/20'
            }`}
            title={soundEnabled ? 'Mute Water Sounds' : 'Enable Soft Water Sounds'}
            aria-label="Toggle water audio ambience"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            aria-label={isDarkMode ? 'Switch to daylight pond' : 'Switch to bioluminescent night pond'}
            title={isDarkMode ? 'Daylight Pond Mode' : 'Midnight Bioluminescent Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-200" />
            )}
          </button>

          {/* Dedicated Admin Portal Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center space-x-1.5 text-xs font-bubbly font-bold px-4 py-1.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            title="Admin Portal (gpailab)"
            aria-label="Open Admin Dashboard"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </header>
    </div>
  );
};
