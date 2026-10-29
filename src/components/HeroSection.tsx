import React from 'react';
import { ChevronDown, Layers, Download, Laptop, Smartphone } from 'lucide-react';
import { WallpaperItem } from '../utils/wallpaper-filters';
import Typewriter from './originkit/ui/typewriter';
import { SpinningCounter } from './SpinningCounter';

interface HeroSectionProps {
  wallpapers: WallpaperItem[];
  onScrollDown: () => void;
  totalDownloads: number;
  onSelectCategory: (cat: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  wallpapers,
  onScrollDown,
  totalDownloads,
  onSelectCategory,
}) => {
  const pcCount = wallpapers.filter(
    (w) =>
      w.deviceType === 'pc' ||
      w.category.toLowerCase().includes('pc') ||
      w.category.toLowerCase().includes('laptop')
  ).length;

  const mobileCount = wallpapers.filter(
    (w) => w.deviceType === 'mobile' || w.category.toLowerCase().includes('mobile')
  ).length;

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-24 sm:pt-28 pb-14 sm:pb-20 z-10 select-none">
      {/* Organic Glassmorphic Blur Island Container */}
      <div className="relative max-w-4xl w-full mx-auto p-8 sm:p-12 md:p-16 rounded-[36px] sm:rounded-[48px] bg-slate-950/40 backdrop-blur-2xl border border-white/20 shadow-[0_30px_70px_rgba(0,18,36,0.65)] overflow-hidden transition-all duration-500 hover:border-teal-400/40">
        {/* Ambient Aquatic Back-Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Content Flow */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Monumental Serif Title with Originkit Typewriter Effect (Exclusively on Studio Pond) */}
          <div className="w-full flex items-center justify-center min-h-[70px] sm:min-h-[90px] md:min-h-[110px] my-1">
            <Typewriter
              texts={['Studio Pond']}
              prefix=""
              color="#ffffff"
              typedColor="#ffffff"
              cursorColor="#2dd4bf"
              cursorChar="|"
              showCursor={true}
              hideCursorOnType={false}
              deleteSpeed={0.1}
              ease={{
                type: 'tween',
                duration: 0.12,
                delay: 2.5,
                ease: 'easeInOut',
              }}
              font={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 500,
                fontSize: 'clamp(2.5rem, 7.5vw, 6.5rem)',
                lineHeight: '1.05',
                letterSpacing: '-0.02em',
              }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                textAlign: 'center',
                filter: 'drop-shadow(0 15px 35px rgba(0,15,30,0.8))',
              }}
            />
          </div>

          {/* Elegant Subtitle with Matched Colors */}
          <p className="mt-4 sm:mt-5 font-bubbly text-base sm:text-xl md:text-2xl text-teal-100/90 max-w-2xl font-normal leading-relaxed drop-shadow">
            High-Resolution Visual Sanctuaries for Laptop, PC & Mobile
          </p>

          {/* 2 Primary Category Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
            <button
              onClick={() => {
                onSelectCategory('Laptop / PC Wallpapers');
                onScrollDown();
              }}
              className="px-6 py-3 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs sm:text-sm font-bubbly font-bold flex items-center space-x-2.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_8px_25px_rgba(45,212,191,0.4)] whitespace-nowrap"
            >
              <Laptop className="w-4 h-4 stroke-[2.5]" />
              <span>Laptop / PC ({pcCount || 20})</span>
            </button>

            <button
              onClick={() => {
                onSelectCategory('Mobile Wallpapers');
                onScrollDown();
              }}
              className="px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs sm:text-sm font-bubbly font-bold flex items-center space-x-2.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:border-teal-300/60 whitespace-nowrap"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5] text-teal-300" />
              <span>Mobile ({mobileCount || 12})</span>
            </button>
          </div>

          {/* Live Status Indicators with transitions.dev Spinning Counter on Total Numbers (Image 1) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 pt-6 border-t border-white/10 text-xs sm:text-sm font-mono text-teal-100/85">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-teal-300" />
              <span>{wallpapers.length > 0 ? `${wallpapers.length} Wallpapers Available` : '32 Wallpapers'}</span>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            {/* Image 1: Spinning Counter Transition */}
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-teal-300" />
              <SpinningCounter
                value={totalDownloads > 0 ? totalDownloads : 12348}
                suffix="+"
                label="Downloads"
              />
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <div className="flex items-center space-x-2 text-emerald-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>1-Click 4K Download</span>
            </div>
          </div>

          {/* Gentle Bouncy Scroll Cue Button */}
          <div className="mt-8">
            <button
              onClick={onScrollDown}
              className="group inline-flex items-center space-x-2.5 px-6 py-2.5 rounded-full bg-black/40 hover:bg-teal-500/20 text-teal-200 hover:text-white border border-teal-400/30 hover:border-teal-300/70 transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 focus:outline-none"
              aria-label="Scroll to wallpaper gallery"
            >
              <span className="font-mono text-xs tracking-wider uppercase">Explore Gallery</span>
              <div className="w-6 h-6 rounded-full bg-teal-400/20 group-hover:bg-teal-400 group-hover:text-slate-950 flex items-center justify-center transition-all animate-bounce">
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
