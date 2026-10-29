import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WALLPAPERS_DIR = path.resolve(process.cwd(), 'public/wallpapers');
const PC_DIR = path.join(WALLPAPERS_DIR, 'pc');
const MOBILE_DIR = path.join(WALLPAPERS_DIR, 'mobile');

if (!fs.existsSync(PC_DIR)) fs.mkdirSync(PC_DIR, { recursive: true });
if (!fs.existsSync(MOBILE_DIR)) fs.mkdirSync(MOBILE_DIR, { recursive: true });

interface WallpaperDef {
  folder: 'pc' | 'mobile';
  filename: string;
  width: number;
  height: number;
  svg: string;
}

const wallpapers: WallpaperDef[] = [
  // --- PC / LAPTOP (12 items) ---
  {
    folder: 'pc',
    filename: 'pc-celestial-waters-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#12688a"/><stop offset="100%" stop-color="#021420"/></radialGradient>
      </defs>
      <rect width="3840" height="2160" fill="url(#g1)"/>
      <path d="M0,600 Q960,300 1920,650 T3840,500 L3840,0 L0,0 Z" fill="#248fad" fill-opacity="0.3"/>
      <circle cx="1200" cy="800" r="180" fill="#2d7a5b" fill-opacity="0.9"/>
      <circle cx="2600" cy="1400" r="220" fill="#246a4e" fill-opacity="0.85"/>
      <ellipse cx="1800" cy="1100" rx="140" ry="46" fill="#fdfbf7" transform="rotate(35 1800 1100)"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-neon-tokyo-drift-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0b001a"/><stop offset="100%" stop-color="#030008"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g2)"/>
      <rect x="600" y="500" width="300" height="1660" fill="#14062a"/>
      <rect x="1800" y="400" width="450" height="1760" fill="#180733"/>
      <rect x="2800" y="600" width="350" height="1560" fill="#0f0521"/>
      <circle cx="2000" cy="650" r="180" fill="#ff007f" fill-opacity="0.8"/>
      <circle cx="1000" cy="750" r="120" fill="#00e5ff" fill-opacity="0.8"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-kyoto-zen-stones-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#0e1419"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g3)"/>
      <g stroke="#4a6572" stroke-width="3" stroke-opacity="0.4" fill="none">
        <ellipse cx="1920" cy="1300" rx="800" ry="320"/>
        <ellipse cx="1920" cy="1300" rx="1200" ry="480"/>
      </g>
      <ellipse cx="1920" cy="1350" rx="220" ry="110" fill="#1b2832"/>
      <ellipse cx="1920" cy="1200" rx="160" ry="80" fill="#243340"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-bioluminescent-abyss-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g4" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#041d2d"/><stop offset="100%" stop-color="#000305"/></radialGradient></defs>
      <rect width="3840" height="2160" fill="url(#g4)"/>
      <path d="M0,600 C1200,400 2400,800 3840,500" stroke="#00f5d4" stroke-width="6" stroke-opacity="0.6" fill="none"/>
      <path d="M0,1300 C1000,1600 2800,1100 3840,1400" stroke="#7b2cbf" stroke-width="8" stroke-opacity="0.5" fill="none"/>
      <ellipse cx="1800" cy="1100" rx="160" ry="50" fill="#00f5d4" fill-opacity="0.8" transform="rotate(-20 1800 1100)"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-nordic-solitude-curves-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#161b22"/><stop offset="100%" stop-color="#0e1319"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g5)"/>
      <path d="M0,1800 C1000,1200 2000,2000 3840,1400 L3840,2160 L0,2160 Z" fill="#232d3d"/>
      <circle cx="2800" cy="700" r="220" fill="#e2c499" fill-opacity="0.9"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-quantum-singularity-amoled-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <rect width="3840" height="2160" fill="#000000"/>
      <g transform="translate(1920, 1080) rotate(-15)">
        <ellipse cx="0" cy="0" rx="850" ry="240" fill="none" stroke="#d4af37" stroke-width="30" stroke-opacity="0.5"/>
        <ellipse cx="0" cy="0" rx="650" ry="170" fill="none" stroke="#00f0ff" stroke-width="16" stroke-opacity="0.8"/>
        <circle cx="0" cy="0" r="300" fill="#000000" stroke="#fff" stroke-width="4"/>
      </g>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-torii-twilight-horizon-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g7" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f1147"/><stop offset="60%" stop-color="#bd436b"/><stop offset="100%" stop-color="#ff9b71"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g7)"/>
      <circle cx="1920" cy="1300" r="260" fill="#ffeeee"/>
      <rect x="1560" y="850" width="70" height="800" fill="#180a22"/>
      <rect x="2210" y="850" width="70" height="800" fill="#180a22"/>
      <path d="M1360,850 Q1920,810 2480,850 L2480,890 Q1920,860 1360,890 Z" fill="#180a22"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-iridescent-liquid-ribbon-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff007f"/><stop offset="50%" stop-color="#7928ca"/><stop offset="100%" stop-color="#00dfd8"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="#0d0f18"/>
      <path d="M-200,900 C600,200 1200,1600 2200,700 C2800,200 3400,1200 4000,600 L4000,1400 C3200,1900 2400,800 1600,1800 Z" fill="url(#g8)" fill-opacity="0.85"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-emerald-lotus-sanctuary-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g9" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#0a3c36"/><stop offset="100%" stop-color="#021412"/></radialGradient></defs>
      <rect width="3840" height="2160" fill="url(#g9)"/>
      <circle cx="1000" cy="900" r="300" fill="#1d6658" fill-opacity="0.8"/>
      <circle cx="2800" cy="1200" r="360" fill="#18564a" fill-opacity="0.9"/>
      <circle cx="1000" cy="900" r="50" fill="#fff"/>
      <circle cx="2800" cy="1200" r="60" fill="#ffb4a2"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-mount-fuji-golden-dawn-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g10" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e76f51"/><stop offset="40%" stop-color="#f4a261"/><stop offset="100%" stop-color="#264653"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g10)"/>
      <polygon points="1920,600 1300,1800 2540,1800" fill="#1d2d3a"/>
      <polygon points="1920,600 1720,1000 2120,1000" fill="#ffffff"/>
      <circle cx="1920" cy="500" r="240" fill="#e63946" fill-opacity="0.9"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-cyber-matrix-grid-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <rect width="3840" height="2160" fill="#05080c"/>
      <g stroke="#00f5d4" stroke-width="2" stroke-opacity="0.3">
        <line x1="0" y1="1200" x2="3840" y2="1200"/>
        <line x1="0" y1="1400" x2="3840" y2="1400"/>
        <line x1="0" y1="1700" x2="3840" y2="1700"/>
        <line x1="1920" y1="1100" x2="0" y2="2160"/>
        <line x1="1920" y1="1100" x2="3840" y2="2160"/>
      </g>
      <circle cx="1920" cy="900" r="300" fill="#ff007f" fill-opacity="0.6"/>
    </svg>`,
  },
  {
    folder: 'pc',
    filename: 'pc-serene-bamboo-grove-4k.webp',
    width: 3840,
    height: 2160,
    svg: `<svg width="3840" height="2160" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g12" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1b382b"/><stop offset="100%" stop-color="#0a1a13"/></linearGradient></defs>
      <rect width="3840" height="2160" fill="url(#g12)"/>
      <rect x="800" y="0" width="70" height="2160" fill="#2d6a4f"/>
      <rect x="1300" y="0" width="90" height="2160" fill="#40916c"/>
      <rect x="2200" y="0" width="80" height="2160" fill="#2d6a4f"/>
      <rect x="2900" y="0" width="60" height="2160" fill="#1b4332"/>
    </svg>`,
  },

  // --- MOBILE (9:16 Portrait - 12 items) ---
  {
    folder: 'mobile',
    filename: 'mob-studio-pond-vertical-4k.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="mg1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#12688a"/><stop offset="100%" stop-color="#021420"/></radialGradient></defs>
      <rect width="1170" height="2532" fill="url(#mg1)"/>
      <circle cx="585" cy="800" r="160" fill="#2d7a5b"/>
      <circle cx="585" cy="800" r="30" fill="#fff"/>
      <ellipse cx="585" cy="1500" rx="130" ry="45" fill="#fdfbf7" transform="rotate(-65 585 1500)"/>
      <circle cx="300" cy="1900" r="180" fill="#246a4e"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-bioluminescent-night-koi.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#040f1a"/>
      <path d="M0,800 C400,600 800,1000 1170,700" stroke="#00f5d4" stroke-width="5" stroke-opacity="0.6" fill="none"/>
      <ellipse cx="585" cy="1300" rx="140" ry="45" fill="#00f5d4" fill-opacity="0.85" transform="rotate(75 585 1300)"/>
      <circle cx="800" cy="1800" r="140" fill="#082d2f" stroke="#00f5d4" stroke-width="2"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-cyber-shibuya-neon.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#07020e"/>
      <rect x="150" y="600" width="350" height="1932" fill="#14062a"/>
      <rect x="650" y="450" width="380" height="2082" fill="#180733"/>
      <circle cx="585" cy="900" r="180" fill="#ff007f" fill-opacity="0.8"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-zen-balance-stones.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#0e1419"/></linearGradient></defs>
      <rect width="1170" height="2532" fill="url(#mg4)"/>
      <ellipse cx="585" cy="1600" rx="200" ry="90" fill="#1b2832"/>
      <ellipse cx="585" cy="1480" rx="150" ry="70" fill="#243340"/>
      <ellipse cx="585" cy="1380" rx="100" ry="50" fill="#314454"/>
      <circle cx="585" cy="700" r="180" fill="#f39c12" fill-opacity="0.2"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-amoled-event-horizon.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#000000"/>
      <ellipse cx="585" cy="1266" rx="450" ry="140" fill="none" stroke="#d4af37" stroke-width="25" stroke-opacity="0.6"/>
      <circle cx="585" cy="1266" r="160" fill="#000000" stroke="#00f0ff" stroke-width="3"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-minimalist-desert-dune.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#161b22"/>
      <path d="M0,1800 C400,1500 800,2100 1170,1700 L1170,2532 L0,2532 Z" fill="#232d3d"/>
      <circle cx="585" cy="900" r="180" fill="#e2c499" fill-opacity="0.9"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-anime-sky-shrine.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mg7" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1f1147"/><stop offset="50%" stop-color="#bd436b"/><stop offset="100%" stop-color="#ff9b71"/></linearGradient></defs>
      <rect width="1170" height="2532" fill="url(#mg7)"/>
      <circle cx="585" cy="1200" r="220" fill="#ffeeee"/>
      <rect x="420" y="1400" width="40" height="600" fill="#180a22"/>
      <rect x="710" y="1400" width="40" height="600" fill="#180a22"/>
      <rect x="350" y="1400" width="470" height="35" fill="#180a22"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-abstract-fluid-wave.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mg8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff007f"/><stop offset="50%" stop-color="#7928ca"/><stop offset="100%" stop-color="#00dfd8"/></linearGradient></defs>
      <rect width="1170" height="2532" fill="#0d0f18"/>
      <path d="M-100,1200 C300,600 800,2000 1270,1100 L1270,1800 C800,2300 200,1000 -100,1700 Z" fill="url(#mg8)" fill-opacity="0.85"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-golden-koi-circle.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="mg9" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#0a2a38"/><stop offset="100%" stop-color="#020d13"/></radialGradient></defs>
      <rect width="1170" height="2532" fill="url(#mg9)"/>
      <circle cx="585" cy="1266" r="320" fill="none" stroke="#f39c12" stroke-width="3" stroke-opacity="0.3"/>
      <ellipse cx="585" cy="1000" rx="110" ry="38" fill="#f39c12" fill-opacity="0.9" transform="rotate(45 585 1000)"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-emerald-forest-bamboo.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#081812"/>
      <rect x="250" y="0" width="55" height="2532" fill="#2d6a4f"/>
      <rect x="650" y="0" width="70" height="2532" fill="#40916c"/>
      <rect x="900" y="0" width="50" height="2532" fill="#1b4332"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-cherry-blossom-moon.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="mg11" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1b1026"/><stop offset="100%" stop-color="#4a154b"/></linearGradient></defs>
      <rect width="1170" height="2532" fill="url(#mg11)"/>
      <circle cx="585" cy="900" r="220" fill="#fff" fill-opacity="0.9"/>
      <circle cx="350" cy="1400" r="30" fill="#ffb4a2"/>
      <circle cx="750" cy="1600" r="25" fill="#ffb4a2"/>
    </svg>`,
  },
  {
    folder: 'mobile',
    filename: 'mob-cyber-grid-sunset.webp',
    width: 1170,
    height: 2532,
    svg: `<svg width="1170" height="2532" viewBox="0 0 1170 2532" xmlns="http://www.w3.org/2000/svg">
      <rect width="1170" height="2532" fill="#05030a"/>
      <circle cx="585" cy="1100" r="240" fill="#ff007f" fill-opacity="0.75"/>
      <g stroke="#00f5d4" stroke-width="2" stroke-opacity="0.4">
        <line x1="0" y1="1600" x2="1170" y2="1600"/>
        <line x1="0" y1="1800" x2="1170" y2="1800"/>
        <line x1="0" y1="2100" x2="1170" y2="2100"/>
        <line x1="585" y1="1400" x2="0" y2="2532"/>
        <line x1="585" y1="1400" x2="1170" y2="2532"/>
      </g>
    </svg>`,
  },
];

async function run() {
  console.log('Generating 24 HD wallpapers across PC and Mobile...');
  for (const w of wallpapers) {
    const targetDir = w.folder === 'pc' ? PC_DIR : MOBILE_DIR;
    const dest = path.join(targetDir, w.filename);
    const buf = Buffer.from(w.svg);
    await sharp(buf)
      .resize(w.width, w.height)
      .webp({ quality: 90 })
      .toFile(dest);
    console.log(`Generated: ${dest}`);
  }
  console.log('Successfully generated 24 wallpapers!');
}

run().catch(console.error);
