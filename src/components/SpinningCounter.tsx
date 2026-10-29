import React, { useEffect, useState, useId } from 'react';

interface SpinningCounterProps {
  value: number; // e.g. 12348
  suffix?: string; // e.g. "+"
  label?: string; // e.g. "Downloads"
  durationMs?: number; // default 1400ms
  staggerMs?: number; // default 90ms
  className?: string;
}

export const SpinningCounter: React.FC<SpinningCounterProps> = ({
  value,
  suffix = '+',
  label = 'Downloads',
  durationMs = 1400,
  staggerMs = 90,
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const rawId = useId();
  const filterId = `spin-blur-${rawId.replace(/[:]/g, '')}`;

  useEffect(() => {
    // Trigger spin animation after initial mount
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const formattedNum = value.toLocaleString(); // e.g. "12,348"
  const chars = formattedNum.split('');

  // 10 digits per full cycle (0..9)
  const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const CELL_HEIGHT = 24; // px height per cell
  const SPINS = 2; // number of full reel spins before landing

  return (
    <span className={`inline-flex items-center font-mono select-none ${className}`}>
      {/* Directional Vertical-only Motion Streak SVG filter */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="0 1.8" />
          </filter>
        </defs>
      </svg>

      <span
        className="inline-flex items-center text-teal-300 font-bold tracking-tight"
        style={{
          fontVariantNumeric: 'tabular-nums',
          height: `${CELL_HEIGHT}px`,
        }}
      >
        {chars.map((char, colIdx) => {
          const isDigit = /\d/.test(char);
          if (!isDigit) {
            // Separator symbol like comma ","
            return (
              <span
                key={`sep-${colIdx}`}
                className="inline-flex items-center justify-center px-0.5 text-teal-300/80"
                style={{ height: `${CELL_HEIGHT}px` }}
              >
                {char}
              </span>
            );
          }

          const targetDigit = parseInt(char, 10);
          // Target Y offset = (SPINS * 10 + targetDigit) * CELL_HEIGHT
          const totalSteps = SPINS * 10 + targetDigit;
          const targetTranslateY = mounted ? -(totalSteps * CELL_HEIGHT) : 0;
          const delay = colIdx * staggerMs;

          // Build repeated 0-9 strip for the jackpot spinning roll
          const stripDigits: number[] = [];
          for (let s = 0; s <= SPINS; s++) {
            stripDigits.push(...DIGITS);
          }
          // Extra buffer
          stripDigits.push(...DIGITS);

          return (
            <span
              key={`col-${colIdx}`}
              className="relative inline-block overflow-hidden"
              style={{
                height: `${CELL_HEIGHT}px`,
                width: '0.62em',
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, #000 20%, #000 80%, transparent 100%)',
              }}
            >
              <span
                className="flex flex-col will-change-transform"
                style={{
                  transform: `translate3d(0, ${targetTranslateY}px, 0)`,
                  transition: `transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
                  filter: mounted ? 'none' : `url(#${filterId})`,
                }}
              >
                {stripDigits.map((d, dIdx) => (
                  <span
                    key={dIdx}
                    className="flex items-center justify-center"
                    style={{ height: `${CELL_HEIGHT}px` }}
                  >
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}

        {suffix && <span className="ml-0.5 text-teal-300 font-bold">{suffix}</span>}
      </span>

      {label && <span className="ml-1.5 text-teal-100/90">{label}</span>}
    </span>
  );
};
