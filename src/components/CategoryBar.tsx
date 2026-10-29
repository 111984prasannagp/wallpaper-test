import React from 'react';
import {
  Laptop,
  Smartphone,
  Sparkles,
  Heart,
  Grid,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react';
import { SortOption } from '../utils/wallpaper-filters';
import { SlidingSegmentedTabs } from './SlidingSegmentedTabs';
import { SortDropdown } from './SortDropdown';

interface CategoryBarProps {
  selectedCategory: string; // 'All' | 'Laptop / PC Wallpapers' | 'Mobile Wallpapers'
  onSelectCategory: (cat: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortBy: SortOption;
  onSelectSort: (sort: SortOption) => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoritesCount: number;
  viewMode: 'grid' | 'dense';
  onToggleViewMode: () => void;
  pcCount: number;
  mobileCount: number;
  scrollBlurEnabled?: boolean;
  onToggleScrollBlur?: () => void;
  scrollBlurAmount?: number;
}

const QUICK_TAGS = ['All', 'Anime', 'Cyberpunk', 'Nature', 'Minimal', 'Amoled', '3D'];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  sortBy,
  onSelectSort,
  favoritesOnly,
  onToggleFavoritesOnly,
  favoritesCount,
  viewMode,
  onToggleViewMode,
  pcCount,
  mobileCount,
  scrollBlurEnabled,
  onToggleScrollBlur,
  scrollBlurAmount,
}) => {
  return (
    <div className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8 select-none space-y-3">
      {/* Search Input Bar + Quick Filter Tags */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 backdrop-blur-2xl border border-white/15 shadow-lg">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search wallpapers by title, tags (#anime, #nature), or resolution..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs font-mono focus:outline-none focus:border-teal-400 focus:bg-white/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {QUICK_TAGS.map((tag) => {
            const isTagActive = tag === 'All' ? searchQuery === '' : searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => {
                  if (tag === 'All') {
                    onSearchChange?.('');
                  } else {
                    onSearchChange?.(searchQuery.toLowerCase() === tag.toLowerCase() ? '' : tag);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isTagActive
                    ? 'bg-teal-400/20 text-teal-300 border border-teal-400/40 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 Primary Sections: Laptop / PC vs Mobile + All & Favorites */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 rounded-3xl bg-slate-950/65 backdrop-blur-2xl border border-white/20 shadow-[0_15px_35px_rgba(0,15,30,0.6)]">
        {/* Segmented Tab Control with Sliding Highlighted Pill (Image 3) */}
        <SlidingSegmentedTabs
          tabs={[
            {
              id: 'Laptop / PC Wallpapers',
              label: 'Laptop / PC',
              icon: <Laptop className="w-4 h-4" />,
              count: pcCount,
            },
            {
              id: 'Mobile Wallpapers',
              label: 'Mobile',
              icon: <Smartphone className="w-4 h-4" />,
              count: mobileCount,
            },
            {
              id: 'All',
              label: 'All',
              icon: <Sparkles className="w-3.5 h-3.5 text-teal-300" />,
              count: pcCount + mobileCount,
            },
            {
              id: 'favorites',
              label: 'Favorites',
              icon: (
                <Heart
                  className={`w-3.5 h-3.5 ${
                    favoritesOnly ? 'fill-white' : 'fill-pink-400'
                  }`}
                />
              ),
              count: favoritesCount,
            },
          ]}
          activeId={favoritesOnly ? 'favorites' : selectedCategory}
          onChange={(id) => {
            if (id === 'favorites') {
              if (!favoritesOnly) onToggleFavoritesOnly();
            } else {
              if (favoritesOnly) onToggleFavoritesOnly();
              onSelectCategory(id);
            }
          }}
        />

        {/* Right side: Sorting dropdown & grid density */}
        <div className="flex items-center space-x-2.5 ml-auto">
          {/* Sorting Dropdown (Popularity, Newest, Resolution) */}
          <SortDropdown sortBy={sortBy} onSelectSort={onSelectSort} />

          {/* Scroll Motion Blur Dynamic Indicator / Toggle */}
          {onToggleScrollBlur && (
            <button
              onClick={onToggleScrollBlur}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all duration-200 flex items-center space-x-1.5 cursor-pointer ${
                scrollBlurEnabled
                  ? 'bg-teal-500/20 text-teal-300 border-teal-400/40 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
              title={
                scrollBlurEnabled
                  ? 'Kinetic Scroll Motion Blur is ACTIVE (click to toggle)'
                  : 'Kinetic Scroll Motion Blur is OFF (click to enable)'
              }
              aria-label="Toggle scroll blur effect"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  scrollBlurEnabled
                    ? (scrollBlurAmount || 0) > 0.1
                      ? 'bg-teal-300 animate-ping'
                      : 'bg-teal-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="hidden md:inline">Scroll Blur:</span>
              <span className="font-bold">
                {scrollBlurEnabled
                  ? (scrollBlurAmount || 0) > 0.1
                    ? `${(scrollBlurAmount || 0).toFixed(1)}px`
                    : 'On'
                  : 'Off'}
              </span>
            </button>
          )}

          <button
            onClick={onToggleViewMode}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/15 transition-colors cursor-pointer"
            title={viewMode === 'grid' ? 'Switch to compact dense view' : 'Switch to comfortable grid view'}
            aria-label="Toggle grid layout"
          >
            {viewMode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
