import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  highlightColor?: 'teal' | 'pink' | 'white';
}

interface SlidingSegmentedTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  pillColorOverride?: string;
}

export const SlidingSegmentedTabs: React.FC<SlidingSegmentedTabsProps> = ({
  tabs,
  activeId,
  onChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [pillStyle, setPillStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];
  const isFavorites = activeTab?.id === 'favorites';

  const updatePill = () => {
    const targetBtn = buttonRefs.current.get(activeId);
    if (targetBtn && containerRef.current) {
      const left = targetBtn.offsetLeft;
      const width = targetBtn.offsetWidth;
      setPillStyle({
        left,
        width,
        opacity: 1,
      });
    }
  };

  useLayoutEffect(() => {
    updatePill();
  }, [activeId, tabs]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Keep pill synchronized if window or container resizes
    const ro = new ResizeObserver(() => {
      updatePill();
    });
    ro.observe(container);

    window.addEventListener('resize', updatePill);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePill);
    };
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center p-1 sm:p-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 select-none overflow-x-auto scrollbar-none ${className}`}
      role="tablist"
    >
      {/* 
        Sliding Highlighted Pill
        Animates left and width with cubic-bezier(0.65, 0, 0.35, 1) over ~0.4s
      */}
      <div
        className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-xl pointer-events-none transition-all ${
          isFavorites
            ? 'bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.55)]'
            : 'bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_20px_rgba(45,212,191,0.5)]'
        }`}
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
          opacity: pillStyle.opacity,
          transition:
            'left 0.4s cubic-bezier(0.65, 0, 0.35, 1), width 0.4s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.2s ease, background-color 0.4s ease',
        }}
        aria-hidden="true"
      />

      {/* Segmented Tab Buttons */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) buttonRefs.current.set(tab.id, el);
              else buttonRefs.current.delete(tab.id);
            }}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`relative z-10 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bubbly text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? isFavorites
                  ? 'text-white'
                  : 'text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
            style={{
              // Active label color crossfades as the pill arrives with cubic-bezier(0.65, 0, 0.35, 1) over ~0.4s
              transition: 'color 0.4s cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          >
            {tab.icon && (
              <span className="shrink-0 transition-transform duration-300">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? isFavorites
                      ? 'bg-pink-600/50 text-white'
                      : 'bg-slate-950/20 text-slate-950 font-bold'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
