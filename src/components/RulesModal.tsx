import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MAX_GUESSES, YEAR_TOLERANCE } from '../utils/gameLogic';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="rules-modal-title" className="font-display text-lg font-bold text-[#11161C]">
            How to Play Cardle India
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Identify the car sold in India from a zoomed-in photograph in{' '}
            <strong className="font-semibold text-[#11161C]">{MAX_GUESSES} attempts</strong>.
          </p>

          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-[#E04F22] mt-0.5">01.</span>
              <span>
                Select the <strong className="font-semibold text-[#11161C]">Make</strong>,{' '}
                <strong className="font-semibold text-[#11161C]">Model</strong>, and{' '}
                <strong className="font-semibold text-[#11161C]">Year</strong> from all cars sold in
                India (1954–2026).
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-[#E04F22] mt-0.5">02.</span>
              <span>
                Every wrong guess or skip zooms the camera out to reveal more of the vehicle,
                showing the full car at the end.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-xs font-bold text-[#E04F22] mt-0.5">03.</span>
              <span>
                <strong className="font-semibold text-[#11161C]">
                  ±{YEAR_TOLERANCE} Year Rule:
                </strong>{' '}
                Any year within {YEAR_TOLERANCE} years of the car&apos;s model year is accepted as
                correct. Wrong years show ↑ (newer) or ↓ (older).
              </span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-[44px] rounded-xl bg-[#11161C] text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
};
