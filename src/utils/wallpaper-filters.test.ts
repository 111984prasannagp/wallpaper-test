import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFileSize,
  classifyResolution,
  calculateAspectRatioLabel,
  filterAndSortWallpapers,
  WallpaperItem,
} from './wallpaper-filters';

test('formatFileSize formats bytes to appropriate human-readable units', () => {
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
});

test('classifyResolution classifies standard video/display dimensions', () => {
  assert.equal(classifyResolution(3840, 2160), '4K Ultra HD');
  assert.equal(classifyResolution(7680, 4320), '8K Ultra HD');
  assert.equal(classifyResolution(2560, 1440), '2K QHD');
  assert.equal(classifyResolution(1920, 1080), '1080p Full HD');
  assert.equal(classifyResolution(1280, 720), 'HD');
});

test('calculateAspectRatioLabel detects 16:9, ultrawide, and portrait ratios', () => {
  assert.equal(calculateAspectRatioLabel(1920, 1080), '16:9 Landscape');
  assert.equal(calculateAspectRatioLabel(3440, 1440), '21:9 UltraWide');
  assert.equal(calculateAspectRatioLabel(1080, 1920), '9:16 Portrait / Mobile');
  assert.equal(calculateAspectRatioLabel(1000, 1000), '1:1 Square');
});

test('filterAndSortWallpapers filters by query, category, and favorites', () => {
  const sampleItems: WallpaperItem[] = [
    {
      id: '1',
      title: 'Studio Pond Tranquility',
      filename: 'studio-pond-01.jpg',
      category: 'Studio Pond',
      tags: ['koi', 'water', 'zen'],
      width: 3840,
      height: 2160,
      aspectRatio: '16:9 Landscape',
      resolutionLabel: '4K Ultra HD',
      fileSize: 4200000,
      fileSizeFormatted: '4.0 MB',
      originalUrl: '/wallpapers/studio-pond-01.jpg',
      thumbnailUrl: '/api/wallpapers/thumb/1',
      colorPalette: ['#1e3a5f'],
      downloads: 120,
      views: 500,
      dateAdded: '2026-01-01',
    },
    {
      id: '2',
      title: 'Neon Cyber Drift',
      filename: 'cyber-02.jpg',
      category: 'Cyberpunk',
      tags: ['neon', 'city', 'night'],
      width: 2560,
      height: 1440,
      aspectRatio: '16:9 Landscape',
      resolutionLabel: '2K QHD',
      fileSize: 2200000,
      fileSizeFormatted: '2.1 MB',
      originalUrl: '/wallpapers/cyber-02.jpg',
      thumbnailUrl: '/api/wallpapers/thumb/2',
      colorPalette: ['#ff007f'],
      downloads: 450,
      views: 980,
      dateAdded: '2026-02-01',
    },
  ];

  // Filter by category
  const pondOnly = filterAndSortWallpapers(sampleItems, { category: 'Studio Pond' });
  assert.equal(pondOnly.length, 1);
  assert.equal(pondOnly[0].id, '1');

  // Search by keyword
  const neonSearch = filterAndSortWallpapers(sampleItems, { search: 'neon' });
  assert.equal(neonSearch.length, 1);
  assert.equal(neonSearch[0].id, '2');

  // Filter by favorites
  const favs = new Set(['1']);
  const favOnly = filterAndSortWallpapers(sampleItems, { favoritesOnly: true, favoritesSet: favs });
  assert.equal(favOnly.length, 1);
  assert.equal(favOnly[0].id, '1');

  // Sort by downloads
  const sortedByDownloads = filterAndSortWallpapers(sampleItems, { sortBy: 'downloads' });
  assert.equal(sortedByDownloads[0].id, '2'); // Neon has 450 downloads

  // Sort by Popularity
  const sortedByPopular = filterAndSortWallpapers(sampleItems, { sortBy: 'popular' });
  assert.equal(sortedByPopular[0].id, '2'); // Neon has higher engagement (980 views + 450*2 = 1880)

  // Sort by Newest
  const sortedByNewest = filterAndSortWallpapers(sampleItems, { sortBy: 'newest' });
  assert.equal(sortedByNewest[0].id, '2'); // Neon is 2026-02-01 vs 2026-01-01

  // Sort by Resolution (High to Low)
  const sortedByResolution = filterAndSortWallpapers(sampleItems, { sortBy: 'resolution' });
  assert.equal(sortedByResolution[0].id, '1'); // Studio Pond is 3840x2160 (8.29M px) vs Neon 2560x1440 (3.68M px)
});
