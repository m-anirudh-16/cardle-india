import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';

export type GameMode = 'daily' | 'practice';

interface HeaderProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onOpenRules,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Primary Top Row */}
      <div className="max-w-6xl mx-auto h-13 sm:h-14 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-6">
        {/* Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onModeChange('daily');
          }}
          className="font-display text-base sm:text-xl font-extrabold tracking-tight text-[#11161C] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E04F22]"
        >
          Cardle India
        </a>

        {/* Desktop & Tablet Inline Navigation */}
        <nav aria-label="Primary navigation" className="hidden sm:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onModeChange('daily')}
            className={`min-h-[44px] px-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              mode === 'daily'
                ? 'border-[#E04F22] text-[#11161C]'
                : 'border-transparent text-slate-600 hover:text-[#11161C]'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => onModeChange('practice')}
            className={`min-h-[44px] px-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              mode === 'practice'
                ? 'border-[#E04F22] text-[#11161C]'
                : 'border-transparent text-slate-600 hover:text-[#11161C]'
            }`}
          >
            Practice
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className="min-h-[44px] px-1 text-sm font-semibold text-slate-600 hover:text-[#11161C] border-b-2 border-transparent transition-colors whitespace-nowrap shrink-0"
          >
            Rules
          </button>
        </nav>

        {/* Install Action */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>
      </div>

      {/* Mobile Compact Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="sm:hidden border-t border-slate-200/80 grid grid-cols-3 px-2"
      >
        <button
          type="button"
          onClick={() => onModeChange('daily')}
          className={`min-h-[42px] text-xs font-semibold transition-colors border-b-2 ${
            mode === 'daily'
              ? 'border-[#E04F22] text-[#11161C]'
              : 'border-transparent text-slate-600 hover:text-[#11161C]'
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => onModeChange('practice')}
          className={`min-h-[42px] text-xs font-semibold transition-colors border-b-2 ${
            mode === 'practice'
              ? 'border-[#E04F22] text-[#11161C]'
              : 'border-transparent text-slate-600 hover:text-[#11161C]'
          }`}
        >
          Practice
        </button>
        <button
          type="button"
          onClick={onOpenRules}
          className="min-h-[42px] text-xs font-semibold text-slate-600 hover:text-[#11161C] border-b-2 border-transparent transition-colors"
        >
          Rules
        </button>
      </nav>
    </header>
  );
};
