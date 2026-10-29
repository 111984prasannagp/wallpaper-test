import { useState, useEffect, useRef } from 'react';

export interface ScrollBlurState {
  velocity: number;
  blurAmount: number;
  isScrolling: boolean;
  direction: 'up' | 'down' | 'idle';
  tiltShear: number;
}

/**
 * Calculates smooth scroll velocity and maps it to a subtle cinematic motion blur
 * Uses requestAnimationFrame with exponential decay for zero-lag silky recovery
 */
export function calculateScrollBlur(velocity: number, maxBlur = 3.5): number {
  const absVelocity = Math.abs(velocity);
  // Velocity under 1.5px/frame is virtually stationary
  if (absVelocity < 1.5) return 0;
  // Responsive linear ramp from 1.5 to 55px/frame for immediate, cinematic motion blur
  const normalized = Math.min(1, (absVelocity - 1.5) / 55);
  return Math.round(normalized * maxBlur * 10) / 10;
}

export function useScrollBlur(enabled = true, maxBlur = 3.5): ScrollBlurState {
  const [blurState, setBlurState] = useState<ScrollBlurState>({
    velocity: 0,
    blurAmount: 0,
    isScrolling: false,
    direction: 'idle',
    tiltShear: 0,
  });

  const lastScrollYRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());
  const idleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setBlurState({
        velocity: 0,
        blurAmount: 0,
        isScrolling: false,
        direction: 'idle',
        tiltShear: 0,
      });
      return;
    }

    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    lastTimeRef.current = performance.now();

    const updatePhysicsLoop = () => {
      // Damped decay
      velocityRef.current *= 0.88;

      if (Math.abs(velocityRef.current) < 0.2) {
        velocityRef.current = 0;
      }

      const currentBlur = calculateScrollBlur(velocityRef.current, maxBlur);
      const direction: 'up' | 'down' | 'idle' =
        velocityRef.current > 0.5 ? 'down' : velocityRef.current < -0.5 ? 'up' : 'idle';
      const tiltShear = Math.max(-1.8, Math.min(1.8, velocityRef.current * 0.05));

      setBlurState((prev) => {
        // Only update state if there is a noticeable difference to avoid redundant React renders
        if (
          Math.abs(prev.blurAmount - currentBlur) < 0.05 &&
          prev.direction === direction &&
          Math.abs(prev.velocity - velocityRef.current) < 0.2
        ) {
          if (velocityRef.current === 0 && prev.isScrolling) {
            return {
              velocity: 0,
              blurAmount: 0,
              isScrolling: false,
              direction: 'idle',
              tiltShear: 0,
            };
          }
          return prev;
        }

        return {
          velocity: velocityRef.current,
          blurAmount: currentBlur,
          isScrolling: Math.abs(velocityRef.current) > 0.8,
          direction,
          tiltShear,
        };
      });

      if (Math.abs(velocityRef.current) > 0.1) {
        animFrameRef.current = requestAnimationFrame(updatePhysicsLoop);
      } else {
        animFrameRef.current = null;
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;
      const now = performance.now();
      const dt = Math.max(1, now - lastTimeRef.current);
      lastTimeRef.current = now;

      const deltaY = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      // Instantaneous speed normalized to ~60fps frame rate (16.6ms)
      const instantVelocity = (deltaY / dt) * 16.6;

      // Responsive weighted accumulation with upper clamp
      velocityRef.current = Math.max(-75, Math.min(75, velocityRef.current * 0.4 + instantVelocity * 0.6));

      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }

      // Schedule animation decay loop if not already running
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(updatePhysicsLoop);
      }

      // Safeguard timeout to ensure reset to 0 if scroll terminates abruptly
      idleTimeoutRef.current = window.setTimeout(() => {
        velocityRef.current = 0;
        setBlurState({
          velocity: 0,
          blurAmount: 0,
          isScrolling: false,
          direction: 'idle',
          tiltShear: 0,
        });
      }, 160);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [enabled, maxBlur]);

  return blurState;
}
