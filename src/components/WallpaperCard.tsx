import React, { useState, useRef } from 'react';
import { Download, Heart, Check, Sparkles, Smartphone, Laptop } from 'lucide-react';
import { WallpaperItem } from '../utils/wallpaper-filters';
import LiquidCarveButton from './originkit/ui/liquid-carve-button';

interface WallpaperCardProps {
  item: WallpaperItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenPreview: (item: WallpaperItem) => void;
  onDownload: (item: WallpaperItem, resolution?: string) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onOpenPreview,
  onDownload,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D perspective tilt coordinates
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const isMobile =
    item.deviceType === 'mobile' ||
    item.category.toLowerCase().includes('mobile') ||
    item.aspectRatio.includes('9:16');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -7; // Max 7 deg tilt
    const rotateY = ((x - centerX) / centerX) * 7;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleInstantDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(item, 'original');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onOpenPreview(item)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className="group flex flex-col rounded-3xl overflow-hidden glass-pond-card hover:glass-pond-card-dark border border-white/15 hover:border-teal-400/60 shadow-xl hover:shadow-[0_25px_50px_rgba(0,30,55,0.7)] cursor-pointer select-none transition-colors"
      data-testid={`wallpaper-card-${item.id}`}
    >
      {/* 1. 100% Unobstructed Wallpaper Canvas Display */}
      <div
        className={`relative w-full overflow-hidden bg-slate-900/70 ${
          isMobile ? 'aspect-[9/16]' : 'aspect-[16/10] sm:aspect-[16/9]'
        }`}
      >
        {/* Loading Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-teal-400/30 animate-spin-slow" />
          </div>
        )}

        <img
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            isLoaded ? 'opacity-100 filter-none' : 'opacity-0 blur-sm'
          }`}
        />

        {/* 3D Liquid Glare Sheen */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Top Badges: Device Type & Heart Favorite */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-teal-200 border border-teal-400/30 text-[10px] font-mono shadow-md">
            {isMobile ? <Smartphone className="w-3 h-3 text-teal-300" /> : <Laptop className="w-3 h-3 text-teal-300" />}
            <span>{isMobile ? 'Mobile' : 'Laptop / PC'}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md border transition-all duration-300 cursor-pointer ${
              isFavorite
                ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.7)] scale-110'
                : 'bg-black/50 text-white/80 border-white/20 hover:text-white hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Dedicated Bottom Control Bar - Clean minimal specs, no title clutter, Liquid Carve Button */}
      <div className="p-3 sm:p-3.5 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 flex flex-col justify-between space-y-2 mt-auto">
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <span className="text-teal-300 font-semibold tracking-wide">
            {item.resolutionLabel || '4K UHD'} • {item.aspectRatio}
          </span>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 shrink-0">
            {item.downloads} ⚡
          </span>
        </div>

        {/* Liquid Carve Button with Website Palette */}
        <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
          <LiquidCarveButton
            label={downloadSuccess ? 'Downloaded 4K!' : '1-Click Download Free'}
            onClick={handleInstantDownload}
            colors={{
              fill: '#2dd4bf',
              textColor: '#04121b',
            }}
            blob={{
              color: '#00f5d4',
              size: 55,
              smoothness: 60,
            }}
            rounded={22}
            padding="9px 20px"
            font={{
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
            addIcon={true}
            icon={{
              type: 'symbol',
              symbol: downloadSuccess ? '✓' : '↓',
              size: 15,
              color: '#04121b',
            }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(45,212,191,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
