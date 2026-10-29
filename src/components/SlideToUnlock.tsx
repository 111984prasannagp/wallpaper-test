import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, Lock, Check, Unlock } from 'lucide-react';

interface SlideToUnlockProps {
  onUnlock: () => boolean | void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const SlideToUnlock: React.FC<SlideToUnlockProps> = ({
  onUnlock,
  disabled = false,
  label = 'slide to sign in',
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [maxDrag, setMaxDrag] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const startXRef = useRef(0);

  const updateMaxDrag = () => {
    if (trackRef.current && thumbRef.current) {
      const trackW = trackRef.current.clientWidth;
      const thumbW = thumbRef.current.clientWidth;
      const padding = 8; // 4px padding on each side
      setMaxDrag(Math.max(0, trackW - thumbW - padding));
    }
  };

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isUnlocked) return;
    setIsDragging(true);
    startXRef.current = e.clientX - dragOffset;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isUnlocked) return;
    const currentX = e.clientX;
    const delta = currentX - startXRef.current;
    // Move 1:1 with pointer, clamped between 0 and maxDrag
    const clamped = Math.max(0, Math.min(maxDrag, delta));
    setDragOffset(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || isUnlocked) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // If passed ~85% of track: latch open at far end and mark unlocked
    const threshold = maxDrag * 0.85;
    if (dragOffset >= threshold && maxDrag > 0) {
      setDragOffset(maxDrag);
      setIsUnlocked(true);
      const success = onUnlock();
      if (success === false) {
        // If login failed, spring back after brief pause
        setTimeout(() => {
          setIsUnlocked(false);
          setDragOffset(0);
        }, 600);
      }
    } else {
      // Spring back to the start with cubic-bezier(0.34, 1.56, 0.64, 1)
      setDragOffset(0);
    }
  };

  const progress = maxDrag > 0 ? dragOffset / maxDrag : 0;

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-14 rounded-full bg-black/60 border border-white/20 p-1 flex items-center select-none overflow-hidden backdrop-blur-xl shadow-lg transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{
        boxShadow: isUnlocked
          ? '0 0 25px rgba(16, 185, 129, 0.4)'
          : isDragging
          ? '0 0 15px rgba(45, 212, 191, 0.25)'
          : undefined,
      }}
    >
      {/* Dynamic green/emerald fill growing behind the thumb as it slides */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500/80 via-teal-400/80 to-cyan-400/90 pointer-events-none"
        style={{
          width: `${dragOffset + 52}px`,
          // Disable transition while dragging; spring back with cubic-bezier(0.34, 1.56, 0.64, 1) on release
          transition: isDragging
            ? 'none'
            : 'width 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />

      {/* Shimmering Center Prompt Text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono tracking-widest uppercase"
        style={{
          opacity: Math.max(0, 1 - progress * 1.5),
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
        }}
      >
        <span className="bg-gradient-to-r from-slate-400 via-white to-slate-400 bg-clip-text text-transparent animate-pulse font-semibold flex items-center space-x-1.5">
          <span>{label}</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/70 animate-bounce-x" />
        </span>
      </div>

      {/* Round draggable thumb sitting at the left of the pill track */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-transform ${
          isUnlocked
            ? 'bg-emerald-400 text-slate-950 shadow-emerald-500/50'
            : isDragging
            ? 'bg-white text-slate-900 shadow-teal-400/40 cursor-grabbing scale-105'
            : 'bg-white text-slate-800 shadow-md cursor-grab hover:scale-102'
        }`}
        style={{
          transform: `translate3d(${dragOffset}px, 0, 0)`,
          // Disable transition while dragging; spring back with cubic-bezier(0.34, 1.56, 0.64, 1)
          transition: isDragging
            ? 'none'
            : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          touchAction: 'none',
        }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Slide to unlock admin portal"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDragOffset(maxDrag);
            setIsUnlocked(true);
            onUnlock();
          }
        }}
      >
        {isUnlocked ? (
          <Check className="w-5 h-5 text-slate-950 stroke-[3] animate-scaleIn" />
        ) : isDragging ? (
          <Unlock className="w-5 h-5 text-teal-600 stroke-[2.5]" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-700 stroke-[2.5]" />
        )}
      </div>
    </div>
  );
};
