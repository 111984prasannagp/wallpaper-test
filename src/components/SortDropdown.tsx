import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check, Flame, Sparkles, Maximize2 } from 'lucide-react';
import { SortOption } from '../utils/wallpaper-filters';

export interface SortOptionItem {
  id: SortOption;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SORT_OPTIONS: SortOptionItem[] = [
  {
    id: 'popular',
    label: 'Popularity',
    description: 'Most views & downloads',
    icon: Flame,
  },
  {
    id: 'newest',
    label: 'Newest',
    description: 'Recently added artworks',
    icon: Sparkles,
  },
  {
    id: 'resolution',
    label: 'Resolution (High to Low)',
    description: '8K & 4K Ultra HD first',
    icon: Maximize2,
  },
];

interface SortDropdownProps {
  sortBy: SortOption;
  onSelectSort: (sort: SortOption) => void;
  className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  sortBy,
  onSelectSort,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeOption =
    SORT_OPTIONS.find((opt) => opt.id === sortBy) ||
    (sortBy === 'downloads' ? SORT_OPTIONS[0] : SORT_OPTIONS[1]);

  const ActiveIcon = activeOption.icon;

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Accessible native select for form and screen-reader accessibility */}
      <select
        value={activeOption.id}
        onChange={(e) => onSelectSort(e.target.value as SortOption)}
        className="sr-only"
        aria-label="Sort wallpapers by"
        tabIndex={-1}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Styled Interactive Trigger Button */}
      <button
        type="button"
        id="sort-menu-button"
        data-testid="sort-dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort wallpapers by: ${activeOption.label}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-sans border transition-all duration-200 cursor-pointer select-none ${
          isOpen
            ? 'bg-teal-500/20 text-teal-200 border-teal-400/50 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
            : 'bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20 hover:border-teal-400/40'
        }`}
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">Sort:</span>
        <span className="font-semibold text-white tracking-wide flex items-center gap-1.5 whitespace-nowrap">
          <ActiveIcon className="w-3 h-3 text-teal-300 flex-shrink-0" />
          <span>{activeOption.label}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-teal-300' : ''
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-labelledby="sort-menu-button"
          data-testid="sort-dropdown-menu"
          className="absolute right-0 mt-2 w-64 z-[100] p-1.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-teal-500/30 shadow-[0_15px_45px_rgba(0,12,24,0.9)] ring-1 ring-white/10 focus:outline-none"
        >
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400/80 font-bold">
              Order Wallpapers
            </span>
            <span className="text-[10px] font-mono text-slate-400">3 Options</span>
          </div>

          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = activeOption.id === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  data-testid={`sort-option-${opt.id}`}
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectSort(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-500/25 to-teal-400/10 text-white border border-teal-400/40 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-teal-400/20 text-teal-200' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold truncate ${
                          isSelected ? 'text-teal-200 font-bold' : 'text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {opt.description}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0 ml-2 p-1 rounded-full bg-teal-400/20 text-teal-300">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
