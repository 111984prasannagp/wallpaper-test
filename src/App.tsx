import React, { useState, useEffect, useRef } from 'react';
import { PondCanvas } from './components/PondCanvas';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { CategoryBar } from './components/CategoryBar';
import { WallpaperCard } from './components/WallpaperCard';
import { WallpaperModal } from './components/WallpaperModal';
import { AdminPanel } from './components/AdminPanel';
import {
  WallpaperItem,
  SortOption,
  filterAndSortWallpapers,
} from './utils/wallpaper-filters';
import { useScrollBlur } from './hooks/useScrollBlur';
import { Sparkles, Heart, RefreshCw, ArrowUp, Lock, Wind } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('studio_pond_dark_mode') === 'true';
  });
  const [ambientTone, setAmbientTone] = useState<string | undefined>(undefined);

  // Dynamic Scroll Motion Blur
  const [scrollBlurEnabled, setScrollBlurEnabled] = useState<boolean>(() => {
    return localStorage.getItem('studio_pond_scroll_blur') !== 'false';
  });
  const scrollBlur = useScrollBlur(scrollBlurEnabled, 3.5);

  const toggleScrollBlur = () => {
    setScrollBlurEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('studio_pond_scroll_blur', String(next));
      showToast(
        next
          ? 'Kinetic Scroll Motion Blur enabled 🌊'
          : 'Scroll Motion Blur disabled'
      );
      return next;
    });
  };

  // App-level view routing: 'website' or 'admin'
  const [currentView, setCurrentView] = useState<'website' | 'admin'>('website');

  // Wallpapers state
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Categories, Search & Sort
  const [selectedCategory, setSelectedCategory] = useState<string>('Laptop / PC Wallpapers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'dense'>('grid');

  // Favorites (persisted in localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('studio_pond_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Modals
  const [previewItem, setPreviewItem] = useState<WallpaperItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch wallpapers from API (with local client storage backup for Netlify)
  const fetchWallpapers = async () => {
    try {
      const res = await fetch('/api/wallpapers');
      if (res.ok) {
        const data = await res.json();
        if (data.wallpapers && data.wallpapers.length > 0) {
          // Merge with any client custom uploads, strictly ignoring stale blob: URLs
          const localCustom = localStorage.getItem('gp_custom_wallpapers');
          let customList: WallpaperItem[] = localCustom ? JSON.parse(localCustom) : [];
          const validCustomList = customList.filter(
            (item) => item.originalUrl && !item.originalUrl.startsWith('blob:')
          );
          if (validCustomList.length !== customList.length) {
            localStorage.setItem('gp_custom_wallpapers', JSON.stringify(validCustomList));
          }
          const combined = [...validCustomList, ...data.wallpapers];
          // Deduplicate by id
          const seen = new Set();
          const unique = combined.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          setWallpapers(unique);
        }
      }
    } catch {
      // Fallback
      const localCustom = localStorage.getItem('gp_custom_wallpapers');
      if (localCustom) {
        const customList: WallpaperItem[] = JSON.parse(localCustom);
        const validCustomList = customList.filter(
          (item) => item.originalUrl && !item.originalUrl.startsWith('blob:')
        );
        setWallpapers(validCustomList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();

    // SSE connection for live updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/wallpapers/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'wallpapers_updated') {
            fetchWallpapers();
            showToast('New wallpaper added! Gallery updated automatically.');
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    const handleFocus = () => fetchWallpapers();
    window.addEventListener('focus', handleFocus);

    const scrollHandler = () => {
      setShowScrollTop(window.scrollY > 400);
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('studio_pond_dark_mode', String(next));
    showToast(next ? 'Switched to Midnight Bioluminescent Pond' : 'Switched to Daylight Cerulean Pond');
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from favorites');
      } else {
        next.add(id);
        showToast('Saved to your favorites!');
      }
      localStorage.setItem('studio_pond_favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleDownload = (item: WallpaperItem, resolution = 'original') => {
    const downloadUrl = `/api/wallpapers/download?file=${encodeURIComponent(item.folderPath || item.filename || item.id)}`;
    const link = document.createElement('a');
    link.href = item.originalUrl || downloadUrl;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2dd4bf', '#38bdf8', '#fb7185'],
      });
    } catch {
      // ignore
    }

    showToast(`Downloading 4K High Quality: ${item.title}...`);
  };

  const handleAddCustom = (item: WallpaperItem) => {
    setWallpapers((prev) => {
      const next = [item, ...prev];
      localStorage.setItem('gp_custom_wallpapers', JSON.stringify(next));
      return next;
    });
    showToast(`Added ${item.title} to website gallery!`);
  };

  const handleDeleteWallpaper = (id: string) => {
    setWallpapers((prev) => {
      const next = prev.filter((w) => w.id !== id);
      localStorage.setItem('gp_custom_wallpapers', JSON.stringify(next));
      return next;
    });
    showToast('Wallpaper deleted.');
  };

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered wallpapers based on Laptop/PC vs Mobile vs All and search
  const filteredItems = filterAndSortWallpapers(wallpapers, {
    category: selectedCategory,
    search: searchQuery,
    favoritesOnly,
    favoritesSet: favorites,
    sortBy,
  });

  const pcCount = wallpapers.filter((w) => w.deviceType === 'pc' || w.category.toLowerCase().includes('pc') || w.category.toLowerCase().includes('laptop')).length;
  const mobileCount = wallpapers.filter((w) => w.deviceType === 'mobile' || w.category.toLowerCase().includes('mobile')).length;
  const totalDownloads = wallpapers.reduce((acc, cur) => acc + cur.downloads, 0);

  // If in Admin view, render AdminPanel directly
  if (currentView === 'admin') {
    return (
      <AdminPanel
        onBackToWebsite={() => setCurrentView('website')}
        wallpapers={wallpapers}
        onRefreshWallpapers={fetchWallpapers}
        onAddCustomWallpaper={handleAddCustom}
        onDeleteWallpaper={handleDeleteWallpaper}
      />
    );
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Top Aquatic Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[3.5px] z-50 pointer-events-none bg-black/20">
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.9)] transition-all duration-150 relative"
          style={{ width: `${scrollProgress}%` }}
        >
          {scrollProgress > 2 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#2dd4bf] animate-ping" />
          )}
        </div>
      </div>

      {/* 1. Full-Page Interactive Pond Background */}
      <PondCanvas isDarkMode={isDarkMode} ambientTone={ambientTone} />

      {/* 2. Main Page Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <HeaderNav
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          wallpaperCount={wallpapers.length}
          favoritesCount={favorites.size}
          onOpenAdmin={() => setCurrentView('admin')}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setFavoritesOnly(false);
            scrollToGallery();
          }}
          selectedCategory={selectedCategory}
        />

        {/* Hero Section */}
        <HeroSection
          wallpapers={wallpapers}
          onScrollDown={scrollToGallery}
          totalDownloads={totalDownloads}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setFavoritesOnly(false);
          }}
        />

        {/* Gallery Section */}
        <div ref={galleryRef} className="pt-6 pb-24">
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSelectSort={setSortBy}
            favoritesOnly={favoritesOnly}
            onToggleFavoritesOnly={() => setFavoritesOnly(!favoritesOnly)}
            favoritesCount={favorites.size}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'dense' : 'grid')}
            pcCount={pcCount}
            mobileCount={mobileCount}
            scrollBlurEnabled={scrollBlurEnabled}
            onToggleScrollBlur={toggleScrollBlur}
            scrollBlurAmount={scrollBlur.blurAmount}
          />

          {/* Clean Wallpaper Grid with Kinetic Scroll Motion Blur Animation */}
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            {isLoading ? (
              <div className="text-center py-20 space-y-3">
                <RefreshCw className="w-8 h-8 text-teal-300 animate-spin mx-auto" />
                <p className="font-mono text-xs text-slate-300">
                  Loading high-resolution wallpapers...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 px-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 max-w-lg mx-auto">
                <Heart className="w-10 h-10 text-teal-300 mx-auto mb-3 opacity-60" />
                <h3 className="font-bubbly text-2xl text-white mb-2">
                  {favoritesOnly ? 'No Favorites Saved Yet' : 'No Wallpapers in this Section'}
                </h3>
                <p className="text-xs font-mono text-slate-300 mb-6">
                  {favoritesOnly
                    ? 'Click the heart icon on any wallpaper card to save your favorites.'
                    : 'Switch category tabs or upload new wallpapers in Admin panel.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setFavoritesOnly(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bubbly font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Show All Wallpapers
                </button>
              </div>
            ) : (
              <div
                data-testid="wallpaper-gallery-grid"
                className={`grid gap-5 sm:gap-6 ${
                  selectedCategory === 'Mobile Wallpapers'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4'
                    : viewMode === 'dense'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
                style={{
                  filter:
                    scrollBlurEnabled && scrollBlur.blurAmount > 0.05
                      ? `blur(${scrollBlur.blurAmount}px)`
                      : 'none',
                  transform:
                    scrollBlurEnabled && scrollBlur.isScrolling
                      ? `translate3d(0, 0, 0) skewY(${scrollBlur.tiltShear}deg)`
                      : 'none',
                  willChange:
                    scrollBlurEnabled && scrollBlur.isScrolling
                      ? 'filter, transform'
                      : 'auto',
                  transition:
                    scrollBlurEnabled && scrollBlur.isScrolling
                      ? 'filter 0.04s ease-out'
                      : 'filter 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s ease-out',
                }}
              >
                {filteredItems.map((item) => (
                  <WallpaperCard
                    key={item.id}
                    item={item}
                    isFavorite={favorites.has(item.id)}
                    onToggleFavorite={toggleFavorite}
                    onOpenPreview={setPreviewItem}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Motion Blur HUD Feedback */}
        {scrollBlurEnabled && scrollBlur.isScrolling && scrollBlur.blurAmount > 0.3 && (
          <div
            data-testid="scroll-blur-hud"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-slate-950/85 border border-teal-400/40 text-teal-300 font-mono text-[11px] shadow-2xl backdrop-blur-md flex items-center space-x-2 pointer-events-none transition-all duration-150"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="font-semibold">Scroll Blur: {scrollBlur.blurAmount.toFixed(1)}px</span>
            <span className="text-slate-400 capitalize">({scrollBlur.direction})</span>
          </div>
        )}

        {/* Clean Minimalist Footer */}
        <footer className="mt-auto border-t border-white/10 py-8 px-6 sm:px-12 bg-black/60 backdrop-blur-xl text-xs font-mono text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <span className="font-serif-title text-lg font-bold text-teal-300 tracking-wide whitespace-nowrap">Studio Pond</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">High-Resolution Visual Sanctuaries</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('admin')}
              className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Admin Portal</span>
            </button>
            <button
              onClick={scrollToTop}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-teal-300 border border-white/10 transition-colors cursor-pointer"
            >
              Top ↑
            </button>
          </div>
        </footer>
      </div>

      {/* Wallpaper Modal Preview */}
      {previewItem && (
        <WallpaperModal
          item={previewItem}
          isFavorite={favorites.has(previewItem.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setPreviewItem(null)}
          onDownload={handleDownload}
          onApplyPondTone={(tone) => {
            setAmbientTone(tone);
            showToast('Pond water synchronized with wallpaper colors!');
          }}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-900/95 border border-teal-400/40 text-teal-200 text-xs font-mono shadow-2xl backdrop-blur-xl animate-fadeIn">
          <Sparkles className="w-4 h-4 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Scroll to Top Button - Positioned at bottom-20 right-6 to never overlap footer text */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-40 p-3 rounded-full bg-slate-900/90 hover:bg-teal-600 text-white border border-teal-400/30 backdrop-blur-md shadow-2xl transition-all hover:scale-110 cursor-pointer"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
