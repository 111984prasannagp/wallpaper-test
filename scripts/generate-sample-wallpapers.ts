import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WALLPAPERS_DIR = path.resolve(process.cwd(), 'public/wallpapers');

interface WallpaperSeed {
  subfolder: string;
  filename: string;
  title: string;
  tags: string[];
  width: number;
  height: number;
  svgContent: string;
}

const seeds: WallpaperSeed[] = [
  {
    subfolder: 'studio-pond',
    filename: 'studio-pond-celestial-waters-4k.webp',
    title: 'Studio Pond: Celestial Waters',
    tags: ['studio pond', 'koi', 'water', 'japanese', 'zen', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="deepWater" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#12688a"/>
            <stop offset="40%" stop-color="#0a4662"/>
            <stop offset="70%" stop-color="#062e43"/>
            <stop offset="100%" stop-color="#021420"/>
          </radialGradient>
          <radialGradient id="caustic" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stop-color="#46d3db" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0a4662" stop-opacity="0"/>
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#deepWater)"/>
        <!-- Organic water contour layers -->
        <path d="M0,400 Q960,150 1920,450 T3840,300 L3840,0 L0,0 Z" fill="#1b789e" fill-opacity="0.25"/>
        <path d="M0,1200 Q1200,800 2400,1300 T3840,1100 L3840,0 L0,0 Z" fill="#248fad" fill-opacity="0.2"/>
        <path d="M0,1800 Q1400,1500 2800,1900 T3840,1700 L3840,2160 L0,2160 Z" fill="#041e2b" fill-opacity="0.5"/>
        
        <!-- Caustic light ripples -->
        <circle cx="1200" cy="800" r="600" fill="url(#caustic)" filter="url(#glow)"/>
        <circle cx="2800" cy="1400" r="700" fill="url(#caustic)" filter="url(#glow)"/>

        <!-- Water Lilies & Pads -->
        <g transform="translate(800, 600)">
          <circle cx="0" cy="0" r="160" fill="#2d7a5b" fill-opacity="0.9"/>
          <path d="M0,0 L160,-30 A160,160 0 0,0 160,30 Z" fill="#12688a"/>
          <!-- Lily flower -->
          <circle cx="-20" cy="-20" r="30" fill="#fff" filter="url(#glow)"/>
          <circle cx="-20" cy="-20" r="14" fill="#ffd166"/>
        </g>

        <g transform="translate(2600, 1500)">
          <circle cx="0" cy="0" r="220" fill="#246a4e" fill-opacity="0.85"/>
          <path d="M0,0 L220,-40 A220,220 0 0,0 220,40 Z" fill="#0a4662"/>
          <circle cx="10" cy="-10" r="40" fill="#fff" filter="url(#glow)"/>
          <circle cx="10" cy="-10" r="18" fill="#ff70a6"/>
        </g>

        <g transform="translate(1900, 1100)">
          <circle cx="0" cy="0" r="140" fill="#388e6a" fill-opacity="0.9"/>
          <path d="M0,0 L140,-25 A140,140 0 0,0 140,25 Z" fill="#0a4662"/>
        </g>

        <!-- Elegant Koi Swimming -->
        <g transform="translate(1400, 1000) rotate(35)">
          <ellipse cx="0" cy="0" rx="140" ry="46" fill="#fdfbf7"/>
          <ellipse cx="30" cy="-8" rx="60" ry="24" fill="#e76f51"/>
          <ellipse cx="-40" cy="10" rx="45" ry="20" fill="#264653"/>
          <polygon points="130,0 200,-25 180,0 200,25" fill="#fdfbf7" fill-opacity="0.8"/>
        </g>
        <g transform="translate(2200, 750) rotate(-60)">
          <ellipse cx="0" cy="0" rx="120" ry="40" fill="#f39c12"/>
          <ellipse cx="20" cy="-5" rx="50" ry="20" fill="#d35400"/>
          <polygon points="110,0 170,-20 150,0 170,20" fill="#f39c12" fill-opacity="0.8"/>
        </g>
      </svg>
    `,
  },
  {
    subfolder: 'studio-pond',
    filename: 'bioluminescent-midnight-pond-4k.webp',
    title: 'Bioluminescent Midnight Pond',
    tags: ['dark', 'bioluminescent', 'koi', 'neon', 'glowing', 'night', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nightWater" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#051726"/>
            <stop offset="60%" stop-color="#020b12"/>
            <stop offset="100%" stop-color="#000306"/>
          </radialGradient>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur1"/>
            <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#nightWater)"/>
        
        <!-- Glowing contour ripples -->
        <path d="M0,500 C1200,300 2400,700 3840,400" stroke="#00f5d4" stroke-width="4" stroke-opacity="0.4" fill="none" filter="url(#neonGlow)"/>
        <path d="M0,1100 C1000,1400 2800,900 3840,1300" stroke="#7b2cbf" stroke-width="5" stroke-opacity="0.4" fill="none" filter="url(#neonGlow)"/>
        <path d="M0,1700 C1500,1500 2500,2000 3840,1650" stroke="#00bbf9" stroke-width="4" stroke-opacity="0.3" fill="none" filter="url(#neonGlow)"/>

        <!-- Glowing Neon Koi -->
        <g transform="translate(1800, 1100) rotate(-25)" filter="url(#neonGlow)">
          <ellipse cx="0" cy="0" rx="150" ry="45" fill="#00f5d4" fill-opacity="0.8"/>
          <ellipse cx="20" cy="-5" rx="70" ry="24" fill="#fee440"/>
          <polygon points="140,0 230,-40 190,0 230,40" fill="#00f5d4" fill-opacity="0.6"/>
        </g>
        <g transform="translate(1100, 1400) rotate(70)" filter="url(#neonGlow)">
          <ellipse cx="0" cy="0" rx="130" ry="40" fill="#f72585" fill-opacity="0.85"/>
          <polygon points="120,0 200,-30 170,0 200,30" fill="#7209b7" fill-opacity="0.7"/>
        </g>
        <!-- Floating Neon Lotus -->
        <circle cx="2800" cy="700" r="140" fill="#032b30" stroke="#00f5d4" stroke-width="3" filter="url(#neonGlow)"/>
        <circle cx="2800" cy="700" r="30" fill="#fee440" filter="url(#neonGlow)"/>
      </svg>
    `,
  },
  {
    subfolder: 'cyberpunk',
    filename: 'neo-tokyo-overdrive-4k.webp',
    title: 'Neo Tokyo Overdrive',
    tags: ['cyberpunk', 'city', 'neon', 'rain', 'futuristic', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cyberSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0b001a"/>
            <stop offset="50%" stop-color="#1f0338"/>
            <stop offset="100%" stop-color="#030008"/>
          </linearGradient>
          <filter id="cityGlow">
            <feGaussianBlur stdDeviation="40" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#cyberSky)"/>
        <!-- Distant skyscrapers -->
        <rect x="400" y="600" width="300" height="1560" fill="#0d041c"/>
        <rect x="850" y="400" width="380" height="1760" fill="#14062a"/>
        <rect x="1400" y="550" width="460" height="1610" fill="#0d041c"/>
        <rect x="2000" y="300" width="500" height="1860" fill="#180733"/>
        <rect x="2700" y="500" width="420" height="1660" fill="#0f0521"/>
        <rect x="3250" y="700" width="350" height="1460" fill="#090214"/>

        <!-- Hologram billboards -->
        <rect x="900" y="500" width="280" height="160" fill="#ff007f" filter="url(#cityGlow)" fill-opacity="0.8"/>
        <rect x="2050" y="450" width="400" height="220" fill="#00e5ff" filter="url(#cityGlow)" fill-opacity="0.8"/>
        <circle cx="2880" cy="700" r="110" fill="#ffe600" filter="url(#cityGlow)" fill-opacity="0.7"/>

        <!-- Wet street reflection -->
        <rect x="0" y="1600" width="3840" height="560" fill="#05010a"/>
        <ellipse cx="1040" cy="1800" rx="350" ry="60" fill="#ff007f" filter="url(#cityGlow)" fill-opacity="0.3"/>
        <ellipse cx="2250" cy="1850" rx="500" ry="70" fill="#00e5ff" filter="url(#cityGlow)" fill-opacity="0.35"/>
      </svg>
    `,
  },
  {
    subfolder: 'nature',
    filename: 'kyoto-mist-zen-garden-4k.webp',
    title: 'Kyoto Mist & Zen Stones',
    tags: ['nature', 'japan', 'zen', 'calm', 'stones', 'minimal', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="zenMist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2c3e50"/>
            <stop offset="50%" stop-color="#1a252f"/>
            <stop offset="100%" stop-color="#0e1419"/>
          </linearGradient>
          <filter id="softMist">
            <feGaussianBlur stdDeviation="60"/>
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#zenMist)"/>
        <!-- Raked sand ripples -->
        <g stroke="#3e5266" stroke-width="3" stroke-opacity="0.3" fill="none">
          <ellipse cx="1920" cy="1300" rx="600" ry="250"/>
          <ellipse cx="1920" cy="1300" rx="800" ry="330"/>
          <ellipse cx="1920" cy="1300" rx="1000" ry="410"/>
          <ellipse cx="1920" cy="1300" rx="1200" ry="490"/>
          <ellipse cx="1920" cy="1300" rx="1450" ry="580"/>
        </g>
        <!-- Zen Balance Stones -->
        <ellipse cx="1920" cy="1350" rx="220" ry="110" fill="#1b2832"/>
        <ellipse cx="1920" cy="1220" rx="170" ry="85" fill="#243340"/>
        <ellipse cx="1920" cy="1110" rx="120" ry="60" fill="#314454"/>
        <ellipse cx="1920" cy="1020" rx="75" ry="40" fill="#435b6f"/>
        <!-- Golden morning sunbeam -->
        <circle cx="800" cy="600" r="400" fill="#f39c12" fill-opacity="0.15" filter="url(#softMist)"/>
      </svg>
    `,
  },
  {
    subfolder: 'minimalist',
    filename: 'nordic-solitude-curves-4k.webp',
    title: 'Nordic Solitude & Organic Curves',
    tags: ['minimalist', 'clean', 'modern', 'architectural', 'dune', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="warmOat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#161b22"/>
            <stop offset="50%" stop-color="#1c2430"/>
            <stop offset="100%" stop-color="#11151c"/>
          </linearGradient>
        </defs>
        <rect width="3840" height="2160" fill="url(#warmOat)"/>
        <!-- Sensual dune lines -->
        <path d="M0,1800 C1000,1200 2000,2000 3840,1400 L3840,2160 L0,2160 Z" fill="#232d3d"/>
        <path d="M0,1300 C1200,1700 2500,900 3840,1100 L3840,2160 L0,2160 Z" fill="#2d3a4e" fill-opacity="0.8"/>
        <path d="M0,900 C1400,600 2400,1200 3840,800 L3840,2160 L0,2160 Z" fill="#3b4b63" fill-opacity="0.6"/>
        <!-- Soft Minimalist Sun -->
        <circle cx="2800" cy="650" r="220" fill="#e2c499" fill-opacity="0.85"/>
      </svg>
    `,
  },
  {
    subfolder: 'amoled',
    filename: 'quantum-singularity-abyss-4k.webp',
    title: 'Quantum Singularity Abyss',
    tags: ['amoled', 'pitch black', 'space', 'singularity', 'gold', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="accretionGlow">
            <feGaussianBlur stdDeviation="35" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Pure 100% AMOLED True Black -->
        <rect width="3840" height="2160" fill="#000000"/>
        
        <!-- Accretion disk rings -->
        <g transform="translate(1920, 1080) rotate(-18)">
          <ellipse cx="0" cy="0" rx="900" ry="260" fill="none" stroke="#d4af37" stroke-width="40" stroke-opacity="0.3" filter="url(#accretionGlow)"/>
          <ellipse cx="0" cy="0" rx="750" ry="200" fill="none" stroke="#ff8c00" stroke-width="24" stroke-opacity="0.6" filter="url(#accretionGlow)"/>
          <ellipse cx="0" cy="0" rx="600" ry="150" fill="none" stroke="#00f0ff" stroke-width="12" stroke-opacity="0.8" filter="url(#accretionGlow)"/>
          <!-- Event Horizon Black Hole Center -->
          <circle cx="0" cy="0" r="320" fill="#000000" stroke="#ffffff" stroke-width="4" stroke-opacity="0.4"/>
        </g>
      </svg>
    `,
  },
  {
    subfolder: 'anime',
    filename: 'torii-floating-sunset-sea-4k.webp',
    title: 'Torii Floating over Twilight Sea',
    tags: ['anime', 'shrine', 'torii', 'sunset', 'sea', 'scenery', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="twilightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1f1147"/>
            <stop offset="35%" stop-color="#54236a"/>
            <stop offset="65%" stop-color="#bd436b"/>
            <stop offset="100%" stop-color="#ff9b71"/>
          </linearGradient>
          <linearGradient id="seaReflection" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff8450"/>
            <stop offset="40%" stop-color="#5f2553"/>
            <stop offset="100%" stop-color="#140b2e"/>
          </linearGradient>
          <filter id="sunGlow">
            <feGaussianBlur stdDeviation="50"/>
          </filter>
        </defs>
        <rect width="3840" height="1350" fill="url(#twilightSky)"/>
        <!-- Sun sinking -->
        <circle cx="1920" cy="1300" r="280" fill="#ffeedd" filter="url(#sunGlow)"/>
        <!-- Water horizon -->
        <rect y="1350" width="3840" height="810" fill="url(#seaReflection)"/>
        <!-- Reflection column -->
        <ellipse cx="1920" cy="1600" rx="200" ry="250" fill="#ffb088" fill-opacity="0.6" filter="url(#sunGlow)"/>
        
        <!-- Torii Gate Silhouette in Foreground -->
        <g fill="#180a22">
          <!-- Main Pillars -->
          <rect x="1560" y="850" width="70" height="800"/>
          <rect x="2210" y="850" width="70" height="800"/>
          <!-- Top Curved Beam (Kasagi) -->
          <path d="M1360,850 Q1920,810 2480,850 L2480,890 Q1920,860 1360,890 Z"/>
          <!-- Second Crossbeam (Nuki) -->
          <rect x="1480" y="990" width="880" height="40"/>
          <!-- Central Tablet (Gakuzuka) -->
          <rect x="1890" y="865" width="60" height="130"/>
        </g>
      </svg>
    `,
  },
  {
    subfolder: 'abstract-3d',
    filename: 'iridescent-silk-fluidity-4k.webp',
    title: 'Iridescent Silk Waves in Motion',
    tags: ['abstract 3d', 'iridescent', 'fluid', 'cloth', 'render', '4k'],
    width: 3840,
    height: 2160,
    svgContent: `
      <svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="silkDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0d0f18"/>
            <stop offset="100%" stop-color="#05070a"/>
          </linearGradient>
          <linearGradient id="irid1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ff007f"/>
            <stop offset="33%" stop-color="#7928ca"/>
            <stop offset="66%" stop-color="#0070f3"/>
            <stop offset="100%" stop-color="#00dfd8"/>
          </linearGradient>
          <filter id="silkBlur">
            <feGaussianBlur stdDeviation="20"/>
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#silkDark)"/>
        <!-- Flowing ribbon waves -->
        <path d="M-200,900 C600,200 1200,1600 2200,700 C2800,200 3400,1200 4000,600 L4000,1400 C3200,1900 2400,800 1600,1800 C800,2400 200,1200 -200,1500 Z" fill="url(#irid1)" fill-opacity="0.85" filter="url(#silkBlur)"/>
      </svg>
    `,
  },
];

async function generateAll() {
  console.log('Generating seed wallpapers...');
  for (const seed of seeds) {
    const dir = path.join(WALLPAPERS_DIR, seed.subfolder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, seed.filename);
    const svgBuffer = Buffer.from(seed.svgContent);
    await sharp(svgBuffer)
      .resize(seed.width, seed.height)
      .webp({ quality: 90 })
      .toFile(filePath);
    console.log(`Generated: ${filePath}`);
  }
  console.log('Finished generating initial high-resolution wallpapers.');
}

generateAll().catch(console.error);
