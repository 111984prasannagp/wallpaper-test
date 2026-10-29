import React, { useState } from 'react';
import {
  X,
  Download,
  Heart,
  Share2,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Layers,
  Calendar,
  Eye,
  Smartphone,
  Monitor,
  Tv,
} from 'lucide-react';
import { WallpaperItem } from '../utils/wallpaper-filters';
import LiquidCarveButton from './originkit/ui/liquid-carve-button';

interface WallpaperModalProps {
  item: WallpaperItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onDownload: (item: WallpaperItem, resolution?: string) => void;
  onApplyPondTone: (tone: string) => void;
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onClose,
  onDownload,
  onApplyPondTone,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [appliedPond, setAppliedPond] = useState(false);
  const [activeRes, setActiveRes] = useState('original');
  const [mockupMode, setMockupMode] = useState<'raw' | 'macbook' | 'iphone'>('raw');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleDownload = (res = activeRes) => {
    onDownload(item, res);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2400);
  };

  const handlePondSync = () => {
    if (item.colorPalette && item.colorPalette[0]) {
      onApplyPondTone(item.colorPalette[0]);
      setAppliedPond(true);
      setTimeout(() => setAppliedPond(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
      data-testid="wallpaper-modal"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0a1826]/95 border border-white/20 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-all cursor-pointer hover:rotate-90"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: High-Res Wallpaper Display & Live Device Mockup Preview */}
        <div className="w-full md:w-3/5 bg-black/70 relative flex flex-col items-center justify-center min-h-[360px] sm:min-h-[500px] p-4 sm:p-6">
          {/* Mockup Mode Selector Switcher */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/15 text-xs font-mono shadow-md">
            <button
              onClick={() => setMockupMode('raw')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                mockupMode === 'raw'
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3 h-3" />
              <span>Artwork</span>
            </button>
            <button
              onClick={() => setMockupMode('macbook')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                mockupMode === 'macbook'
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>MacBook</span>
            </button>
            <button
              onClick={() => setMockupMode('iphone')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                mockupMode === 'iphone'
                  ? 'bg-teal-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>iPhone 16</span>
            </button>
          </div>

          {/* Render corresponding mockup view */}
          {mockupMode === 'raw' && (
            <img
              src={item.originalUrl}
              alt={item.title}
              className="w-full h-auto max-h-[72vh] object-contain rounded-xl shadow-2xl transition-transform duration-500"
            />
          )}

          {mockupMode === 'macbook' && (
            <div className="w-full max-w-[460px] flex flex-col items-center animate-fadeIn my-auto">
              {/* MacBook Screen Bezel */}
              <div className="w-full rounded-t-2xl bg-neutral-900 border-4 border-neutral-700 shadow-2xl p-2 pb-0 relative overflow-hidden">
                {/* Camera notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-neutral-900 rounded-b-md z-10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                </div>
                {/* Display Canvas */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-lg bg-black">
                  <img
                    src={item.originalUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
              {/* MacBook Aluminum Base & Notch */}
              <div className="w-[108%] h-3.5 bg-neutral-600 rounded-b-xl border-t border-neutral-500 shadow-lg relative flex items-start justify-center">
                <div className="w-16 h-1 bg-neutral-700 rounded-b" />
              </div>
            </div>
          )}

          {mockupMode === 'iphone' && (
            <div className="w-48 sm:w-56 aspect-[9/19.5] rounded-[42px] bg-neutral-900 border-4 border-neutral-700 shadow-2xl p-2 relative flex flex-col overflow-hidden animate-fadeIn my-auto">
              {/* Dynamic Island Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10 flex items-center justify-center space-x-1.5 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                <div className="w-2 h-2 rounded-full bg-blue-900/40" />
              </div>
              {/* Screen Content */}
              <div className="w-full h-full rounded-[34px] overflow-hidden relative bg-black">
                <img
                  src={item.originalUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* Home Indicator Bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/70" />
              </div>
            </div>
          )}

          {/* Quick badge */}
          <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-xs font-mono text-teal-300 border border-teal-400/30 flex items-center space-x-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>{item.resolutionLabel} • {item.aspectRatio}</span>
          </div>
        </div>

        {/* Right: Metadata, Palette & Download Panel */}
        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            {/* Header info */}
            <div className="flex items-center space-x-2 text-xs font-mono text-teal-300 uppercase tracking-wider mb-2">
              <span>{item.category}</span>
              <span>•</span>
              <span className="text-slate-400">{item.filename}</span>
            </div>

            <h2 className="font-serif-title text-2xl sm:text-3xl text-white font-medium mb-3">
              {item.title}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-mono border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Spec Sheet Table */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono mb-6">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Dimensions</span>
                <span className="text-white font-medium">{item.width} × {item.height} px</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">File Size</span>
                <span className="text-white font-medium">{item.fileSizeFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Orientation</span>
                <span className="text-white font-medium">{item.aspectRatio.split(' ')[0]}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Downloads</span>
                <span className="text-teal-300 font-medium">{item.downloads}</span>
              </div>
            </div>

            {/* Extracted Color Palette with one-click copy */}
            <div className="mb-6">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Extracted Tone Palette</span>
                <span className="text-[10px] text-slate-400">Click to copy HEX</span>
              </div>
              <div className="flex items-center space-x-2">
                {item.colorPalette.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyColor(color)}
                    style={{ backgroundColor: color }}
                    className="relative group w-10 h-10 rounded-xl shadow-md border border-white/20 hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                    title={`Click to copy ${color}`}
                  >
                    {copiedHex === color && (
                      <Check className="w-4 h-4 text-white drop-shadow stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pond Environment Sync Button */}
            <button
              onClick={handlePondSync}
              className="w-full mb-6 py-2.5 px-4 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-200 text-xs font-mono flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>{appliedPond ? 'Pond Mood Synchronized!' : 'Harmonize Pond Water with this Art'}</span>
            </button>

            {/* Resolution Selector Options */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                Select Download Format:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'original', label: 'Original 4K', sub: 'Pristine Master' },
                  { id: '2k', label: '2K Quad HD', sub: '2560 × 1440' },
                  { id: '1080p', label: '1080p FHD', sub: '1920 × 1080' },
                  { id: 'mobile', label: 'Mobile 9:16', sub: '1170 × 2532' },
                ].map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setActiveRes(res.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRes === res.id
                        ? 'bg-teal-500/20 border-teal-400 text-white font-medium ring-1 ring-teal-400/50'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-xs">{res.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{res.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
            {/* Heart Favorite Button */}
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                  : 'bg-white/10 text-slate-300 hover:text-white border-white/15 hover:bg-white/15'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Primary Liquid Carve Download Button with Website Palette */}
            <div className="flex-1 flex justify-center">
              <LiquidCarveButton
                label={
                  downloadSuccess
                    ? 'Download Initiated!'
                    : `Download Free (${activeRes.toUpperCase()})`
                }
                onClick={() => handleDownload()}
                colors={{
                  fill: '#2dd4bf',
                  textColor: '#04121b',
                }}
                blob={{
                  color: '#00f5d4',
                  size: 65,
                  smoothness: 60,
                }}
                rounded={24}
                padding="12px 24px"
                font={{
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.02em',
                }}
                addIcon={true}
                icon={{
                  type: 'symbol',
                  symbol: downloadSuccess ? '✓' : '↓',
                  size: 16,
                  color: '#04121b',
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(45,212,191,0.35)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
