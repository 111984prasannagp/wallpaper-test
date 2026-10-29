export interface WallpaperItem {
  id: string;
  title: string;
  filename: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  aspectRatio: string; // '16:9' | '21:9' | '9:16' | '4:3'
  resolutionLabel: string; // '8K' | '4K' | '2K' | '1080p'
  fileSize: number; // bytes
  fileSizeFormatted: string;
  originalUrl: string;
  thumbnailUrl: string;
  colorPalette: string[];
  downloads: number;
  views: number;
  dateAdded: string;
  isCustomFolder?: boolean;
  folderPath?: string;
  deviceType?: 'pc' | 'mobile';
}

export type SortOption = 'newest' | 'popular' | 'downloads' | 'resolution';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function classifyResolution(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  if (maxDim >= 7680) return '8K Ultra HD';
  if (maxDim >= 3840) return '4K Ultra HD';
  if (maxDim >= 2560) return '2K QHD';
  if (maxDim >= 1920) return '1080p Full HD';
  return 'HD';
}

export function calculateAspectRatioLabel(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9 Landscape';
  if (Math.abs(ratio - 21 / 9) < 0.2 || ratio > 2.0) return '21:9 UltraWide';
  if (Math.abs(ratio - 9 / 16) < 0.1 || ratio < 0.7) return '9:16 Portrait / Mobile';
  if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3 Classic';
  if (Math.abs(ratio - 1) < 0.05) return '1:1 Square';
  return `${ratio.toFixed(2)}:1 Custom`;
}

export function filterAndSortWallpapers(
  items: WallpaperItem[],
  options: {
    search?: string;
    category?: string;
    aspectRatio?: string;
    favoritesOnly?: boolean;
    favoritesSet?: Set<string>;
    sortBy?: SortOption;
  }
): WallpaperItem[] {
  const query = (options.search || '').trim().toLowerCase();
  const selectedCatLower = (options.category || 'all').toLowerCase();
  const selectedRatioLower = (options.aspectRatio || 'all').toLowerCase();

  let results = items.filter((item) => {
    // Category check
    if (selectedCatLower !== 'all') {
      const isPcFilter = selectedCatLower.includes('pc') || selectedCatLower.includes('laptop');
      const isMobileFilter = selectedCatLower.includes('mobile') || selectedCatLower.includes('mob');

      if (isPcFilter) {
        const isItemPc = item.deviceType === 'pc' || item.category.toLowerCase().includes('pc') || item.category.toLowerCase().includes('laptop') || item.aspectRatio.includes('16:9') || item.aspectRatio.includes('21:9');
        if (!isItemPc) return false;
      } else if (isMobileFilter) {
        const isItemMobile = item.deviceType === 'mobile' || item.category.toLowerCase().includes('mobile') || item.aspectRatio.includes('9:16');
        if (!isItemMobile) return false;
      } else {
        const matchCat = item.category.toLowerCase() === selectedCatLower;
        const matchFolder = item.folderPath?.toLowerCase().includes(selectedCatLower);
        if (!matchCat && !matchFolder) return false;
      }
    }

    // Favorites check
    if (options.favoritesOnly && options.favoritesSet) {
      if (!options.favoritesSet.has(item.id)) return false;
    }

    // Aspect ratio check
    if (selectedRatioLower !== 'all') {
      if (!item.aspectRatio.toLowerCase().includes(selectedRatioLower)) {
        return false;
      }
    }

    // Search query check
    if (query) {
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesCat = item.category.toLowerCase().includes(query);
      const matchesTags = item.tags.some((t) => t.toLowerCase().includes(query));
      const matchesFilename = item.filename.toLowerCase().includes(query);
      if (!matchesTitle && !matchesCat && !matchesTags && !matchesFilename) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  const sortBy = options.sortBy || 'newest';
  results.sort((a, b) => {
    if (sortBy === 'newest') {
      const timeB = new Date(b.dateAdded || 0).getTime();
      const timeA = new Date(a.dateAdded || 0).getTime();
      return timeB - timeA;
    }
    if (sortBy === 'popular') {
      const scoreB = (b.views || 0) + (b.downloads || 0) * 2;
      const scoreA = (a.views || 0) + (a.downloads || 0) * 2;
      return scoreB - scoreA || (b.downloads || 0) - (a.downloads || 0);
    }
    if (sortBy === 'downloads') {
      return (b.downloads || 0) - (a.downloads || 0);
    }
    if (sortBy === 'resolution') {
      const pixelsB = (b.width || 0) * (b.height || 0);
      const pixelsA = (a.width || 0) * (a.height || 0);
      return pixelsB - pixelsA;
    }
    return 0;
  });

  return results;
}
