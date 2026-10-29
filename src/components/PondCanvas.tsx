import React, { useEffect, useRef } from 'react';
import {
  KoiFishState,
  WaterRipple,
  SplashDroplet,
  SplashBubble,
  SplashCrown,
  turnTowardAngle,
  calculateFishSpine,
  calculateKoiBodyContour,
  calculateFinFlutter,
  calculateBoundarySteering,
  updateRipple,
  updateSplashDroplet,
  updateSplashBubble,
  updateSplashCrown,
  createHyperRealisticSplash,
  Point2D,
  PondTurtleState,
  PondShrimpState,
  WaterStriderState,
  updateTurtleKinematics,
  updateShrimpKinematics,
  updateWaterStrider,
} from '../utils/pond-physics';

interface PondCanvasProps {
  isDarkMode: boolean;
  ambientTone?: string;
}

interface FoodPellet {
  x: number;
  y: number;
  depth: number;
  life: number;
  size: number;
}

interface FloatingPetal {
  x: number;
  y: number;
  radius: number;
  angle: number;
  rotSpeed: number;
  driftX: number;
  driftY: number;
  color: string;
}

interface MinnowFish {
  x: number;
  y: number;
  angle: number;
  speed: number;
  targetAngle: number;
  color: string;
  wigglePhase: number;
}

interface LilyPad {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  hasFlower: boolean;
  flowerColor: string;
  flowerPulse: number;
  dewDrops: Array<{ x: number; y: number; r: number }>;
}

interface CursorWakePoint {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

/**
 * Procedural Web Audio Water Splash Synthesizer
 * Uses a singleton AudioContext to prevent context exhaustion and browser crashes
 */
let sharedAudioCtx: AudioContext | null = null;
function getSharedAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playProceduralSplashSound(intensity = 1.0) {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Water impact "thud/bloomp" (low frequency pitch-drop sine wave)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = 220 + Math.random() * 40;
    const endFreq = 48 + Math.random() * 12;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    const volume = Math.min(0.22, 0.14 * intensity);
    oscGain.gain.setValueAtTime(volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // 2. Liquid rush texture (subtle bandpassed noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.13);

    // 3. Resonant secondary droplet "plinks"
    const plinkCount = Math.floor(Math.random() * 2) + 1;
    for (let p = 0; p < plinkCount; p++) {
      const plinkDelay = 0.05 + p * 0.04 + Math.random() * 0.03;
      const plinkOsc = ctx.createOscillator();
      const plinkGain = ctx.createGain();
      plinkOsc.type = 'sine';
      const plinkFreq = 1100 + Math.random() * 900;
      plinkOsc.frequency.setValueAtTime(plinkFreq, now + plinkDelay);
      plinkOsc.frequency.exponentialRampToValueAtTime(plinkFreq * 1.25, now + plinkDelay + 0.05);

      plinkGain.gain.setValueAtTime(volume * 0.35, now + plinkDelay);
      plinkGain.gain.exponentialRampToValueAtTime(0.001, now + plinkDelay + 0.08);

      plinkOsc.connect(plinkGain);
      plinkGain.connect(ctx.destination);
      plinkOsc.start(now + plinkDelay);
      plinkOsc.stop(now + plinkDelay + 0.09);
    }
  } catch {
    // AudioContext might be blocked before first user interaction
  }
}

export const PondCanvas: React.FC<PondCanvasProps> = ({ isDarkMode, ambientTone }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDarkRef = useRef(isDarkMode);
  const ambientToneRef = useRef(ambientTone);
  const scrollYRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const mouseRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    lastMove: number;
  }>({
    x: -999,
    y: -999,
    vx: 0,
    vy: 0,
    active: false,
    lastMove: 0,
  });

  useEffect(() => {
    isDarkRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    ambientToneRef.current = ambientTone;
  }, [ambientTone]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset;
      const delta = currentY - lastScrollYRef.current;
      scrollVelocityRef.current = Math.max(-50, Math.min(50, delta));
      lastScrollYRef.current = currentY;
      scrollYRef.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Natural Lily Pads with dew drops and blooming lotus flowers
    const lilyPads: LilyPad[] = [
      {
        x: width * 0.15,
        y: height * 0.25,
        radius: 78,
        rotation: 0.4,
        hasFlower: true,
        flowerColor: '#ffd166',
        flowerPulse: 0,
        dewDrops: [
          { x: 15, y: -20, r: 3 },
          { x: -25, y: 15, r: 2.2 },
        ],
      },
      {
        x: width * 0.84,
        y: height * 0.28,
        radius: 92,
        rotation: 1.2,
        hasFlower: true,
        flowerColor: '#ff70a6',
        flowerPulse: 1.2,
        dewDrops: [
          { x: 30, y: 10, r: 4 },
          { x: -10, y: -30, r: 2.5 },
        ],
      },
      {
        x: width * 0.48,
        y: height * 0.52,
        radius: 64,
        rotation: -0.8,
        hasFlower: false,
        flowerColor: '',
        flowerPulse: 0,
        dewDrops: [{ x: 10, y: 12, r: 2 }],
      },
      {
        x: width * 0.10,
        y: height * 0.74,
        radius: 102,
        rotation: 2.1,
        hasFlower: true,
        flowerColor: '#ffffff',
        flowerPulse: 2.4,
        dewDrops: [
          { x: -25, y: -15, r: 3.5 },
          { x: 35, y: 20, r: 2 },
        ],
      },
      {
        x: width * 0.88,
        y: height * 0.80,
        radius: 84,
        rotation: -1.5,
        hasFlower: true,
        flowerColor: '#ff9ebb',
        flowerPulse: 3.1,
        dewDrops: [{ x: 20, y: -10, r: 2.8 }],
      },
      {
        x: width * 0.35,
        y: height * 0.90,
        radius: 68,
        rotation: 0.9,
        hasFlower: false,
        flowerColor: '',
        flowerPulse: 0,
        dewDrops: [],
      },
      {
        x: width * 0.64,
        y: height * 0.13,
        radius: 76,
        rotation: -0.3,
        hasFlower: true,
        flowerColor: '#ffd166',
        flowerPulse: 0.8,
        dewDrops: [{ x: -15, y: -10, r: 3 }],
      },
    ];

    // Seed authentic Japanese Nishikigoi varieties with 3D depth
    const fishSchemes: Array<KoiFishState['colorScheme']> = [
      'kohaku',
      'showa',
      'ogon',
      'tancho',
      'kohaku',
      'showa',
      'shiro',
      'ogon',
      'biolum',
      'kohaku',
      'tancho',
      'showa',
    ];

    const fishes: KoiFishState[] = fishSchemes.map((scheme, i) => {
      const angle = Math.random() * Math.PI * 2;
      const zDepth = 0.15 + (i / fishSchemes.length) * 0.7; // depth distribution
      return {
        id: `koi-${i}`,
        x: Math.random() * (width - 240) + 120,
        y: Math.random() * (height - 240) + 120,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        angle,
        targetAngle: angle,
        speed: 1.4 + Math.random() * 0.7,
        targetSpeed: 1.4 + Math.random() * 0.7,
        turnSpeed: 0.045 + Math.random() * 0.02,
        length: 58 + Math.random() * 26,
        colorScheme: scheme,
        wigglePhase: Math.random() * Math.PI * 2,
        wiggleSpeed: 0.08 + Math.random() * 0.04,
        segments: [],
        zDepth,
        targetZDepth: zDepth,
        rollAngle: 0,
        finPhase: Math.random() * Math.PI * 2,
      };
    });

    // Schooling minnows
    const minnows: MinnowFish[] = Array.from({ length: 8 }).map((_, i) => ({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.5 + (Math.random() - 0.5) * 200,
      angle: Math.random() * Math.PI * 2,
      speed: 2.2 + Math.random() * 1.2,
      targetAngle: Math.random() * Math.PI * 2,
      color: i % 2 === 0 ? 'rgba(230, 245, 255, 0.75)' : 'rgba(255, 220, 180, 0.75)',
      wigglePhase: Math.random() * Math.PI * 2,
    }));

    // Seed Japanese Pond Turtles (Mauremys japonica / Kame)
    const turtles: PondTurtleState[] = [
      {
        id: 'turtle-1',
        x: width * 0.28,
        y: height * 0.35,
        angle: 0.8,
        targetAngle: 0.8,
        speed: 0.9,
        targetSpeed: 0.9,
        paddlePhase: 0,
        size: 50,
        shellPattern: 'olive',
        zDepth: 0.35,
        targetZDepth: 0.35,
        neckExtension: 0.6,
      },
      {
        id: 'turtle-2',
        x: width * 0.75,
        y: height * 0.65,
        angle: -2.1,
        targetAngle: -2.1,
        speed: 0.8,
        targetSpeed: 0.8,
        paddlePhase: 1.5,
        size: 44,
        shellPattern: 'golden',
        zDepth: 0.42,
        targetZDepth: 0.42,
        neckExtension: 0.5,
      },
    ];

    // Seed Glass Ghost Shrimps (Caridina multidentata)
    const shrimps: PondShrimpState[] = [
      { id: 'shrimp-1', x: width * 0.22, y: height * 0.80, angle: 0.4, speed: 0.8, dartTimer: 2.5, color: 'rgba(230, 245, 255, 0.7)', size: 24, zDepth: 0.85, legPhase: 0 },
      { id: 'shrimp-2', x: width * 0.42, y: height * 0.76, angle: -1.2, speed: 0.6, dartTimer: 3.8, color: 'rgba(230, 245, 255, 0.7)', size: 22, zDepth: 0.9, legPhase: 1.2 },
      { id: 'shrimp-3', x: width * 0.62, y: height * 0.84, angle: 2.0, speed: 0.9, dartTimer: 1.8, color: 'rgba(240, 250, 255, 0.7)', size: 26, zDepth: 0.82, legPhase: 2.1 },
      { id: 'shrimp-4', x: width * 0.86, y: height * 0.78, angle: -0.6, speed: 0.7, dartTimer: 4.2, color: 'rgba(230, 245, 255, 0.7)', size: 20, zDepth: 0.88, legPhase: 0.7 },
    ];

    // Seed Surface Water Striders (Gerris)
    const waterStriders: WaterStriderState[] = [
      { id: 'strider-1', x: width * 0.32, y: height * 0.22, angle: 0.5, speed: 1.2, skateTimer: 1.0, size: 26 },
      { id: 'strider-2', x: width * 0.68, y: height * 0.28, angle: -1.1, speed: 1.5, skateTimer: 2.2, size: 24 },
      { id: 'strider-3', x: width * 0.52, y: height * 0.42, angle: 2.4, speed: 1.1, skateTimer: 0.6, size: 28 },
    ];

    // Floating cherry petals
    const petals: FloatingPetal[] = Array.from({ length: 18 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 6 + Math.random() * 6,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      driftX: 0.2 + Math.random() * 0.4,
      driftY: 0.15 + Math.random() * 0.3,
      color: Math.random() > 0.4 ? 'rgba(255, 182, 193, 0.75)' : 'rgba(255, 255, 255, 0.65)',
    }));

    // Hyper-realistic Splash Particles & Dynamic Water Waves with Strict Memory Bounds
    const MAX_DROPLETS = 36;
    const MAX_BUBBLES = 26;
    const MAX_RIPPLES = 16;
    const MAX_CROWNS = 3;
    const MAX_FOODS = 6;
    const MAX_WAKES = 16;

    const ripples: WaterRipple[] = [];
    const splashDroplets: SplashDroplet[] = [];
    const splashBubbles: SplashBubble[] = [];
    const splashCrowns: SplashCrown[] = [];
    const foods: FoodPellet[] = [];
    const cursorWakes: CursorWakePoint[] = [];

    // Trigger complete splash eruption with bounded allocations
    const triggerSplash = (x: number, y: number, intensity = 1.0) => {
      const splash = createHyperRealisticSplash(x, y, intensity);
      splashDroplets.push(...splash.droplets);
      if (splashDroplets.length > MAX_DROPLETS) {
        splashDroplets.splice(0, splashDroplets.length - MAX_DROPLETS);
      }

      splashBubbles.push(...splash.bubbles);
      if (splashBubbles.length > MAX_BUBBLES) {
        splashBubbles.splice(0, splashBubbles.length - MAX_BUBBLES);
      }

      ripples.push(...splash.ripples);
      if (ripples.length > MAX_RIPPLES) {
        ripples.splice(0, ripples.length - MAX_RIPPLES);
      }

      if (splash.crown) {
        splashCrowns.push(splash.crown);
        if (splashCrowns.length > MAX_CROWNS) {
          splashCrowns.splice(0, splashCrowns.length - MAX_CROWNS);
        }
      }
      playProceduralSplashSound(intensity);
    };

    // Pointer listeners with rate-limiting
    let lastWakeTime = 0;
    let lastPointerDispatch = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const now = performance.now();
      if (now - lastPointerDispatch < 16) return; // Limit to ~60Hz dispatch
      lastPointerDispatch = now;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const prevX = mouseRef.current.x;
      const prevY = mouseRef.current.y;
      const vx = clientX - prevX;
      const vy = clientY - prevY;
      const speed = Math.hypot(vx, vy);

      mouseRef.current = {
        x: clientX,
        y: clientY,
        vx,
        vy,
        active: true,
        lastMove: Date.now(),
      };

      if (speed > 8 && now - lastWakeTime > 40) {
        lastWakeTime = now;
        cursorWakes.push({
          x: clientX,
          y: clientY,
          radius: 6,
          opacity: 0.7,
        });
        if (cursorWakes.length > MAX_WAKES) {
          cursorWakes.splice(0, cursorWakes.length - MAX_WAKES);
        }

        // Fast pointer motion creates gentle surface wake ripples
        if (speed > 22 && Math.random() < 0.45) {
          ripples.push({
            id: `wake-${Date.now()}-${Math.random()}`,
            x: clientX,
            y: clientY,
            radius: 8,
            maxRadius: 58,
            opacity: 0.45,
            speed: 2.0,
            amplitude: 4,
          });
          if (ripples.length > MAX_RIPPLES) {
            ripples.splice(0, ripples.length - MAX_RIPPLES);
          }
        }
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // 1. Drop nutritious sinking food pellet (strictly bounded)
      foods.push({
        x: clientX,
        y: clientY,
        depth: 0,
        life: 1.0,
        size: 5.5,
      });
      if (foods.length > MAX_FOODS) {
        foods.splice(0, foods.length - MAX_FOODS);
      }

      // 2. Trigger hyper-realistic multi-layered splash physics
      triggerSplash(clientX, clientY, 1.25);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);

    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();
    let globalWavePhase = 0;

    const render = (time: number) => {
      if (!isTabVisible) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      // Clamped delta time (prevents physics exploding after lag spikes or tab focus)
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;
      globalWavePhase += dt * 0.75;

      const isDark = isDarkRef.current;
      const scrollY = scrollYRef.current;
      const scrollParallax = scrollY * 0.28;

      // Dampen scroll velocity smoothly
      scrollVelocityRef.current *= 0.92;
      const scrollPush = scrollVelocityRef.current * 0.15;

      // ==========================================
      // 1. Water Background with Caustic Depth Gradients
      // ==========================================
      if (isDark) {
        const grad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4 - scrollParallax * 0.15,
          60,
          width * 0.5,
          height * 0.5 - scrollParallax * 0.15,
          Math.max(width, height) * 0.9
        );
        grad.addColorStop(0, '#0a2336');
        grad.addColorStop(0.5, '#04121b');
        grad.addColorStop(1, '#01060a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        const grad = ctx.createLinearGradient(0, -scrollParallax * 0.25, width, height);
        grad.addColorStop(0, '#15759c');
        grad.addColorStop(0.35, '#1b8eb8');
        grad.addColorStop(0.7, '#136787');
        grad.addColorStop(1, '#093f53');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // ==========================================
      // 2. Procedural Organic Caustics Mesh (Dynamic Water Web)
      // ==========================================
      ctx.save();
      const causticAlpha = isDark ? 0.045 : 0.09;
      ctx.strokeStyle = isDark ? `rgba(0, 245, 212, ${causticAlpha * 1.5})` : `rgba(255, 255, 255, ${causticAlpha * 1.8})`;
      ctx.lineWidth = 1.6;

      const causticGridX = 9;
      const causticGridY = 7;
      const cellW = width / causticGridX;
      const cellH = height / causticGridY;

      for (let cx = 0; cx < causticGridX; cx++) {
        for (let cy = 0; cy < causticGridY; cy++) {
          const px = cx * cellW + Math.sin(globalWavePhase * 0.7 + cy * 0.8) * 28;
          const py = cy * cellH + Math.cos(globalWavePhase * 0.6 + cx * 0.8) * 28 - scrollParallax * 0.08;
          const r = 24 + Math.sin(globalWavePhase * 0.9 + cx + cy) * 12;

          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.stroke();

          // Caustic connecting filament
          if (cx < causticGridX - 1) {
            const nextPx = (cx + 1) * cellW + Math.sin(globalWavePhase * 0.7 + cy * 0.8) * 28;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo((px + nextPx) * 0.5, py + Math.sin(globalWavePhase + cx) * 16, nextPx, py);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // ==========================================
      // 3. Volumetric Sunlight God Rays
      // ==========================================
      ctx.save();
      const rayAngle = -0.32;
      const rayGrad = ctx.createLinearGradient(0, 0, width, height * 0.8);
      if (isDark) {
        rayGrad.addColorStop(0, 'rgba(0, 245, 212, 0.035)');
        rayGrad.addColorStop(0.5, 'rgba(114, 9, 183, 0.02)');
        rayGrad.addColorStop(1, 'transparent');
      } else {
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
        rayGrad.addColorStop(0.4, 'rgba(200, 245, 255, 0.06)');
        rayGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = rayGrad;
      for (let r = 0; r < 4; r++) {
        const rayOffset = (r * width * 0.32 + Math.sin(globalWavePhase * 0.35 + r) * 45) % width;
        ctx.beginPath();
        ctx.moveTo(rayOffset, 0);
        ctx.lineTo(rayOffset + 150, 0);
        ctx.lineTo(rayOffset - 170 + Math.tan(rayAngle) * height, height);
        ctx.lineTo(rayOffset - 330 + Math.tan(rayAngle) * height, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // 4. Cursor Fluid Wake
      // ==========================================
      for (let w = cursorWakes.length - 1; w >= 0; w--) {
        const pt = cursorWakes[w];
        pt.radius += dt * 26;
        pt.opacity -= dt * 1.1;

        if (pt.opacity <= 0.02) {
          cursorWakes.splice(w, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0, 245, 212, ${pt.opacity * 0.45})`
          : `rgba(255, 255, 255, ${pt.opacity * 0.35})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // 5. Floating Sakura / Cherry Petals
      // ==========================================
      petals.forEach((petal) => {
        petal.x += petal.driftX + Math.sin(globalWavePhase + petal.y * 0.01) * 0.4;
        petal.y += petal.driftY + scrollPush * 0.12;
        petal.angle += petal.rotSpeed;

        if (petal.x > width + 20) petal.x = -20;
        if (petal.y > height + 20) petal.y = -20;

        ctx.save();
        ctx.translate(petal.x, petal.y - scrollParallax * 0.1);
        ctx.rotate(petal.angle);

        // Soft drop shadow
        ctx.beginPath();
        ctx.ellipse(3, 5, petal.radius * 0.5, petal.radius, 0.2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(5, 30, 45, 0.22)';
        ctx.fill();

        // Delicate curved petal
        ctx.beginPath();
        ctx.moveTo(0, -petal.radius);
        ctx.bezierCurveTo(
          petal.radius * 0.8,
          -petal.radius * 0.5,
          petal.radius * 0.6,
          petal.radius * 0.8,
          0,
          petal.radius
        );
        ctx.bezierCurveTo(
          -petal.radius * 0.6,
          petal.radius * 0.8,
          -petal.radius * 0.8,
          -petal.radius * 0.5,
          0,
          -petal.radius
        );
        ctx.fillStyle = isDark ? 'rgba(255, 112, 166, 0.82)' : petal.color;
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // 6. Food Pellets Sinking
      // ==========================================
      for (let f = foods.length - 1; f >= 0; f--) {
        const food = foods[f];
        food.life -= dt * 0.04;
        food.depth += dt * 14;

        if (food.life <= 0) {
          foods.splice(f, 1);
          continue;
        }

        ctx.save();
        // Underwater shadow
        ctx.beginPath();
        ctx.arc(food.x + 4, food.y + 6 + food.depth * 0.2, food.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(10, 40, 50, 0.25)';
        ctx.fill();

        // Pellet
        ctx.beginPath();
        ctx.arc(food.x, food.y + food.depth * 0.1, food.size, 0, Math.PI * 2);
        ctx.fillStyle = '#b45309';
        ctx.fill();

        // Glistening highlight
        ctx.beginPath();
        ctx.arc(food.x - 1.5, food.y - 1.5 + food.depth * 0.1, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // 7. Cavitation Micro-Bubbles (Aeration from Splash)
      // ==========================================
      for (let b = splashBubbles.length - 1; b >= 0; b--) {
        const bub = splashBubbles[b];
        const updated = updateSplashBubble(bub, dt, 40);
        if (!updated) {
          // Bubble popped at surface: create tiny micro-pop ripple
          ripples.push({
            id: `pop-${Date.now()}-${b}`,
            x: bub.x,
            y: bub.y,
            radius: 2,
            maxRadius: 18,
            opacity: 0.5,
            speed: 1.5,
            amplitude: 2,
          });
          splashBubbles.splice(b, 1);
          continue;
        }
        splashBubbles[b] = updated;

        ctx.save();
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, updated.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0, 245, 212, ${updated.opacity * 0.85})`
          : `rgba(255, 255, 255, ${updated.opacity * 0.75})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Spherical glint
        ctx.beginPath();
        ctx.arc(
          updated.x - updated.radius * 0.35,
          updated.y - updated.radius * 0.35,
          updated.radius * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // 8. Hyper-Realistic Concentric Refractive Ripples
      // ==========================================
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        const updated = updateRipple(rip, 1);
        if (!updated || updated.opacity <= 0.01) {
          ripples.splice(r, 1);
          continue;
        }
        ripples[r] = updated;

        ctx.save();
        // Outer dark refractive trough
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, updated.radius + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0, 0, 0, ${updated.opacity * 0.45})`
          : `rgba(5, 30, 45, ${updated.opacity * 0.35})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Main bright wave crest (Fresnel highlight)
        ctx.beginPath();
        ctx.arc(updated.x, updated.y, updated.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(0, 245, 212, ${updated.opacity * 0.85})`
          : `rgba(255, 255, 255, ${updated.opacity * 0.75})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Inner secondary harmonic wave
        if (updated.radius > 18) {
          ctx.beginPath();
          ctx.arc(updated.x, updated.y, updated.radius * 0.62, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(180, 100, 255, ${updated.opacity * 0.4})`
            : `rgba(220, 245, 255, ${updated.opacity * 0.45})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ==========================================
      // 9. Schooling Minnows
      // ==========================================
      const leadX = fishes[0] ? fishes[0].x : width * 0.5;
      const leadY = fishes[0] ? fishes[0].y : height * 0.5;

      minnows.forEach((m) => {
        let mTargetX = leadX;
        let mTargetY = leadY;

        if (foods.length > 0) {
          mTargetX = foods[0].x;
          mTargetY = foods[0].y;
          m.speed = 3.6;
        } else {
          m.speed = 2.4;
        }

        m.targetAngle = Math.atan2(mTargetY - m.y, mTargetX - m.x) + (Math.random() - 0.5) * 0.5;
        m.angle = turnTowardAngle(m.angle, m.targetAngle, 0.1);
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed + scrollPush * 0.2;
        m.wigglePhase += m.speed * 0.25;

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, 7.5, 2.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#00f5d4' : m.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-10, -2.5 + Math.sin(m.wigglePhase) * 2);
        ctx.lineTo(-10, 2.5 + Math.sin(m.wigglePhase) * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // 9b. Benthic Glass Ghost Shrimps (Caridina)
      // ==========================================
      shrimps.forEach((shrimp, idx) => {
        const updated = updateShrimpKinematics(shrimp, dt, { width, height });
        shrimps[idx] = updated;
        renderGhostShrimp(ctx, updated, isDark);
      });

      // ==========================================
      // 9c. Japanese Pond Turtles (Kame)
      // ==========================================
      const foodTarget = foods.length > 0 ? { x: foods[0].x, y: foods[0].y } : null;
      turtles.forEach((turtle, idx) => {
        const updated = updateTurtleKinematics(turtle, dt, foodTarget, { width, height });
        turtles[idx] = updated;
        renderRealisticTurtle(ctx, updated, isDark);
      });

      // ==========================================
      // 9d. Surface Water Striders (Gerris)
      // ==========================================
      waterStriders.forEach((strider, idx) => {
        const updated = updateWaterStrider(strider, dt, { width, height });
        waterStriders[idx] = updated;
        renderWaterStrider(ctx, updated, isDark);
      });

      // ==========================================
      // 10. Masterwork Nishikigoi (Japanese Koi Fish)
      // Sort fish by zDepth so deeper fish render beneath surface fish
      // ==========================================
      const sortedFishes = [...fishes].sort((a, b) => (b.zDepth || 0.5) - (a.zDepth || 0.5));

      sortedFishes.forEach((fish) => {
        let targetX: number | null = null;
        let targetY: number | null = null;

        // Food pursuit
        if (foods.length > 0) {
          let closestDist = 999999;
          let closestFood: FoodPellet | null = null;
          let closestIdx = -1;
          foods.forEach((food, fIdx) => {
            const d = Math.hypot(food.x - fish.x, food.y - fish.y);
            if (d < closestDist && d < 550) {
              closestDist = d;
              closestFood = food;
              closestIdx = fIdx;
            }
          });

          if (closestFood) {
            targetX = (closestFood as FoodPellet).x;
            targetY = (closestFood as FoodPellet).y;
            fish.targetSpeed = 3.2;
            fish.targetZDepth = 0.1; // rise to surface to feed

            // Nibble food & produce gentle mouth bubbles
            if (closestDist < 30) {
              foods.splice(closestIdx, 1);
              for (let nb = 0; nb < 5; nb++) {
                splashBubbles.push({
                  id: `nibble-${Date.now()}-${nb}`,
                  x: fish.x + (Math.random() - 0.5) * 8,
                  y: fish.y + (Math.random() - 0.5) * 8,
                  depth: 8 + Math.random() * 15,
                  radius: 1.8 + Math.random() * 2.8,
                  opacity: 0.9,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -4 - Math.random() * 8,
                  wobble: Math.random() * Math.PI,
                  wobbleSpeed: 5,
                });
              }
            }
          }
        }

        // Pointer reaction
        const mouse = mouseRef.current;
        if (!targetX && mouse.active && Date.now() - mouse.lastMove < 3000) {
          const dToMouse = Math.hypot(mouse.x - fish.x, mouse.y - fish.y);
          if (dToMouse < 180) {
            // Dart away gracefully
            const awayAngle = Math.atan2(fish.y - mouse.y, fish.x - mouse.x);
            fish.targetAngle = awayAngle + (Math.random() - 0.5) * 0.4;
            fish.targetSpeed = 3.8;
            fish.targetZDepth = 0.6; // dive deeper on startle
          } else if (dToMouse < 360 && Math.random() < 0.04) {
            targetX = mouse.x;
            targetY = mouse.y;
            fish.targetSpeed = 2.0;
          }
        }

        if (targetX !== null && targetY !== null) {
          fish.targetAngle = Math.atan2(targetY - fish.y, targetX - fish.x);
        } else {
          if (Math.random() < 0.02) {
            fish.targetAngle += (Math.random() - 0.5) * 1.2;
            fish.targetSpeed = 1.4 + Math.random() * 1.1;
            fish.targetZDepth = 0.2 + Math.random() * 0.6;
          }
        }

        // Smooth zDepth interpolation
        const currentZ = fish.zDepth || 0.5;
        const targetZ = fish.targetZDepth || 0.5;
        fish.zDepth = currentZ + (targetZ - currentZ) * 0.04;

        // Boundary steering
        const boundary = calculateBoundarySteering(fish.x, fish.y, width, height, 90);
        if (boundary.repelStrength > 0 && boundary.targetAngle !== undefined) {
          fish.targetAngle = boundary.targetAngle;
          fish.targetSpeed = Math.max(fish.targetSpeed, 2.2);
        }

        const prevAngle = fish.angle;
        fish.angle = turnTowardAngle(fish.angle, fish.targetAngle, 0.065);
        fish.rollAngle = (fish.angle - prevAngle) * 3.5; // banking roll into turns
        fish.speed += (fish.targetSpeed - fish.speed) * 0.055;

        fish.x += Math.cos(fish.angle) * fish.speed;
        fish.y += Math.sin(fish.angle) * fish.speed + scrollPush * 0.18;

        fish.wigglePhase += fish.speed * 0.13;
        fish.finPhase = (fish.finPhase || 0) + fish.speed * 0.18;

        // 14 articulated vertebrae nodes for smooth anatomical spinal wave
        const segmentCount = 14;
        const segmentSpacing = fish.length / segmentCount;
        fish.segments = calculateFishSpine(
          fish.x,
          fish.y,
          fish.angle,
          segmentCount,
          segmentSpacing,
          fish.wigglePhase,
          0.38
        );

        renderHyperRealisticKoi(ctx, fish, isDark);
      });

      // ==========================================
      // 10b. Worthington Vertical Splash Crowns (Liquid Eruption Ring)
      // ==========================================
      for (let c = splashCrowns.length - 1; c >= 0; c--) {
        const crown = splashCrowns[c];
        const updated = updateSplashCrown(crown, dt);
        if (!updated) {
          splashCrowns.splice(c, 1);
          continue;
        }
        splashCrowns[c] = updated;

        ctx.save();
        ctx.translate(updated.x, updated.y);
        ctx.beginPath();
        const spikes = updated.spikes;
        const outerR = updated.radius * 1.35;
        const innerR = updated.radius * 0.72;
        for (let s = 0; s < spikes * 2; s++) {
          const sAngle = (s / (spikes * 2)) * Math.PI * 2;
          const r = s % 2 === 0 ? outerR : innerR;
          const px = Math.cos(sAngle) * r;
          const py = Math.sin(sAngle) * r * 0.45 - (s % 2 === 0 ? updated.height * 0.6 : 0);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.fillStyle = isDark
          ? `rgba(0, 245, 212, ${updated.opacity * 0.38})`
          : `rgba(235, 250, 255, ${updated.opacity * 0.45})`;
        ctx.fill();

        ctx.strokeStyle = isDark
          ? `rgba(0, 245, 212, ${updated.opacity * 0.88})`
          : `rgba(255, 255, 255, ${updated.opacity * 0.92})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // 11. Ballistic Airborne Water Splash Droplets
      // Rendered AFTER fish so droplets erupt in front with genuine 3D height
      // ==========================================
      for (let d = splashDroplets.length - 1; d >= 0; d--) {
        const droplet = splashDroplets[d];
        const updateResult = updateSplashDroplet(droplet, dt, 420);

        if (updateResult.landed) {
          // Droplet landed on water surface: create miniature secondary ripple!
          ripples.push({
            id: `drop-land-${Date.now()}-${d}`,
            x: droplet.x,
            y: droplet.y,
            radius: 3,
            maxRadius: 26,
            opacity: 0.55,
            speed: 1.6,
            amplitude: 2,
          });
          splashDroplets.splice(d, 1);
          continue;
        }

        if (!updateResult.droplet) {
          splashDroplets.splice(d, 1);
          continue;
        }

        const drop = updateResult.droplet;
        splashDroplets[d] = drop;

        ctx.save();
        // 1. Water surface drop shadow (shows elevation z above surface!)
        const shadowOffsetY = drop.z * 0.35;
        const shadowScale = Math.max(0.4, 1.0 - drop.z / 180);
        ctx.beginPath();
        ctx.ellipse(
          drop.x,
          drop.y + shadowOffsetY,
          drop.radius * shadowScale,
          drop.radius * 0.6 * shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = isDark
          ? `rgba(0, 0, 0, ${drop.opacity * 0.45 * shadowScale})`
          : `rgba(5, 30, 45, ${drop.opacity * 0.32 * shadowScale})`;
        ctx.fill();

        // 2. 3D Airborne Liquid Droplet Sphere
        const dropY = drop.y - drop.z; // elevated position
        const dropletGrad = ctx.createRadialGradient(
          drop.x - drop.radius * 0.35,
          dropY - drop.radius * 0.35,
          drop.radius * 0.1,
          drop.x,
          dropY,
          drop.radius
        );

        if (isDark) {
          dropletGrad.addColorStop(0, '#ffffff');
          dropletGrad.addColorStop(0.3, 'rgba(0, 245, 212, 0.9)');
          dropletGrad.addColorStop(0.8, 'rgba(10, 45, 60, 0.85)');
          dropletGrad.addColorStop(1, 'rgba(0, 245, 212, 0.4)');
        } else {
          dropletGrad.addColorStop(0, '#ffffff');
          dropletGrad.addColorStop(0.35, 'rgba(235, 250, 255, 0.95)');
          dropletGrad.addColorStop(0.75, 'rgba(160, 220, 245, 0.8)');
          dropletGrad.addColorStop(1, 'rgba(50, 140, 180, 0.5)');
        }

        ctx.beginPath();
        ctx.arc(drop.x, dropY, drop.radius, 0, Math.PI * 2);
        ctx.fillStyle = dropletGrad;
        ctx.fill();

        // Specular glistening sun glint
        ctx.beginPath();
        ctx.arc(
          drop.x - drop.radius * 0.35,
          dropY - drop.radius * 0.35,
          drop.radius * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }

      // ==========================================
      // 12. Floating Lily Pads with Lotus Blooms
      // ==========================================
      lilyPads.forEach((pad, idx) => {
        const bob = Math.sin(globalWavePhase * 0.8 + idx * 1.5) * 4;
        const padX = pad.x + bob * 0.5;
        const padY = pad.y + bob - scrollParallax * 0.15;

        ctx.save();
        ctx.translate(padX, padY);
        ctx.rotate(pad.rotation + Math.sin(globalWavePhase * 0.3 + idx) * 0.05);

        // Soft underwater shadow
        ctx.beginPath();
        ctx.arc(8, 14, pad.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(5, 30, 45, 0.35)';
        ctx.fill();

        // Lily pad leaf with characteristic notch
        ctx.beginPath();
        ctx.arc(0, 0, pad.radius, 0.25, Math.PI * 2 - 0.25);
        ctx.lineTo(0, 0);
        ctx.closePath();

        if (isDark) {
          const padGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, pad.radius);
          padGrad.addColorStop(0, '#0d3838');
          padGrad.addColorStop(0.8, '#082329');
          padGrad.addColorStop(1, '#05181d');
          ctx.fillStyle = padGrad;
          ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
          ctx.lineWidth = 1.5;
        } else {
          const padGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, pad.radius);
          padGrad.addColorStop(0, '#388e6a');
          padGrad.addColorStop(0.7, '#286f52');
          padGrad.addColorStop(1, '#1b523c');
          ctx.fillStyle = padGrad;
          ctx.strokeStyle = '#48a87f';
          ctx.lineWidth = 1.2;
        }
        ctx.fill();
        ctx.stroke();

        // Leaf veins
        ctx.beginPath();
        for (let a = 0.5; a < Math.PI * 2 - 0.5; a += 0.8) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * (pad.radius * 0.85), Math.sin(a) * (pad.radius * 0.85));
        }
        ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.22)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dew drops
        pad.dewDrops.forEach((dew) => {
          ctx.beginPath();
          ctx.arc(dew.x, dew.y, dew.r, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 255, 255, 0.75)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(dew.x - dew.r * 0.3, dew.y - dew.r * 0.3, dew.r * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        });

        // Delicate Lotus Bloom
        if (pad.hasFlower) {
          ctx.save();
          ctx.translate(pad.radius * 0.25, -pad.radius * 0.2);
          const petalCount = 8;
          for (let p = 0; p < petalCount; p++) {
            const pAngle = (p / petalCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(pAngle);
            ctx.beginPath();
            ctx.ellipse(0, -12, 6, 14, 0, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.95)' : '#ffffff';
            ctx.fill();
            if (isDark) {
              ctx.strokeStyle = 'rgba(255, 112, 166, 0.6)';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            }
            ctx.restore();
          }
          // Golden stamen core
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fillStyle = pad.flowerColor || '#ffd166';
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      });

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto z-0 select-none transition-opacity duration-700"
      aria-hidden="true"
      data-testid="pond-canvas"
    />
  );
};

/**
 * Hyper-Realistic Procedural Rendering of Japanese Nishikigoi (Koi Fish)
 * - 14-point articulated dynamic spinal kinematics with hydrodynamic drag
 * - Cylindrical 3D volume hull contoured to authentic Cyprinus rubrofuscus proportions
 * - Depth-dependent blurred drop shadow on pond substrate
 * - Translucent rayed pectoral fins with natural paddling stroke
 * - Iridescent pearlescent scale shimmer and wet slime-coat specular dorsal sheen
 * - 3D glassy eyes with golden iris rim and corneal reflection
 * - Drifting sensory barbels (whiskers) at mouth corners
 */
function renderHyperRealisticKoi(ctx: CanvasRenderingContext2D, fish: KoiFishState, isDark: boolean) {
  const segs = fish.segments;
  if (segs.length < 6) return;

  const zDepth = fish.zDepth !== undefined ? fish.zDepth : 0.5; // 0 = surface, 1 = deep
  const { widths } = calculateKoiBodyContour(segs.length, fish.length);

  ctx.save();

  // 1. Soft Depth-Based Underwater Shadow Cast on Pond Bed
  // Two-tier hardware-accelerated soft penumbra stroke without expensive ctx.filter rasterization
  const shadowDistX = 10 + zDepth * 18;
  const shadowDistY = 14 + zDepth * 24;
  const baseAlpha = isDark ? 0.42 * (1 - zDepth * 0.4) : 0.26 * (1 - zDepth * 0.35);

  // Outer soft diffuse shadow penumbra
  ctx.beginPath();
  ctx.moveTo(segs[0].x + shadowDistX, segs[0].y + shadowDistY);
  for (let i = 1; i < segs.length; i++) {
    ctx.lineTo(segs[i].x + shadowDistX, segs[i].y + shadowDistY);
  }
  ctx.lineWidth = fish.length * (0.44 + zDepth * 0.14);
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(0, 0, 0, ${baseAlpha * 0.35})`;
  ctx.stroke();

  // Inner core shadow umbra
  ctx.beginPath();
  ctx.moveTo(segs[0].x + shadowDistX, segs[0].y + shadowDistY);
  for (let i = 1; i < segs.length; i++) {
    ctx.lineTo(segs[i].x + shadowDistX, segs[i].y + shadowDistY);
  }
  ctx.lineWidth = fish.length * 0.26;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(0, 0, 0, ${baseAlpha * 0.65})`;
  ctx.stroke();

  // 2. Translucent Pectoral Fins (Front Wing Paddles on Segment 2)
  if (segs.length > 3) {
    const finFlutter = calculateFinFlutter(fish.finPhase || 0, fish.speed);
    const finLen = fish.length * 0.52;
    const baseSeg = segs[2];
    const spineAngle = fish.angle;

    // Left and Right Pectoral Fins
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(baseSeg.x, baseSeg.y);
      const finRot = spineAngle + side * (Math.PI * 0.48) + finFlutter.angle * side;
      ctx.rotate(finRot);
      ctx.scale(finFlutter.stretch, 1);

      // Translucent fan blade
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        finLen * 0.3,
        side * finLen * 0.2,
        finLen * 0.85,
        side * finLen * 0.1,
        finLen,
        -finLen * 0.15
      );
      ctx.bezierCurveTo(
        finLen * 0.65,
        -finLen * 0.4,
        finLen * 0.2,
        -finLen * 0.3,
        0,
        0
      );
      ctx.closePath();

      const finGrad = ctx.createLinearGradient(0, 0, finLen, 0);
      if (isDark) {
        finGrad.addColorStop(0, 'rgba(0, 245, 212, 0.7)');
        finGrad.addColorStop(1, 'rgba(0, 245, 212, 0.25)');
      } else {
        finGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        finGrad.addColorStop(1, 'rgba(255, 255, 255, 0.35)');
      }
      ctx.fillStyle = finGrad;
      ctx.fill();

      // Delicate translucent skeletal fin rays (6 rays)
      ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.85)' : 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 1;
      for (let r = 1; r <= 5; r++) {
        const factor = r / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          finLen * 0.5,
          side * finLen * 0.05 - factor * finLen * 0.2,
          finLen * (0.8 + factor * 0.2),
          -factor * finLen * 0.3
        );
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // 3. Pelvic & Anal Fins (Segments 7 & 10)
  if (segs.length > 10) {
    const pelvicSeg = segs[7];
    const pelvicLen = fish.length * 0.28;
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(pelvicSeg.x, pelvicSeg.y);
      ctx.rotate(fish.angle + side * (Math.PI * 0.55));
      ctx.beginPath();
      ctx.ellipse(0, pelvicLen * 0.4, pelvicLen * 0.22, pelvicLen * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.4)' : 'rgba(255, 255, 255, 0.65)';
      ctx.fill();
      ctx.restore();
    });
  }

  // 4. Smooth 3D Cylindrical Fish Body Silhouette
  const leftPts: Point2D[] = [];
  const rightPts: Point2D[] = [];

  for (let i = 0; i < segs.length; i++) {
    const cur = segs[i];
    let normalAngle = fish.angle + Math.PI / 2;
    if (i < segs.length - 1) {
      const next = segs[i + 1];
      normalAngle = Math.atan2(next.y - cur.y, next.x - cur.x) + Math.PI / 2;
    }
    const w = widths[i];
    leftPts.push({
      x: cur.x + Math.cos(normalAngle) * w,
      y: cur.y + Math.sin(normalAngle) * w,
    });
    rightPts.push({
      x: cur.x - Math.cos(normalAngle) * w,
      y: cur.y - Math.sin(normalAngle) * w,
    });
  }

  // Body Path
  ctx.beginPath();
  ctx.moveTo(segs[0].x, segs[0].y); // Snout
  for (let i = 0; i < leftPts.length; i++) {
    ctx.lineTo(leftPts[i].x, leftPts[i].y);
  }
  ctx.lineTo(segs[segs.length - 1].x, segs[segs.length - 1].y); // Tail wrist
  for (let i = rightPts.length - 1; i >= 0; i--) {
    ctx.lineTo(rightPts[i].x, rightPts[i].y);
  }
  ctx.closePath();

  // Base Body Color Gradient with 3D Cylindrical Shading
  if (isDark) {
    if (fish.colorScheme === 'biolum') {
      ctx.fillStyle = '#082a30';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 16;
    } else {
      ctx.fillStyle = '#09212d';
      ctx.shadowColor = '#7209b7';
      ctx.shadowBlur = 10;
    }
  } else {
    if (fish.colorScheme === 'ogon') {
      ctx.fillStyle = '#f59e0b'; // Yamabuki metallic gold
    } else if (fish.colorScheme === 'showa') {
      ctx.fillStyle = '#1e293b'; // Inky sumi black ground
    } else {
      ctx.fillStyle = '#fffdfa'; // Pearlescent white
    }
    ctx.shadowColor = 'transparent';
  }
  ctx.fill();

  // 5. Authentic Japanese Nishikigoi Markings
  if (!isDark) {
    // Kohaku & Sanke crimson Hi markings
    if (
      fish.colorScheme === 'kohaku' ||
      fish.colorScheme === 'showa' ||
      fish.colorScheme === 'tancho'
    ) {
      if (fish.colorScheme === 'tancho') {
        // Tancho: Iconic perfect crimson circular crest on crown
        ctx.save();
        const headSeg = segs[1];
        ctx.beginPath();
        ctx.arc(headSeg.x, headSeg.y, widths[1] * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.restore();
      } else {
        // Kohaku / Showa: Multi-plate organic lacquer red Hi blotches
        ctx.save();
        // Plate 1: Cranial shoulder plate
        const s1 = segs[3];
        ctx.beginPath();
        ctx.ellipse(s1.x, s1.y, widths[3] * 0.9, widths[3] * 0.92, fish.angle, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();

        // Plate 2: Midsection saddle plate
        const s2 = segs[7];
        ctx.beginPath();
        ctx.ellipse(s2.x, s2.y, widths[7] * 0.85, widths[7] * 0.88, fish.angle + 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fill();

        // Plate 3: Dorsal tail plate
        if (segs.length > 10) {
          const s3 = segs[10];
          ctx.beginPath();
          ctx.ellipse(s3.x, s3.y, widths[10] * 0.8, widths[10] * 0.82, fish.angle - 0.2, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Showa Black Sumi lacquer patches
    if (fish.colorScheme === 'showa') {
      ctx.save();
      const sMid = segs[5];
      ctx.beginPath();
      ctx.arc(sMid.x + 2, sMid.y - 2, widths[5] * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      const sHead = segs[0];
      ctx.beginPath();
      ctx.arc(sHead.x - 2, sHead.y + 1, widths[0] * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Bioluminescent neon markings in midnight mode
    ctx.save();
    const s1 = segs[3];
    ctx.beginPath();
    ctx.ellipse(s1.x, s1.y, widths[3] * 0.8, widths[3] * 0.85, fish.angle, 0, Math.PI * 2);
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 14;
    ctx.fill();

    const s2 = segs[7];
    ctx.beginPath();
    ctx.ellipse(s2.x, s2.y, widths[7] * 0.75, widths[7] * 0.8, fish.angle, 0, Math.PI * 2);
    ctx.fillStyle = '#00f5d4';
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
  }

  // 6. 3D Dorsal Specular Sheen (Wet Slime Coat Catching Sunlight)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(segs[0].x, segs[0].y);
  for (let i = 1; i < segs.length - 1; i++) {
    ctx.lineTo(segs[i].x, segs[i].y);
  }
  ctx.lineWidth = fish.length * 0.14;
  ctx.lineCap = 'round';
  ctx.strokeStyle = isDark
    ? 'rgba(0, 245, 212, 0.45)'
    : fish.colorScheme === 'ogon'
    ? 'rgba(255, 240, 180, 0.75)'
    : 'rgba(255, 255, 255, 0.78)';
  ctx.stroke();
  ctx.restore();

  // 7. Iridescent Curved Scale Arcs
  ctx.save();
  ctx.strokeStyle = isDark
    ? 'rgba(0, 245, 212, 0.25)'
    : fish.colorScheme === 'ogon'
    ? 'rgba(217, 119, 6, 0.38)'
    : 'rgba(180, 195, 210, 0.32)';
  ctx.lineWidth = 1;
  for (let i = 3; i < segs.length - 2; i += 2) {
    const s = segs[i];
    const w = widths[i] * 0.62;
    ctx.beginPath();
    ctx.arc(s.x, s.y, w, fish.angle - 0.75, fish.angle + 0.75);
    ctx.stroke();
  }
  ctx.restore();

  // 8. Snout Anatomy, Sensory Whiskers (Barbels), and Glassy 3D Eyes
  const head = segs[0];
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(fish.angle);

  // Sensory Barbels (tactile whiskers trailing from mouth corners)
  ctx.beginPath();
  ctx.moveTo(7, -3.5);
  ctx.quadraticCurveTo(14, -7, 18, -4.5);
  ctx.moveTo(7, 3.5);
  ctx.quadraticCurveTo(14, 7, 18, 4.5);
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.8)' : 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3D Glass Eyes: Golden Iris + Deep Jet Pupil + Corneal Highlight
  const eyeOffset = widths[0] * 0.58;
  [-eyeOffset, eyeOffset].forEach((ey) => {
    // Iris
    ctx.beginPath();
    ctx.arc(3.5, ey, 3.0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? '#00f5d4' : '#d97706';
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.arc(3.5, ey, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Specular corneal glint
    ctx.beginPath();
    ctx.arc(4.4, ey - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  ctx.restore();

  // 9. Gossamer Bifurcated Caudal Tail Fin with Fluted Rays
  const lastSeg = segs[segs.length - 1];
  const prevSeg = segs[segs.length - 2];
  const tailAngle = Math.atan2(lastSeg.y - prevSeg.y, lastSeg.x - prevSeg.x);
  const tailSize = fish.length * 0.52;

  ctx.save();
  ctx.translate(lastSeg.x, lastSeg.y);
  ctx.rotate(tailAngle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(tailSize * 0.45, -tailSize * 0.8, tailSize, -tailSize * 0.38);
  ctx.quadraticCurveTo(tailSize * 0.35, 0, tailSize, tailSize * 0.38);
  ctx.quadraticCurveTo(tailSize * 0.45, tailSize * 0.8, 0, 0);

  const tailGrad = ctx.createLinearGradient(0, 0, tailSize, 0);
  if (isDark) {
    tailGrad.addColorStop(0, 'rgba(0, 245, 212, 0.85)');
    tailGrad.addColorStop(1, 'rgba(0, 245, 212, 0.3)');
  } else {
    tailGrad.addColorStop(
      0,
      fish.colorScheme === 'ogon' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(255, 255, 255, 0.92)'
    );
    tailGrad.addColorStop(
      1,
      fish.colorScheme === 'ogon' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.45)'
    );
  }

  ctx.fillStyle = tailGrad;
  if (isDark) {
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 12;
  }
  ctx.fill();

  // Translucent radiating tail rays
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(tailSize * 0.88, -tailSize * 0.28);
  ctx.moveTo(0, 0);
  ctx.lineTo(tailSize * 0.92, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(tailSize * 0.88, tailSize * 0.28);
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}

/**
 * Renders a biologically realistic Japanese Pond Turtle (Mauremys japonica / Kame)
 * Features:
 * - Oval carapace with geometric vertebral, pleural, and marginal scutes
 * - Alternating breast-stroke paddle flippers
 * - Articulated neck and head with gentle yellow facial striping
 * - Soft underwater depth projection shadow
 */
function renderRealisticTurtle(
  ctx: CanvasRenderingContext2D,
  turtle: PondTurtleState,
  isDark: boolean
) {
  const { x, y, angle, size, paddlePhase, neckExtension, zDepth, shellPattern } = turtle;
  const shadowDist = 18 + zDepth * 35;

  ctx.save();
  ctx.translate(x, y);

  // 1. Soft underwater drop shadow
  ctx.save();
  ctx.translate(shadowDist * 0.4, shadowDist * 0.8);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.58, size * 0.44, 0, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(3, 20, 30, 0.28)';
  ctx.filter = `blur(${Math.max(4, Math.round(zDepth * 10))}px)`;
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();

  ctx.rotate(angle);

  // 2. Alternating webbed paddling flippers
  const strokePhase = paddlePhase;
  const frontPaddleLeft = Math.sin(strokePhase) * 0.35 + 0.1;
  const frontPaddleRight = Math.sin(strokePhase + Math.PI * 0.25) * 0.35 + 0.1;
  const rearPaddleLeft = Math.sin(strokePhase + Math.PI) * 0.3;
  const rearPaddleRight = Math.sin(strokePhase + Math.PI * 1.25) * 0.3;

  const limbColor = isDark ? '#1a3a3a' : '#475338';
  const limbAccent = isDark ? '#00f5d4' : '#a3b18a';

  // Front Left Flipper
  ctx.save();
  ctx.translate(size * 0.25, -size * 0.35);
  ctx.rotate(-0.8 + frontPaddleLeft);
  ctx.beginPath();
  ctx.ellipse(size * 0.2, 0, size * 0.25, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = limbColor;
  ctx.fill();
  ctx.restore();

  // Front Right Flipper
  ctx.save();
  ctx.translate(size * 0.25, size * 0.35);
  ctx.rotate(0.8 - frontPaddleRight);
  ctx.beginPath();
  ctx.ellipse(size * 0.2, 0, size * 0.25, size * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = limbColor;
  ctx.fill();
  ctx.restore();

  // Hind Left Flipper
  ctx.save();
  ctx.translate(-size * 0.3, -size * 0.32);
  ctx.rotate(-2.2 + rearPaddleLeft);
  ctx.beginPath();
  ctx.ellipse(size * 0.16, 0, size * 0.18, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fillStyle = limbColor;
  ctx.fill();
  ctx.restore();

  // Hind Right Flipper
  ctx.save();
  ctx.translate(-size * 0.3, size * 0.32);
  ctx.rotate(2.2 - rearPaddleRight);
  ctx.beginPath();
  ctx.ellipse(size * 0.16, 0, size * 0.18, size * 0.09, 0, 0, Math.PI * 2);
  ctx.fillStyle = limbColor;
  ctx.fill();
  ctx.restore();

  // Tail
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, 0);
  ctx.lineTo(-size * 0.65, 0);
  ctx.strokeStyle = limbColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 3. Extended Neck and Head with Fine Lateral Striping
  const headDist = size * (0.42 + neckExtension * 0.28);
  ctx.save();
  // Neck
  ctx.beginPath();
  ctx.moveTo(size * 0.25, -4);
  ctx.lineTo(headDist, -3);
  ctx.lineTo(headDist, 3);
  ctx.lineTo(size * 0.25, 4);
  ctx.fillStyle = limbColor;
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.ellipse(headDist + 5, 0, 9, 6.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = limbColor;
  ctx.fill();

  // Facial yellow stripes (Kame characteristics)
  ctx.strokeStyle = limbAccent;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(headDist + 2, -3.5);
  ctx.lineTo(headDist + 9, -2);
  ctx.moveTo(headDist + 2, 3.5);
  ctx.lineTo(headDist + 9, 2);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(headDist + 7, -3.5, 1.2, 0, Math.PI * 2);
  ctx.arc(headDist + 7, 3.5, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Carapace Shell (Smooth 3D Arched Dome)
  const shellGrad = ctx.createRadialGradient(-size * 0.05, -size * 0.05, size * 0.1, 0, 0, size * 0.6);
  if (isDark) {
    shellGrad.addColorStop(0, '#164e63');
    shellGrad.addColorStop(0.7, '#083344');
    shellGrad.addColorStop(1, '#021824');
  } else if (shellPattern === 'golden') {
    shellGrad.addColorStop(0, '#b45309');
    shellGrad.addColorStop(0.6, '#78350f');
    shellGrad.addColorStop(1, '#451a03');
  } else {
    shellGrad.addColorStop(0, '#58673a');
    shellGrad.addColorStop(0.65, '#3a4427');
    shellGrad.addColorStop(1, '#202616');
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.52, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = shellGrad;
  ctx.fill();
  ctx.strokeStyle = isDark ? '#00f5d4' : (shellPattern === 'golden' ? '#d97706' : '#283618');
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // 5. Scute Plates (Vertebral & Costal Carapace Grooves)
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.4)' : 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.0;

  // Vertebral central keel
  ctx.beginPath();
  ctx.moveTo(-size * 0.42, 0);
  ctx.lineTo(size * 0.42, 0);
  ctx.stroke();

  // Lateral costal sutures
  for (let s = -2; s <= 2; s++) {
    const sx = s * (size * 0.16);
    ctx.beginPath();
    ctx.moveTo(sx, -size * 0.32);
    ctx.lineTo(sx - size * 0.05, 0);
    ctx.lineTo(sx, size * 0.32);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders a benthic Glass Ghost Shrimp (Caridina multidentata)
 * Features:
 * - Translucent crystal body with visible amber hepatopancreas organ
 * - Long curving sensory antennae
 * - Walking pereiopods and fluttery pleopods
 */
function renderGhostShrimp(
  ctx: CanvasRenderingContext2D,
  shrimp: PondShrimpState,
  isDark: boolean
) {
  const { x, y, angle, size, legPhase } = shrimp;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 1. Long Whisker-like Antennae
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(size * 0.45, -1.5);
  ctx.quadraticCurveTo(size * 0.8, -size * 0.4, size * 1.3, -size * 0.6);
  ctx.moveTo(size * 0.45, 1.5);
  ctx.quadraticCurveTo(size * 0.8, size * 0.4, size * 1.3, size * 0.6);
  ctx.stroke();

  // 2. Walking Legs (Pereiopods)
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.7)' : 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 0.9;
  for (let l = 0; l < 4; l++) {
    const lx = size * 0.1 - l * (size * 0.08);
    const legWiggle = Math.sin(legPhase + l) * 2;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(lx, -2);
    ctx.lineTo(lx - 2, -size * 0.28 + legWiggle);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(lx, 2);
    ctx.lineTo(lx - 2, size * 0.28 - legWiggle);
    ctx.stroke();
  }

  // 3. Translucent Crystal Carapace (Cephalothorax)
  ctx.beginPath();
  ctx.ellipse(size * 0.15, 0, size * 0.25, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.25)' : 'rgba(240, 248, 255, 0.55)';
  ctx.fill();
  ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 4. Amber Internal Digestive Organ (Hepatopancreas)
  ctx.beginPath();
  ctx.ellipse(size * 0.12, 0, size * 0.1, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#00f5d4' : 'rgba(217, 119, 6, 0.65)';
  ctx.fill();

  // 5. Segmented Abdomen Tail
  const segments = 5;
  for (let s = 1; s <= segments; s++) {
    const segX = -s * (size * 0.09);
    const segW = size * (0.1 - s * 0.012);
    ctx.beginPath();
    ctx.arc(segX, 0, Math.max(1.5, segW), 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.22)' : 'rgba(240, 248, 255, 0.5)';
    ctx.fill();
  }

  // Fan Tail (Telson & Uropods)
  const tailX = -segments * (size * 0.09) - 3;
  ctx.beginPath();
  ctx.moveTo(tailX, 0);
  ctx.lineTo(tailX - 6, -5);
  ctx.lineTo(tailX - 7, 0);
  ctx.lineTo(tailX - 6, 5);
  ctx.closePath();
  ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.35)' : 'rgba(255, 255, 255, 0.65)';
  ctx.fill();

  // 6. Eyes (Dark dots)
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.beginPath();
  ctx.arc(size * 0.36, -2.5, 1.2, 0, Math.PI * 2);
  ctx.arc(size * 0.36, 2.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders a surface-skating Water Strider (Gerris)
 * Features:
 * - Signature meniscus indentation shadows beneath each foot tip where surface tension curves!
 * - Elongated hydrophobic rowing legs
 * - Slender dark body with rapid glide stroke
 */
function renderWaterStrider(
  ctx: CanvasRenderingContext2D,
  strider: WaterStriderState,
  isDark: boolean
) {
  const { x, y, angle, size } = strider;
  const shadowDist = 12;

  ctx.save();
  ctx.translate(x, y);

  // 1. Signature Surface Tension Meniscus Dimples (Shadows beneath feet on pond bed)
  const legPositions = [
    { lx: size * 0.35, ly: -size * 0.65 },
    { lx: size * 0.35, ly: size * 0.65 },
    { lx: 0, ly: -size * 0.95 },
    { lx: 0, ly: size * 0.95 },
    { lx: -size * 0.55, ly: -size * 0.8 },
    { lx: -size * 0.55, ly: size * 0.8 },
  ];

  ctx.save();
  ctx.translate(shadowDist * 0.3, shadowDist * 0.6);
  ctx.rotate(angle);
  legPositions.forEach((pos) => {
    ctx.beginPath();
    ctx.ellipse(pos.lx, pos.ly, 5.5, 4.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(5, 25, 40, 0.35)';
    ctx.fill();
  });
  ctx.restore();

  ctx.rotate(angle);

  // 2. Ultra-thin Hydrophobic Leg Struts
  ctx.strokeStyle = isDark ? '#00f5d4' : '#1e293b';
  ctx.lineWidth = 1.0;

  // Middle rowing legs (very long)
  ctx.beginPath();
  ctx.moveTo(size * 0.05, 0);
  ctx.lineTo(size * 0.1, -size * 0.45);
  ctx.lineTo(0, -size * 0.95);
  ctx.moveTo(size * 0.05, 0);
  ctx.lineTo(size * 0.1, size * 0.45);
  ctx.lineTo(0, size * 0.95);
  ctx.stroke();

  // Hind steering legs (extended backward)
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, 0);
  ctx.lineTo(-size * 0.25, -size * 0.4);
  ctx.lineTo(-size * 0.55, -size * 0.8);
  ctx.moveTo(-size * 0.15, 0);
  ctx.lineTo(-size * 0.25, size * 0.4);
  ctx.lineTo(-size * 0.55, size * 0.8);
  ctx.stroke();

  // Front legs (short predatory grasp)
  ctx.beginPath();
  ctx.moveTo(size * 0.25, 0);
  ctx.lineTo(size * 0.3, -size * 0.25);
  ctx.lineTo(size * 0.35, -size * 0.65);
  ctx.moveTo(size * 0.25, 0);
  ctx.lineTo(size * 0.3, size * 0.25);
  ctx.lineTo(size * 0.35, size * 0.65);
  ctx.stroke();

  // 3. Slender Hydrodynamic Body
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.38, size * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#00f5d4' : '#0f172a';
  ctx.fill();

  ctx.restore();
}
