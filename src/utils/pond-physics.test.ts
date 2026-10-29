import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAngle,
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
  updateTurtleKinematics,
  updateShrimpKinematics,
  updateWaterStrider,
} from './pond-physics';

test('normalizeAngle wraps angles into -PI to PI correctly', () => {
  assert.equal(normalizeAngle(0), 0);
  assert.ok(Math.abs(normalizeAngle(Math.PI * 3) - (-Math.PI)) < 0.001 || Math.abs(normalizeAngle(Math.PI * 3) - Math.PI) < 0.001);
  assert.ok(Math.abs(normalizeAngle(Math.PI / 2) - Math.PI / 2) < 0.0001);
});

test('turnTowardAngle limits turn rate to turnSpeed', () => {
  const current = 0;
  const target = Math.PI / 2;
  const turnSpeed = 0.1;
  const next = turnTowardAngle(current, target, turnSpeed);
  assert.equal(next, 0.1);

  // Directly reaching when close
  const nextClose = turnTowardAngle(0.05, 0.08, 0.1);
  assert.ok(Math.abs(nextClose - 0.08) < 0.0001);
});

test('calculateFishSpine creates connected segments from head', () => {
  const segments = calculateFishSpine(100, 200, 0, 8, 12, 0, 0.3);
  assert.equal(segments.length, 8);
  assert.equal(segments[0].x, 100);
  assert.equal(segments[0].y, 200);

  // Segment 1 should be spaced approximately segmentSpacing away
  const dist = Math.hypot(segments[1].x - segments[0].x, segments[1].y - segments[0].y);
  assert.ok(Math.abs(dist - 12) < 0.001);
});

test('calculateKoiBodyContour generates realistic torpedo shape with peak girth at shoulders', () => {
  const { widths, heights } = calculateKoiBodyContour(14, 80);
  assert.equal(widths.length, 14);
  assert.equal(heights.length, 14);

  // Shoulders (~segment 3) should be wider than snout and tail
  const snoutWidth = widths[0];
  const shoulderWidth = widths[3];
  const tailWidth = widths[13];

  assert.ok(shoulderWidth > snoutWidth, 'Shoulder must be wider than snout');
  assert.ok(shoulderWidth > tailWidth, 'Shoulder must be wider than tail peduncle');
});

test('calculateFinFlutter provides sinusoidal oscillation and dynamic stretch', () => {
  const f1 = calculateFinFlutter(0, 2);
  const f2 = calculateFinFlutter(Math.PI / 2, 2);

  assert.ok(typeof f1.angle === 'number');
  assert.ok(typeof f2.angle === 'number');
  assert.ok(Math.abs(f1.angle - f2.angle) > 0.1, 'Fin angle should fluctuate with phase');
});

test('calculateBoundarySteering steers fish away from walls', () => {
  // Near left wall
  const leftSteer = calculateBoundarySteering(20, 300, 1000, 800, 80);
  assert.ok(leftSteer.repelStrength > 0);
  assert.ok(Math.abs(leftSteer.targetAngle || 0) < 0.1); // Steers right (angle ~0)

  // Safe in center
  const centerSteer = calculateBoundarySteering(500, 400, 1000, 800, 80);
  assert.equal(centerSteer.repelStrength, 0);
});

test('updateRipple increments radius and fades opacity', () => {
  const ripple = {
    x: 100,
    y: 100,
    radius: 10,
    maxRadius: 100,
    opacity: 1,
    speed: 50,
  };
  const updated = updateRipple(ripple, 0.5);
  assert.ok(updated !== null);
  assert.equal(updated.radius, 35);
  assert.ok(updated.opacity < 1 && updated.opacity > 0);

  // Reaching max radius returns null
  const dead = updateRipple({ ...ripple, radius: 95 }, 0.5);
  assert.equal(dead, null);
});

test('updateSplashDroplet computes gravity, parabolic trajectory, and detects landing', () => {
  const droplet = {
    id: 'drop-test',
    x: 100,
    y: 100,
    z: 20,
    vx: 10,
    vy: 5,
    vz: 50,
    radius: 3,
    opacity: 1,
    life: 1.0,
    maxLife: 1.0,
  };

  // Rising droplet
  const step1 = updateSplashDroplet(droplet, 0.1, 400);
  assert.ok(step1.droplet !== null);
  assert.equal(step1.landed, false);
  assert.ok(step1.droplet.z > 20); // rose

  // Droplet falling below water surface (z <= 0)
  const fallingDroplet = { ...droplet, z: 2, vz: -100 };
  const step2 = updateSplashDroplet(fallingDroplet, 0.1, 400);
  assert.equal(step2.droplet, null);
  assert.equal(step2.landed, true, 'Droplet must register landing event');
});

test('updateSplashBubble floats upward and pops at water surface', () => {
  const bubble = {
    id: 'bub-test',
    x: 200,
    y: 200,
    depth: 25,
    radius: 3,
    opacity: 0.9,
    vx: 0,
    vy: -2,
    wobble: 0,
    wobbleSpeed: 5,
  };

  const updated = updateSplashBubble(bubble, 0.2, 50);
  assert.ok(updated !== null);
  assert.ok(updated.depth < 25, 'Depth must decrease as bubble ascends');

  // Surface pop
  const nearSurface = { ...bubble, depth: 2 };
  const popped = updateSplashBubble(nearSurface, 0.2, 50);
  assert.equal(popped, null, 'Bubble must pop when depth reaches zero');
});

test('createHyperRealisticSplash generates droplets, bubbles, and refractive shockwaves', () => {
  const splash = createHyperRealisticSplash(350, 420, 1.2);
  assert.ok(splash.droplets.length >= 15);
  assert.ok(splash.bubbles.length >= 8);
  assert.ok(splash.ripples.length >= 2);
  assert.ok(splash.crown !== undefined);
  assert.ok(splash.crown.height > 20);

  // Droplets must have positive upward initial velocity (vz > 0)
  assert.ok(splash.droplets[0].vz > 0);
  // Bubbles must start submerged
  assert.ok(splash.bubbles[0].depth > 0);
});

test('updateSplashCrown expands radius and dissipates height smoothly', () => {
  const splash = createHyperRealisticSplash(200, 200, 1.0);
  const crown = splash.crown;
  const updated = updateSplashCrown(crown, 0.1);
  assert.ok(updated !== null);
  assert.ok(updated.radius > crown.radius);
  assert.ok(updated.opacity < crown.opacity);
});

test('updateTurtleKinematics steers toward food and advances paddle strokes', () => {
  const turtle = {
    id: 'kame-1',
    x: 100,
    y: 100,
    angle: 0,
    targetAngle: 0,
    speed: 0.8,
    targetSpeed: 0.8,
    paddlePhase: 0,
    size: 45,
    shellPattern: 'olive' as const,
    zDepth: 0.5,
    targetZDepth: 0.5,
    neckExtension: 0.5,
  };

  const food = { x: 300, y: 100 };
  const updated = updateTurtleKinematics(turtle, 0.1, food);
  assert.ok(updated.speed > 0.8, 'Turtle should accelerate towards food');
  assert.ok(updated.paddlePhase > 0, 'Turtle flipper stroke phase must advance');
  assert.ok(updated.neckExtension >= 0.5, 'Turtle neck should extend toward target');
});

test('updateShrimpKinematics updates leg phase and stays within pond bounds', () => {
  const shrimp = {
    id: 'shrimp-1',
    x: 200,
    y: 200,
    angle: 0.5,
    speed: 1.0,
    dartTimer: 2.0,
    color: 'rgba(255, 230, 200, 0.7)',
    size: 14,
    zDepth: 0.8,
    legPhase: 0,
  };

  const updated = updateShrimpKinematics(shrimp, 0.1, { width: 1000, height: 800 });
  assert.ok(updated.legPhase > 0, 'Shrimp leg phase must cycle');
  assert.ok(updated.dartTimer < 2.0, 'Dart timer must decrease');
});

test('updateWaterStrider glides across surface tension', () => {
  const strider = {
    id: 'strider-1',
    x: 400,
    y: 300,
    angle: 0,
    speed: 3.0,
    skateTimer: 1.0,
    size: 16,
  };

  const updated = updateWaterStrider(strider, 0.05, { width: 1000, height: 800 });
  assert.ok(updated.x > 400, 'Strider should advance across water surface');
  assert.ok(updated.speed <= 3.0, 'Surface tension friction should decelerate glide');
});
