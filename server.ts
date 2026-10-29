import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse CLI port args (--port 3000) or default strictly to port 3000 in AI Studio
const cliArgs = process.argv.slice(2);
const portFlagIndex = cliArgs.indexOf('--port');
const cliPort = portFlagIndex !== -1 && cliArgs[portFlagIndex + 1] ? parseInt(cliArgs[portFlagIndex + 1], 10) : null;
// Never bind to 8080 in container environment since nginx/control-plane-api uses 8080
const PORT = cliPort || (process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000);

app.use(express.json());

const WALLPAPERS_ROOT = path.resolve(__dirname, 'public/wallpapers');
const CACHE_DIR = path.resolve(__dirname, '.cache/thumbs');

if (!fs.existsSync(WALLPAPERS_ROOT)) {
  fs.mkdirSync(WALLPAPERS_ROOT, { recursive: true });
}
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawCat = (req.query.category || req.body?.category || 'pc').toString().toLowerCase();
    const subfolder = rawCat.includes('mob') ? 'mobile' : 'pc';
    const dest = path.join(WALLPAPERS_ROOT, subfolder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // up to 100MB per file
});

export interface ScannedWallpaper {
  id: string;
  title: string;
  filename: string;
  category: string; // 'Laptop / PC Wallpapers' | 'Mobile Wallpapers'
  deviceType: 'pc' | 'mobile';
  folderPath: string;
  tags: string[];
  width: number;
  height: number;
  aspectRatio: string;
  resolutionLabel: string;
  fileSize: number;
  fileSizeFormatted: string;
  originalUrl: string;
  thumbnailUrl: string;
  colorPalette: string[];
  downloads: number;
  views: number;
  dateAdded: string;
}

// In-memory cache
let cachedWallpapers: ScannedWallpaper[] = [];
let lastScanTime = 0;
const sseClients: express.Response[] = [];

function notifyClients() {
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify({ type: 'wallpapers_updated', timestamp: Date.now() })}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

try {
  fs.watch(WALLPAPERS_ROOT, { recursive: true }, (eventType, filename) => {
    if (filename && !filename.startsWith('.')) {
      lastScanTime = 0;
      notifyClients();
    }
  });
} catch (e) {
  console.warn('fs.watch fallback to timed scan', e);
}

function cleanTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return (
    withoutExt
      .replace(/[-_]+/g, ' ')
      .replace(/\b(4k|8k|hd|uhd|wallpaper|pc|mob)\b/gi, '')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Sanctuary Artwork'
  );
}

function classifyRes(width: number, height: number): string {
  const maxDim = Math.max(width, height);
  if (maxDim >= 7680) return '8K Ultra HD';
  if (maxDim >= 3840) return '4K Ultra HD';
  if (maxDim >= 2560) return '2K QHD';
  if (maxDim >= 1920) return '1080p FHD';
  return 'HD';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function scanDirectoryRecursively(dir: string, baseRelative = ''): Promise<ScannedWallpaper[]> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let list: ScannedWallpaper[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = baseRelative ? `${baseRelative}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subList = await scanDirectoryRecursively(fullPath, relPath);
      list = list.concat(subList);
    } else if (/\.(jpe?g|png|webp|avif|gif)$/i.test(entry.name)) {
      const stats = fs.statSync(fullPath);
      const isMobileFolder = relPath.startsWith('mobile/') || entry.name.startsWith('mob-');

      let width = isMobileFolder ? 1170 : 3840;
      let height = isMobileFolder ? 2532 : 2160;
      let dominantColor = '#12688a';

      try {
        const metadata = await sharp(fullPath).metadata();
        width = metadata.width || width;
        height = metadata.height || height;
      } catch {
        // fallback
      }

      const ratio = width / height;
      const isMobile = isMobileFolder || ratio < 0.9;
      const category = isMobile ? 'Mobile Wallpapers' : 'Laptop / PC Wallpapers';
      const deviceType = isMobile ? 'mobile' : 'pc';
      const aspectRatio = isMobile ? '9:16 Mobile' : ratio > 2.0 ? '21:9 UltraWide' : '16:9 Landscape';

      const id = Buffer.from(relPath).toString('base64url');
      const title = cleanTitle(entry.name);

      list.push({
        id,
        title,
        filename: entry.name,
        category,
        deviceType,
        folderPath: relPath,
        tags: [deviceType, isMobile ? 'mobile' : 'pc', '4k'],
        width,
        height,
        aspectRatio,
        resolutionLabel: classifyRes(width, height),
        fileSize: stats.size,
        fileSizeFormatted: formatBytes(stats.size),
        originalUrl: `/wallpapers/${relPath}`,
        thumbnailUrl: `/api/wallpapers/thumb?file=${encodeURIComponent(relPath)}&w=720`,
        colorPalette: [dominantColor, '#0a4662', '#12688a'],
        downloads: Math.floor(stats.size % 400) + 160,
        views: Math.floor((stats.size % 900) * 3) + 480,
        dateAdded: stats.mtime.toISOString(),
      });
    }
  }

  // Sort newest first by default
  list.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  return list;
}

// 1. Admin login verification endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'gpailab' && password === '111984GP') {
    res.json({
      success: true,
      token: 'gp_auth_token_9884b9e7_verified',
      user: { name: 'G.P. Prasanna', role: 'Founder & Innovator @ gp_ai_lab' },
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid Credentials. Only username "gpailab" with authorized password can access the Admin Panel.',
    });
  }
});

// 2. GET all wallpapers
app.get('/api/wallpapers', async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastScanTime > 3000 || cachedWallpapers.length === 0) {
      cachedWallpapers = await scanDirectoryRecursively(WALLPAPERS_ROOT);
      lastScanTime = now;
    }

    res.json({
      wallpapers: cachedWallpapers,
      categories: ['All Wallpapers', 'Laptop / PC Wallpapers', 'Mobile Wallpapers'],
      totalCount: cachedWallpapers.length,
      timestamp: lastScanTime,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to scan wallpapers folder', details: err.message });
  }
});

// 3. SSE for live real-time auto-expansion
app.get('/api/wallpapers/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 4. Fast thumbnail endpoint with disk caching
app.get('/api/wallpapers/thumb', async (req, res) => {
  try {
    const relFile = String(req.query.file || '');
    const width = Math.min(1920, parseInt(String(req.query.w || '720'), 10));
    const quality = Math.min(95, parseInt(String(req.query.q || '80'), 10));

    if (!relFile || relFile.includes('..')) {
      return res.status(400).send('Invalid file path');
    }

    const fullPath = path.join(WALLPAPERS_ROOT, relFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Image file not found');
    }

    const stat = fs.statSync(fullPath);
    const cacheKey = `${Buffer.from(relFile).toString('base64url')}_${stat.mtimeMs}_w${width}_q${quality}.webp`;
    const cachedFilePath = path.join(CACHE_DIR, cacheKey);

    if (fs.existsSync(cachedFilePath)) {
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(cachedFilePath).pipe(res);
    }

    const imageBuffer = await sharp(fullPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    fs.writeFile(cachedFilePath, imageBuffer, () => {});

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imageBuffer);
  } catch (err: any) {
    res.status(500).send('Compression failed');
  }
});

// 5. One-Click Pristine Download endpoint
app.get('/api/wallpapers/download', async (req, res) => {
  try {
    const relFile = String(req.query.file || '');
    if (!relFile || relFile.includes('..')) {
      return res.status(400).send('Invalid file path');
    }

    const fullPath = path.join(WALLPAPERS_ROOT, relFile);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }

    const baseName = path.basename(fullPath);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}"`);
    return fs.createReadStream(fullPath).pipe(res);
  } catch (err: any) {
    res.status(500).send('Download processing failed');
  }
});

// 6. Admin Multi-file / Single-file Upload endpoint (Permanent Disk Storage)
app.post('/api/wallpapers/upload', upload.array('images', 50), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    // Immediately re-scan to index all files permanently
    cachedWallpapers = await scanDirectoryRecursively(WALLPAPERS_ROOT);
    lastScanTime = Date.now();

    // Persist manifest to disk
    const manifestPath = path.join(WALLPAPERS_ROOT, 'manifest.json');
    try {
      fs.writeFileSync(manifestPath, JSON.stringify(cachedWallpapers, null, 2));
    } catch {
      // ignore
    }

    notifyClients();

    res.json({
      success: true,
      message: `Successfully uploaded and permanently indexed ${files.length} wallpaper(s)!`,
      count: files.length,
      files: files.map((f) => ({ filename: f.filename, path: f.path })),
      wallpapers: cachedWallpapers,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

// 6b. JSON Base64 Backup Upload endpoint (ensures files can always be saved permanently)
app.post('/api/wallpapers/upload-json', async (req, res) => {
  try {
    const { images, category = 'pc' } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const subfolder = category.toLowerCase().includes('mob') ? 'mobile' : 'pc';
    const targetDir = path.join(WALLPAPERS_ROOT, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      const cleanName = `${Date.now()}_${(item.name || `artwork_${i}.webp`).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const filePath = path.join(targetDir, cleanName);

      // Extract base64
      const matches = item.dataUrl ? item.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null;
      if (matches && matches[2]) {
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(filePath, buffer);
      }
    }

    cachedWallpapers = await scanDirectoryRecursively(WALLPAPERS_ROOT);
    lastScanTime = Date.now();
    notifyClients();

    res.json({
      success: true,
      count: images.length,
      wallpapers: cachedWallpapers,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'JSON upload failed', details: err.message });
  }
});

// 7. Delete wallpaper endpoint for Admin
app.delete('/api/wallpapers/:id', (req, res) => {
  try {
    const relPath = Buffer.from(req.params.id, 'base64url').toString('utf-8');
    if (!relPath || relPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    const fullPath = path.join(WALLPAPERS_ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    lastScanTime = 0;
    notifyClients();
    res.json({ success: true, message: 'Wallpaper deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

// Serve static wallpapers folder
app.use('/wallpapers', express.static(WALLPAPERS_ROOT));

// Vite or static dist middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Studio Pond server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
