/**
 * Hyper-Realistic Pond Physics, Splash Dynamics, and Nishikigoi Locomotion
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface KoiFishState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  speed: number;
  targetSpeed: number;
  turnSpeed?: number;
  length: number;
  colorScheme: 'kohaku' | 'showa' | 'ogon' | 'shiro' | 'tancho' | 'biolum';
  wigglePhase: number;
  wiggleSpeed: number;
  segments: Point2D[];
  zDepth?: number;       // 0.0 (near surface) to 1.0 (deep underwater)
  targetZDepth?: number;
  rollAngle?: number;    // banking roll when turning
  finPhase?: number;     // pectoral fin paddling phase
}

export interface WaterRipple {
  id?: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  amplitude?: number;
}

export interface SplashDroplet {
  id: string;
  x: number;
  y: number;
  z: number;      // height above water surface in pixels (z > 0 = airborne)
  vx: number;
  vy: number;
  vz: number;     // vertical velocity
  radius: number;
  opacity: number;
  life: number;   // 0 to 1
  maxLife: number;
  color?: string;
}

export interface SplashBubble {
  id: string;
  x: number;
  y: number;
  depth: number;  // depth underwater in pixels (depth > 0 = submerged)
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
  wobble: number;
  wobbleSpeed: number;
}

export interface RefractiveShockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  waveWidth: number;
  distortion: number;
}

export interface SplashCrown {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  height: number;
  opacity: number;
  spikes: number;
  life: number;
  maxLife: number;
}

/**
 * Normalizes angle to (-PI to PI)
 */
export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Linearly interpolates an angle towards a target angle smoothly
 */
export function turnTowardAngle(current: number, target: number, turnSpeed: number): number {
  const diff = normalizeAngle(target - current);
  const clampedDiff = Math.max(-turnSpeed, Math.min(turnSpeed, diff));
  return current + clampedDiff;
}

/**
 * Solves inverse kinematics for a segmented fish spine
 * Segments trail behind the head with sinusoidal traveling undulation
 */
export function calculateFishSpine(
  headX: number,
  headY: number,
  headAngle: number,
  segmentCount: number,
  segmentSpacing: number,
  wigglePhase: number,
  wiggleAmplitude: number
): Point2D[] {
  const points: Point2D[] = [{ x: headX, y: headY }];
  let currentAngle = headAngle;

  for (let i = 1; i < segmentCount; i++) {
    // S-curve wave traveling down the body with realistic phase lag
    const wave = Math.sin(wigglePhase - i * 0.42) * wiggleAmplitude * (i / segmentCount);
    currentAngle = headAngle + Math.PI + wave;

    const prev = points[i - 1];
    points.push({
      x: prev.x + Math.cos(currentAngle) * segmentSpacing,
      y: prev.y + Math.sin(currentAngle) * segmentSpacing,
    });
  }

  return points;
}

/**
 * Generates anatomical body cross-section widths and dorsal heights
 * based on authentic Nishikigoi proportions (broad shoulders, tapered peduncle)
 */
export function calculateKoiBodyContour(
  segmentCount: number,
  fishLength: number
): { widths: number[]; heights: number[] } {
  const widths: number[] = [];
  const heights: number[] = [];
  const maxHalfWidth = fishLength * 0.19;

  for (let i = 0; i < segmentCount; i++) {
    const t = i / (segmentCount - 1);
    // Torpedo profile: peak girth at ~22% of length (shoulders/pectoral girdle)
    let profile: number;
    if (t < 0.22) {
      // Snout to shoulders: rounded quadratic swell
      const nt = t / 0.22;
      profile = 0.45 + 0.55 * Math.sin(nt * Math.PI * 0.5);
    } else {
      // Shoulders to tail wrist: smooth aerodynamic taper
      const nt = (t - 0.22) / 0.78;
      profile = 1.0 - 0.85 * Math.pow(nt, 0.95);
    }
    const w = Math.max(2.5, profile * maxHalfWidth);
    widths.push(w);
    heights.push(w * 0.85); // slightly laterally compressed
  }

  return { widths, heights };
}

/**
 * Computes fluid hydrodynamic fin flutter angle for pectoral, pelvic and tail fins
 */
export function calculateFinFlutter(
  wigglePhase: number,
  speed: number,
  phaseOffset = 0
): { angle: number; stretch: number } {
  const osc = Math.sin(wigglePhase + phaseOffset);
  const angle = osc * (0.28 + Math.min(0.2, speed * 0.05));
  const stretch = 1.0 + Math.cos(wigglePhase * 0.5 + phaseOffset) * 0.08;
  return { angle, stretch };
}

/**
 * Soft boundary bounce/steering to keep fish within viewport margins
 */
export function calculateBoundarySteering(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 80
): { targetAngle?: number; repelStrength: number } {
  let pushX = 0;
  let pushY = 0;

  if (x < margin) pushX = (margin - x) / margin;
  else if (x > width - margin) pushX = -(x - (width - margin)) / margin;

  if (y < margin) pushY = (margin - y) / margin;
  else if (y > height - margin) pushY = -(y - (height - margin)) / margin;

  const repelStrength = Math.hypot(pushX, pushY);
  if (repelStrength > 0.01) {
    return {
      targetAngle: Math.atan2(pushY, pushX),
      repelStrength: Math.min(1, repelStrength),
    };
  }

  return { repelStrength: 0 };
}

/**
 * Computes ripple growth and decay over delta time
 */
export function updateRipple(ripple: WaterRipple, dt = 1): WaterRipple | null {
  const newRadius = ripple.radius + ripple.speed * dt;
  const progress = newRadius / ripple.maxRadius;
  if (progress >= 1) return null;

  const newOpacity = Math.max(0, 1 - progress);
  return {
    ...ripple,
    radius: newRadius,
    opacity: newOpacity,
  };
}

/**
 * Updates a 3D airborne water droplet with gravity, velocity, and surface impact detection
 */
export function updateSplashDroplet(
  droplet: SplashDroplet,
  dt: number,
  gravity = 480
): { droplet: SplashDroplet | null; landed: boolean } {
  const newZ = droplet.z + droplet.vz * dt;
  const newVz = droplet.vz - gravity * dt;
  const newX = droplet.x + droplet.vx * dt;
  const newY = droplet.y + droplet.vy * dt;
  const newLife = droplet.life - dt;

  // Droplet has landed back onto water surface
  if (newZ <= 0 && droplet.vz < 0) {
    return { droplet: null, landed: true };
  }

  if (newLife <= 0) {
    return { droplet: null, landed: false };
  }

  const opacity = Math.max(0, Math.min(1, (newLife / droplet.maxLife) * 1.2));
  return {
    droplet: {
      ...droplet,
      x: newX,
      y: newY,
      z: Math.max(0, newZ),
      vz: newVz,
      life: newLife,
      opacity,
    },
    landed: false,
  };
}

/**
 * Updates an underwater aeration bubble rising towards surface
 */
export function updateSplashBubble(
  bubble: SplashBubble,
  dt: number,
  buoyancy = 35
): SplashBubble | null {
  const newDepth = bubble.depth - buoyancy * dt;
  if (newDepth <= 0 || bubble.opacity <= 0.02) {
    return null; // Popped at surface
  }

  const wobble = bubble.wobble + bubble.wobbleSpeed * dt;
  const wobbleOffset = Math.sin(wobble) * 1.2;
  const newX = bubble.x + bubble.vx * dt + wobbleOffset * 0.1;
  const newY = bubble.y + bubble.vy * dt - buoyancy * dt * 0.2;
  const progress = newDepth / 60; // relative to max depth
  const opacity = Math.min(1, Math.max(0, progress * 0.95));

  return {
    ...bubble,
    x: newX,
    y: newY,
    depth: newDepth,
    wobble,
    opacity,
  };
}

/**
 * Updates a Worthington splash crown erupting and collapsing
 */
export function updateSplashCrown(crown: SplashCrown, dt: number): SplashCrown | null {
  const newLife = crown.life - dt;
  if (newLife <= 0 || crown.opacity <= 0.02) return null;

  const progress = 1 - newLife / crown.maxLife;
  const radius = crown.radius + (crown.maxRadius - crown.radius) * (dt * 6.0);
  const opacity = Math.max(0, 1 - progress);
  const height = crown.height * Math.max(0, 1 - progress * 1.3);

  return {
    ...crown,
    radius,
    height,
    opacity,
    life: newLife,
  };
}

/**
 * Generates a full hyper-realistic ballistic water splash system on impact:
 * - Upward erupting water droplets in a parabolic spray
 * - Cavitation micro-bubbles dragging beneath the surface
 * - Primary and secondary refractive Fresnel shockwaves
 * - Worthington eruption splash crown
 */
export function createHyperRealisticSplash(
  x: number,
  y: number,
  intensity = 1.0
): {
  droplets: SplashDroplet[];
  bubbles: SplashBubble[];
  ripples: WaterRipple[];
  crown: SplashCrown;
} {
  const droplets: SplashDroplet[] = [];
  const bubbles: SplashBubble[] = [];
  const ripples: WaterRipple[] = [];

  const dropletCount = Math.floor(18 * intensity + 10);
  for (let i = 0; i < dropletCount; i++) {
    const angle = (i / dropletCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = (60 + Math.random() * 125) * intensity;
    const upwardSpeed = (140 + Math.random() * 280) * intensity;
    const life = 0.55 + Math.random() * 0.65;

    droplets.push({
      id: `drop-${Date.now()}-${i}-${Math.random()}`,
      x: x + Math.cos(angle) * (Math.random() * 8),
      y: y + Math.sin(angle) * (Math.random() * 8),
      z: 2 + Math.random() * 8, // starting just above water surface
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.7, // slight perspective foreshortening
      vz: upwardSpeed,
      radius: 2.0 + Math.random() * 3.4,
      opacity: 0.96,
      life,
      maxLife: life,
    });
  }

  // Aeration micro-bubbles
  const bubbleCount = Math.floor(10 * intensity + 6);
  for (let b = 0; b < bubbleCount; b++) {
    bubbles.push({
      id: `bub-${Date.now()}-${b}-${Math.random()}`,
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 24,
      depth: 15 + Math.random() * 50,
      radius: 1.6 + Math.random() * 3.6,
      opacity: 0.92,
      vx: (Math.random() - 0.5) * 18,
      vy: -6 - Math.random() * 16,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 4.5 + Math.random() * 6.5,
    });
  }

  // Multi-phase concentric refractive ripples
  ripples.push({
    id: `rip-lead-${Date.now()}`,
    x,
    y,
    radius: 6,
    maxRadius: 165 * intensity,
    opacity: 0.95,
    speed: 3.4 * intensity,
    amplitude: 8,
  });

  ripples.push({
    id: `rip-sec-${Date.now()}`,
    x,
    y,
    radius: 2,
    maxRadius: 115 * intensity,
    opacity: 0.78,
    speed: 2.3 * intensity,
    amplitude: 5,
  });

  // Worthington splash crown
  const crown: SplashCrown = {
    id: `crown-${Date.now()}`,
    x,
    y,
    radius: 8 * intensity,
    maxRadius: 38 * intensity,
    height: 36 * intensity,
    opacity: 0.92,
    spikes: 8,
    life: 0.38,
    maxLife: 0.38,
  };

  return { droplets, bubbles, ripples, crown };
}

export interface PondTurtleState {
  id: string;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  speed: number;
  targetSpeed: number;
  paddlePhase: number;
  size: number; // shell width in px (~38 to 56)
  shellPattern: 'olive' | 'golden' | 'dark';
  zDepth: number; // 0 (surface) to 1 (substrate)
  targetZDepth: number;
  neckExtension: number;
}

export interface PondShrimpState {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  dartTimer: number;
  color: string;
  size: number;
  zDepth: number;
  legPhase: number;
}

export interface WaterStriderState {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  skateTimer: number;
  size: number;
}

/**
 * Updates turtle swimming kinematics:
 * Realistic alternating flipper stroke with propulsion pulses and gentle boundary avoidance
 */
export function updateTurtleKinematics(
  turtle: PondTurtleState,
  dt: number,
  target?: Point2D | null,
  bounds?: { width: number; height: number }
): PondTurtleState {
  let targetAngle = turtle.targetAngle;
  let targetSpeed = turtle.targetSpeed;

  if (target) {
    targetAngle = Math.atan2(target.y - turtle.y, target.x - turtle.x);
    targetSpeed = 1.6;
    turtle.targetZDepth = 0.2; // swim up toward target/food
  } else if (bounds) {
    const margin = 100;
    if (turtle.x < margin) targetAngle = 0;
    else if (turtle.x > bounds.width - margin) targetAngle = Math.PI;
    else if (turtle.y < margin) targetAngle = Math.PI / 2;
    else if (turtle.y > bounds.height - margin) targetAngle = -Math.PI / 2;
    else if (Math.random() < 0.015) {
      targetAngle += (Math.random() - 0.5) * 1.5;
      targetSpeed = 0.6 + Math.random() * 0.8;
      turtle.targetZDepth = 0.3 + Math.random() * 0.5;
    }
  }

  const angle = turnTowardAngle(turtle.angle, targetAngle, 0.04);
  const speed = turtle.speed + (targetSpeed - turtle.speed) * 0.05;
  const paddlePhase = turtle.paddlePhase + speed * 3.5 * dt;

  // Neck extends when pursuing food or surfacing
  const targetNeck = target || turtle.zDepth < 0.35 ? 1.0 : 0.45;
  const neckExtension = turtle.neckExtension + (targetNeck - turtle.neckExtension) * 0.08;

  const zDepth = turtle.zDepth + (turtle.targetZDepth - turtle.zDepth) * 0.03;

  const x = turtle.x + Math.cos(angle) * speed;
  const y = turtle.y + Math.sin(angle) * speed;

  return {
    ...turtle,
    x,
    y,
    angle,
    targetAngle,
    speed,
    targetSpeed,
    paddlePhase,
    zDepth,
    neckExtension,
  };
}

/**
 * Updates ghost shrimp benthic crawling and escape flick kinematics
 */
export function updateShrimpKinematics(
  shrimp: PondShrimpState,
  dt: number,
  bounds: { width: number; height: number }
): PondShrimpState {
  let dartTimer = shrimp.dartTimer - dt;
  let speed = shrimp.speed;
  let angle = shrimp.angle;

  if (dartTimer <= 0) {
    // Random crawl or backward tail-flip escape dart
    dartTimer = 1.2 + Math.random() * 2.8;
    if (Math.random() < 0.3) {
      // Rapid backward tail flick
      speed = 3.5 + Math.random() * 2.0;
      angle += Math.PI + (Math.random() - 0.5) * 0.6;
    } else {
      // Calm bottom crawl
      speed = 0.5 + Math.random() * 0.6;
      angle += (Math.random() - 0.5) * 1.4;
    }
  }

  // Decelerate back to crawl
  speed = Math.max(0.4, speed * 0.94);
  const legPhase = shrimp.legPhase + speed * 12 * dt;

  let x = shrimp.x + Math.cos(angle) * speed;
  let y = shrimp.y + Math.sin(angle) * speed;

  // Wrap within pond substrate
  if (x < 40) x = bounds.width - 50;
  if (x > bounds.width - 40) x = 50;
  if (y < 40) y = bounds.height - 50;
  if (y > bounds.height - 40) y = 50;

  return {
    ...shrimp,
    x,
    y,
    angle,
    speed,
    dartTimer,
    legPhase,
  };
}

/**
 * Updates water strider skating locomotion across water surface tension
 */
export function updateWaterStrider(
  strider: WaterStriderState,
  dt: number,
  bounds: { width: number; height: number }
): WaterStriderState {
  let skateTimer = strider.skateTimer - dt;
  let speed = strider.speed;
  let angle = strider.angle;

  if (skateTimer <= 0) {
    skateTimer = 0.8 + Math.random() * 1.8;
    // Sudden quick surface glide skate
    speed = 4.2 + Math.random() * 2.5;
    angle += (Math.random() - 0.5) * 1.8;
  } else {
    // Surface tension deceleration
    speed *= 0.86;
    if (speed < 0.1) speed = 0;
  }

  let x = strider.x + Math.cos(angle) * speed;
  let y = strider.y + Math.sin(angle) * speed;

  if (x < 50) { x = 60; angle = 0; }
  if (x > bounds.width - 50) { x = bounds.width - 60; angle = Math.PI; }
  if (y < 50) { y = 60; angle = Math.PI / 2; }
  if (y > bounds.height - 50) { y = bounds.height - 60; angle = -Math.PI / 2; }

  return {
    ...strider,
    x,
    y,
    angle,
    speed,
    skateTimer,
  };
}
